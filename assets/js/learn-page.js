/* ==========================================================================
   RoboDex́ — Learn Workspace Controller (W3Schools-Inspired 3-Column UI)
   ========================================================================== */

(function () {
  let curriculum = null;
  let profile = null;
  let snapshot = null;
  let metrics = null;

  function getParams() {
    const p = new URLSearchParams(window.location.search);
    return {
      lessonId: p.get('lesson'),
      quizModuleId: p.get('quiz')
    };
  }

  function findLessonMeta(lessonId) {
    for (let mIdx = 0; mIdx < curriculum.modules.length; mIdx++) {
      const mod = curriculum.modules[mIdx];
      for (let lIdx = 0; lIdx < mod.lessons.length; lIdx++) {
        if (mod.lessons[lIdx].id === lessonId) {
          return { mod, lesson: mod.lessons[lIdx], mIdx, lIdx };
        }
      }
    }
    return null;
  }

  function getAdjacentLessons(lessonId) {
    const flat = [];
    curriculum.modules.forEach((m) => m.lessons.forEach((l) => flat.push({ ...l, moduleId: m.id })));
    const idx = flat.findIndex((x) => x.id === lessonId);
    return {
      prev: idx > 0 ? flat[idx - 1] : null,
      next: idx >= 0 && idx < flat.length - 1 ? flat[idx + 1] : null
    };
  }

  function renderSidebar(activeLessonId, activeQuizModuleId) {
    const sidebar = document.getElementById('learn-sidebar');
    if (!sidebar) return;

    const lockMode = profile ? profile.lockProgression : true;

    sidebar.innerHTML = `
      <div class="sidebar-progress-box">
        <div class="flex items-center justify-between mb-sm">
          <strong style="font-size:0.86rem;">Course Progress</strong>
          <span class="badge badge-cyan">${metrics.overallPercent}%</span>
        </div>
        <div class="progress-track sm">
          <div class="progress-fill" style="width:${metrics.overallPercent}%"></div>
        </div>
        <div class="text-xs text-muted mt-sm">
          ${metrics.completedLessons}/${metrics.totalLessons} lessons · ${metrics.exercisesPassed} exercises · ${metrics.quizzesPassed}/${metrics.totalQuizzes} quizzes
        </div>
      </div>

      ${curriculum.modules.map((mod) => {
        const isCurrentMod =
          mod.id === activeQuizModuleId ||
          mod.lessons.some((l) => l.id === activeLessonId);
        const modStat = metrics.moduleStats.find((s) => s.moduleId === mod.id);
        return `
          <div class="sidebar-module ${isCurrentMod ? 'expanded' : ''}" data-mod="${mod.id}">
            <button type="button" class="sidebar-module-btn" aria-expanded="${isCurrentMod ? 'true' : 'false'}">
              <span>${window.RoboDexApp.escapeHtml(mod.shortTitle)}</span>
              <span class="text-xs text-muted">${modStat ? modStat.completedLessons : 0}/${mod.lessons.length}</span>
            </button>
            <ul class="sidebar-lessons">
              ${mod.lessons.map((l) => {
                const done = metrics.completedLessonSet.has(l.id);
                const unlocked = window.RoboDexProgress.isLessonUnlocked(
                  curriculum,
                  metrics.completedLessonSet,
                  l.id,
                  lockMode
                );
                const isActive = l.id === activeLessonId;
                const icon = done ? '✓' : unlocked ? '○' : '🔒';
                return `
                  <li>
                    <a href="./learn.html?lesson=${encodeURIComponent(l.id)}"
                       class="sidebar-lesson-link ${isActive ? 'active' : ''} ${!unlocked ? 'locked' : ''}"
                       data-unlocked="${unlocked}">
                      <span class="lesson-state-icon" aria-hidden="true">${icon}</span>
                      <span>${window.RoboDexApp.escapeHtml(l.title)}</span>
                    </a>
                  </li>
                `;
              }).join('')}
              <li>
                <a href="./learn.html?quiz=${encodeURIComponent(mod.id)}"
                   class="sidebar-lesson-link ${activeQuizModuleId === mod.id ? 'active' : ''}">
                  <span class="lesson-state-icon" aria-hidden="true">${modStat && modStat.quiz && modStat.quiz.passed ? '★' : '📝'}</span>
                  <span><strong>Module Quiz</strong></span>
                </a>
              </li>
            </ul>
          </div>
        `;
      }).join('')}
    `;

    sidebar.querySelectorAll('.sidebar-module-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const parent = btn.closest('.sidebar-module');
        const expanded = parent.classList.toggle('expanded');
        btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      });
    });
  }

  function renderTOC(sections) {
    const tocList = document.getElementById('toc-list');
    if (!tocList) return;
    tocList.innerHTML = sections
      .map((s) => `<li><a href="#${s.id}">${window.RoboDexApp.escapeHtml(s.label)}</a></li>`)
      .join('');

    const links = Array.from(tocList.querySelectorAll('a'));
    const onScroll = () => {
      let currentId = sections[0] ? sections[0].id : '';
      for (const s of sections) {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top <= 120) {
          currentId = s.id;
        }
      }
      links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === `#${currentId}`));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  async function refreshState() {
    snapshot = await window.RoboDexDB.getProfileSnapshot(profile.id);
    metrics = window.RoboDexProgress.computeMetrics(curriculum, snapshot);
  }

  async function renderLesson(lessonId) {
    const main = document.getElementById('learn-main');
    const meta = findLessonMeta(lessonId);

    if (!meta) {
      renderSidebar(null, null);
      renderTOC([]);
      main.innerHTML = `
        <div class="lesson-article">
          <div class="callout callout-danger">
            <div class="callout-title">Lesson Not Found</div>
            <p>We could not find a lesson with ID <code>${window.RoboDexApp.escapeHtml(lessonId)}</code>. It may have been typed incorrectly or removed.</p>
            <div class="flex flex-wrap gap-sm mt-sm">
              <a class="btn btn-primary btn-sm" href="./learn.html?lesson=m01-l01">Go to Module 01, Lesson 1</a>
              <a class="btn btn-secondary btn-sm" href="./academy.html">Browse Full Curriculum</a>
            </div>
          </div>
        </div>
      `;
      return;
    }

    const lockMode = profile ? profile.lockProgression : true;
    const unlocked = window.RoboDexProgress.isLessonUnlocked(
      curriculum,
      metrics.completedLessonSet,
      lessonId,
      lockMode
    );

    renderSidebar(lessonId, null);

    if (!unlocked) {
      const adj = getAdjacentLessons(lessonId);
      renderTOC([]);
      main.innerHTML = `
        <div class="lesson-article">
          <span class="badge badge-warning">Sequential Progression Active</span>
          <h1 class="mt-sm">🔒 ${window.RoboDexApp.escapeHtml(meta.lesson.title)}</h1>
          <div class="callout callout-warning mt-md">
            <div class="callout-title">Complete the Previous Lesson Checkpoint First</div>
            <p>To help you build genuine programming foundations without skipping key concepts, RoboDex́ unlocks each lesson after you complete the checkpoint in the previous lesson.</p>
            <div class="flex flex-wrap gap-sm mt-md">
              ${adj.prev ? `<a class="btn btn-primary" href="./learn.html?lesson=${encodeURIComponent(adj.prev.id)}">Go to Previous Lesson: ${window.RoboDexApp.escapeHtml(adj.prev.title)}</a>` : ''}
              <a class="btn btn-secondary" href="./profiles.html">Change Lock Preference in Profile</a>
            </div>
          </div>
        </div>
      `;
      return;
    }

    let modData;
    try {
      modData = await window.RoboDexApp.loadJSON(`./data/lessons/${meta.mod.id}.json`);
    } catch (err) {
      main.innerHTML = `
        <div class="lesson-article">
          <div class="callout callout-danger">
            <div class="callout-title">Unable to Load Lesson Data</div>
            <p>${window.RoboDexApp.escapeHtml(err.message)}</p>
            <p class="text-sm text-muted">If you opened this HTML file directly via <code>file://</code>, browser security blocks JSON fetching. Run RoboDex́ through a local web server (e.g., <code>python3 -m http.server</code>) or GitHub Pages.</p>
          </div>
        </div>
      `;
      return;
    }

    const lesson = modData.lessons.find((l) => l.id === lessonId);
    if (!lesson) {
      main.innerHTML = `<div class="callout callout-danger">Lesson record missing inside ${meta.mod.id}.json.</div>`;
      return;
    }

    // Record visit (does NOT mark lesson complete!)
    await window.RoboDexDB.saveLessonVisit(profile.id, lesson.id, meta.mod.id);
    await refreshState();
    renderSidebar(lesson.id, null);

    const isDone = metrics.completedLessonSet.has(lesson.id);
    const adj = getAdjacentLessons(lesson.id);

    const tocSections = [
      { id: 'sec-objectives', label: 'Learning Objectives' },
      { id: 'sec-concept', label: 'Concept Explanation' },
      { id: 'sec-analogy', label: 'Beginner Analogy' },
      { id: 'sec-syntax', label: 'Syntax Breakdown' },
      { id: 'sec-examples', label: 'Code Examples' },
      { id: 'sec-line-by-line', label: 'Line-by-Line Walkthrough' },
      { id: 'sec-arduino-app', label: 'Real-World Arduino Use' },
      { id: 'sec-mistakes', label: 'Common Mistakes' },
      { id: 'sec-try-it', label: 'Try It Yourself' },
      { id: 'sec-exercises', label: 'Practice Exercises' },
      { id: 'sec-summary', label: 'Summary & Checkpoint' }
    ];
    renderTOC(tocSections);

    main.innerHTML = `
      <article class="lesson-article">
        <div class="flex flex-wrap items-center gap-xs mb-sm">
          <span class="badge badge-blue">${window.RoboDexApp.escapeHtml(meta.mod.shortTitle)}</span>
          <span class="badge ${isDone ? 'badge-success' : 'badge-cyan'}" id="lesson-status-pill">
            ${isDone ? '✓ Checkpoint Completed' : 'In Progress'}
          </span>
          <span class="text-xs text-muted">Est. ${lesson.estimatedMinutes || 12} min</span>
        </div>

        <!-- 1. Lesson Title -->
        <h1>${window.RoboDexApp.escapeHtml(lesson.title)}</h1>

        <!-- 2. Short Introduction -->
        <p style="font-size:1.06rem; color:var(--text-primary);">${window.RoboDexApp.escapeHtml(lesson.introduction)}</p>

        ${lesson.diagram ? `
          <div class="diagram-frame">
            <img src="./assets/diagrams/${window.RoboDexApp.escapeHtml(lesson.diagram.file)}" alt="${window.RoboDexApp.escapeHtml(lesson.diagram.caption)}">
            <div class="diagram-caption">${window.RoboDexApp.escapeHtml(lesson.diagram.caption)}</div>
          </div>
        ` : ''}

        <!-- 3. Learning Objectives -->
        <section class="lesson-section" id="sec-objectives">
          <h2 class="lesson-section-title">1. Learning Objectives</h2>
          <div class="callout callout-info">
            <div class="callout-title">By the end of this lesson, you will be able to:</div>
            <ul style="margin:0.4rem 0 0 1.2rem; padding:0;">
              ${lesson.objectives.map((o) => `<li>${window.RoboDexApp.escapeHtml(o)}</li>`).join('')}
            </ul>
          </div>
        </section>

        <!-- 4. Concept Explanation -->
        <section class="lesson-section" id="sec-concept">
          <h2 class="lesson-section-title">2. Concept Explanation</h2>
          ${lesson.conceptExplanation.map((p) => `<p>${window.RoboDexApp.escapeHtml(p)}</p>`).join('')}
        </section>

        <!-- 5. Beginner-Friendly Analogy -->
        <section class="lesson-section" id="sec-analogy">
          <h2 class="lesson-section-title">3. Beginner-Friendly Analogy</h2>
          <div class="callout">
            <div class="callout-title">💡 Think of it this way</div>
            <p style="margin:0;">${window.RoboDexApp.escapeHtml(lesson.analogy)}</p>
          </div>
        </section>

        <!-- 6. Syntax Explanation -->
        <section class="lesson-section" id="sec-syntax">
          <h2 class="lesson-section-title">4. Syntax Explanation</h2>
          <p>${window.RoboDexApp.escapeHtml(lesson.syntaxExplanation.summary)}</p>
          <div class="code-block">
            <div class="code-block-header"><span>Syntax Pattern</span></div>
            <pre><code>${window.RoboDexApp.highlightCpp(lesson.syntaxExplanation.pattern)}</code></pre>
          </div>
          ${lesson.syntaxExplanation.rules && lesson.syntaxExplanation.rules.length ? `
            <ul style="margin:0.75rem 0 0 1.2rem;">
              ${lesson.syntaxExplanation.rules.map((r) => `<li>${window.RoboDexApp.escapeHtml(r)}</li>`).join('')}
            </ul>
          ` : ''}
        </section>

        <!-- 7. Code Examples -->
        <section class="lesson-section" id="sec-examples">
          <h2 class="lesson-section-title">5. Code Examples</h2>
          ${lesson.codeExamples.map((ex, i) => `
            <div class="mb-md">
              <h3>Example ${i + 1}: ${window.RoboDexApp.escapeHtml(ex.title)}</h3>
              <p class="text-sm">${window.RoboDexApp.escapeHtml(ex.description)}</p>
              <div class="code-block">
                <div class="code-block-header">
                  <span>${window.RoboDexApp.escapeHtml(ex.filename || 'example.ino')}</span>
                  <button type="button" class="btn btn-secondary btn-sm copy-example-btn" data-ex-idx="${i}">Copy</button>
                </div>
                <pre><code>${window.RoboDexApp.highlightCpp(ex.code)}</code></pre>
              </div>
            </div>
          `).join('')}
        </section>

        <!-- 8. Line-by-Line Code Explanation -->
        <section class="lesson-section" id="sec-line-by-line">
          <h2 class="lesson-section-title">6. Line-by-Line Code Explanation</h2>
          <div class="line-explain-list">
            ${lesson.lineByLine.map((item) => `
              <div class="line-explain-item">
                <code>${window.RoboDexApp.escapeHtml(item.code)}</code>
                <span>${window.RoboDexApp.escapeHtml(item.explanation)}</span>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- 9. Real-World Arduino Application -->
        <section class="lesson-section" id="sec-arduino-app">
          <h2 class="lesson-section-title">7. Real-World Arduino Application</h2>
          <div class="callout callout-success">
            <div class="callout-title">🔧 How Robotics Engineers Use This</div>
            <p style="margin:0;">${window.RoboDexApp.escapeHtml(lesson.realWorldApplication)}</p>
          </div>
        </section>

        <!-- 10. Common Mistakes -->
        <section class="lesson-section" id="sec-mistakes">
          <h2 class="lesson-section-title">8. Common Mistakes to Avoid</h2>
          <div class="grid grid-2">
            ${lesson.commonMistakes.map((m) => `
              <div class="callout callout-warning" style="margin:0;">
                <div class="callout-title">⚠ ${window.RoboDexApp.escapeHtml(m.mistake)}</div>
                <p class="text-sm" style="margin:0;"><strong>Fix:</strong> ${window.RoboDexApp.escapeHtml(m.fix)}</p>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- 11. Try It Yourself -->
        <section class="lesson-section" id="sec-try-it">
          <h2 class="lesson-section-title">9. Try It Yourself</h2>
          <p>Edit the sketch below, experiment with values, or download the <code>.ino</code> file to test on your board in Arduino IDE.</p>
          <div id="try-it-editor-host"></div>
        </section>

        <!-- 12. Exercises -->
        <section class="lesson-section" id="sec-exercises">
          <h2 class="lesson-section-title">10. Lesson Exercises</h2>
          <p>Check your understanding before completing this lesson. Exercise scores contribute <strong>50%</strong> toward your course mastery.</p>
          <div id="lesson-exercises-host"></div>
        </section>

        <!-- 13. Lesson Summary & Checkpoint -->
        <section class="lesson-section" id="sec-summary">
          <h2 class="lesson-section-title">11. Lesson Summary</h2>
          <ul style="margin:0.4rem 0 0 1.2rem;">
            ${lesson.summary.map((s) => `<li>${window.RoboDexApp.escapeHtml(s)}</li>`).join('')}
          </ul>

          <div class="checkpoint-box">
            <div class="flex flex-wrap items-center justify-between gap-md">
              <div>
                <h3 style="margin-bottom:0.25rem;">Lesson Checkpoint</h3>
                <p class="text-sm" style="margin:0;">
                  Opening a lesson does not mark it complete. Confirm this checkpoint once you understand the concept and have practiced the exercises above.
                </p>
              </div>
              <button type="button" id="complete-checkpoint-btn" class="btn ${isDone ? 'btn-secondary' : 'btn-primary'}">
                ${isDone ? '✓ Checkpoint Completed' : 'Complete Lesson Checkpoint'}
              </button>
            </div>
          </div>
        </section>

        ${lesson.relatedProjectId ? `
          <div class="callout callout-info mt-md">
            <div class="callout-title">🚀 Apply This in a Guided Project</div>
            <p style="margin-bottom:0.5rem;">Ready to see how this lesson connects to real hardware? Explore the linked project pathway.</p>
            <a class="btn btn-secondary btn-sm" href="./projects.html?project=${encodeURIComponent(lesson.relatedProjectId)}">Open Project Pathway →</a>
          </div>
        ` : ''}

        <!-- 14. Previous & Next Lesson Navigation -->
        <nav class="lesson-nav-bar" aria-label="Lesson Pagination">
          <div>
            ${adj.prev ? `<a class="btn btn-secondary" href="./learn.html?lesson=${encodeURIComponent(adj.prev.id)}">← Previous: ${window.RoboDexApp.escapeHtml(adj.prev.title)}</a>` : '<span></span>'}
          </div>
          <div class="flex flex-wrap gap-sm">
            ${meta.lIdx === meta.mod.lessons.length - 1 ? `<a class="btn btn-accent" href="./learn.html?quiz=${encodeURIComponent(meta.mod.id)}">Take Module Quiz →</a>` : ''}
            ${adj.next ? `<a class="btn btn-primary" href="./learn.html?lesson=${encodeURIComponent(adj.next.id)}">Next: ${window.RoboDexApp.escapeHtml(adj.next.title)} →</a>` : ''}
          </div>
        </nav>
      </article>
    `;

    // Bind copy buttons for static code examples
    main.querySelectorAll('.copy-example-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const idx = Number(btn.dataset.exIdx);
        const code = lesson.codeExamples[idx].code;
        try {
          await navigator.clipboard.writeText(code);
          window.RoboDexApp.showToast('Example code copied.');
        } catch {
          window.RoboDexApp.showToast('Copy failed — please select and copy manually.');
        }
      });
    });

    // Mount Try It Yourself Editor
    window.RoboDexEditor.mount(document.getElementById('try-it-editor-host'), lesson.tryItYourself);

    // Mount Exercises
    window.RoboDexExercises.renderExercises(
      document.getElementById('lesson-exercises-host'),
      lesson.exercises,
      {
        profileId: profile.id,
        lessonId: lesson.id,
        moduleId: meta.mod.id,
        exerciseMap: metrics.exerciseMap,
        onProgressChange: async () => {
          await refreshState();
          renderSidebar(lesson.id, null);
        }
      }
    );

    // Checkpoint completion button
    const cpBtn = document.getElementById('complete-checkpoint-btn');
    cpBtn.addEventListener('click', async () => {
      await window.RoboDexDB.completeLessonCheckpoint(profile.id, lesson.id, meta.mod.id);
      await refreshState();
      renderSidebar(lesson.id, null);
      cpBtn.textContent = '✓ Checkpoint Completed';
      cpBtn.className = 'btn btn-secondary';
      const pill = document.getElementById('lesson-status-pill');
      if (pill) {
        pill.className = 'badge badge-success';
        pill.textContent = '✓ Checkpoint Completed';
      }
      window.RoboDexApp.showToast('Checkpoint saved! Next lesson unlocked.');
    });
  }

  async function renderQuizPage(moduleId) {
    const main = document.getElementById('learn-main');
    const mod = curriculum.modules.find((m) => m.id === moduleId);
    renderSidebar(null, moduleId);
    renderTOC([]);

    if (!mod) {
      main.innerHTML = `<div class="callout callout-danger">Module quiz not found for ID <code>${window.RoboDexApp.escapeHtml(moduleId)}</code>.</div>`;
      return;
    }

    try {
      const allQuizzes = await window.RoboDexApp.loadJSON('./data/quizzes/quizzes.json');
      const quizData = allQuizzes[moduleId];
      const priorAttempt = metrics.quizMap.get(moduleId) || null;
      window.RoboDexQuiz.renderQuiz(main, quizData, {
        profileId: profile.id,
        moduleId,
        priorAttempt,
        onQuizComplete: async () => {
          await refreshState();
          renderSidebar(null, moduleId);
        }
      });
    } catch (err) {
      main.innerHTML = `<div class="callout callout-danger">Could not load quizzes: ${window.RoboDexApp.escapeHtml(err.message)}</div>`;
    }
  }

  async function init() {
    profile = await window.RoboDexDB.ensureActiveProfile();
    curriculum = await window.RoboDexApp.loadJSON('./data/curriculum.json');
    await refreshState();

    // Mobile sidebar drawer toggle
    const toggleBtn = document.getElementById('mobile-sidebar-btn');
    const sidebar = document.getElementById('learn-sidebar');
    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener('click', () => {
        const open = sidebar.classList.toggle('open');
        toggleBtn.textContent = open ? '✕ Close Topics' : '☰ Course Topics';
      });
    }

    const { lessonId, quizModuleId } = getParams();
    if (quizModuleId) {
      await renderQuizPage(quizModuleId);
    } else {
      const targetLesson = lessonId || profile.lastVisitedLesson || 'm01-l01';
      await renderLesson(targetLesson);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    init().catch((err) => {
      const main = document.getElementById('learn-main');
      if (main) {
        main.innerHTML = `<div class="callout callout-danger"><strong>Startup Error:</strong> ${window.RoboDexApp.escapeHtml(err.message)}</div>`;
      }
    });
  });
})();
