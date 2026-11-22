/* ==========================================================================
   RoboDex́ — Stage 2 Boards Learning Environment Controller
   - Hub View: 4 Board Families & 15 Distinct Variants with live per-profile progress
   - Workspace View: 8 Structured Lessons (A–H) per Variant, Specs Table, Pin Mastery,
     Electrical Safety, Editable .ino Examples, Board Exercises, Variant Quiz,
     Official Reference Links, and Contextual Programming School Links.
   ========================================================================== */

(function () {
  let profile = null;
  let boardsData = null;
  let snapshot = null;
  let boardMetrics = null;

  function getParams() {
    const p = new URLSearchParams(window.location.search);
    return {
      variantId: p.get('variant'),
      lessonId: p.get('lesson'),
      quizMode: p.get('quiz') === '1'
    };
  }

  async function refreshBoardState() {
    snapshot = await window.RoboDexDB.getProfileSnapshot(profile.id);
    profile = snapshot.profile;
    boardMetrics = window.RoboDexProgress.computeBoardMetrics(boardsData, snapshot);
  }

  function renderHub(activeFamily = 'all') {
    const root = document.getElementById('boards-app-root');
    const esc = window.RoboDexApp.escapeHtml;

    const visibleVariants = boardsData.variants.filter((v) => activeFamily === 'all' || v.familyId === activeFamily);
    const activeFamObj = boardsData.families.find((f) => f.id === activeFamily);

    root.innerHTML = `
      <section class="bloom-hero">
        <svg class="bloom-hero-curves" viewBox="0 0 1440 320" preserveAspectRatio="none" fill="none" aria-hidden="true">
          <path d="M-40,220 C340,60 720,300 1480,100 L1480,-20 L-40,-20 Z" fill="rgba(216,180,254,0.12)"/>
        </svg>
        <div class="container" style="position:relative; z-index:2;">
          <span class="badge" style="background:rgba(255,255,255,0.14); color:#fff; border-color:rgba(255,255,255,0.28);">
            4 Board Families · ${boardsData.variants.length} Distinct Hardware Variants
          </span>
          <h1 class="mt-sm">Boards Learning Environment</h1>
          <p style="max-width:680px;">
            Select your exact microcontroller board variant to master its real architecture, logic voltage, pin restrictions, power safety, IDE setup, board-specific code, exercises, and troubleshooting.
          </p>
          <div class="flex flex-wrap gap-sm mt-md">
            <span class="badge" style="background:rgba(255,255,255,0.16); color:#fff; border-color:rgba(255,255,255,0.28);">
              ${boardMetrics.completedBoardLessons} / ${boardMetrics.totalBoardLessons} board lessons completed
            </span>
            <span class="badge" style="background:rgba(255,255,255,0.16); color:#fff; border-color:rgba(255,255,255,0.28);">
              ${boardMetrics.passedBoardQuizzes} / ${boardMetrics.totalVariants} variant assessments passed
            </span>
          </div>
        </div>
        <svg class="hero-wave-divider" viewBox="0 0 1440 64" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,26 C400,72 980,-16 1440,32 L1440,64 L0,64 Z" fill="var(--bg-divider-fill)"/>
        </svg>
      </section>

      <main class="page-body">
        <div class="container">
          <!-- Family Filter Bar -->
          <div class="tab-bar" role="tablist" aria-label="Filter Board Families">
            <button type="button" class="tab-btn ${activeFamily === 'all' ? 'active' : ''}" data-family="all">All 15 Variants</button>
            ${boardsData.families.map((f) => `
              <button type="button" class="tab-btn ${activeFamily === f.id ? 'active' : ''}" data-family="${f.id}">
                ${esc(f.name)}
              </button>
            `).join('')}
          </div>

          ${activeFamObj ? `
            <div class="callout callout-warning mb-lg">
              <div class="callout-title">${esc(activeFamObj.name)} — Critical Hardware Distinction</div>
              <p class="text-sm" style="margin:0;">${esc(activeFamObj.familyWarning)}</p>
            </div>
          ` : `
            <div class="callout callout-info mb-lg">
              <div class="callout-title">Every Variant Matters — Never Assume Identical Specs</div>
              <p class="text-sm" style="margin:0;">Uno R3 vs R4, Nano 5V vs 3.3V variants, Mega 2560, and ESP32 chip series differ in voltage, pin restrictions, wireless radios, and USB interfaces. Pick your exact hardware variant below.</p>
            </div>
          `}

          <div class="grid grid-3">
            ${visibleVariants.map((v) => {
              const stat = boardMetrics.variantStats.find((s) => s.variantId === v.id);
              const is3v3 = v.logicVoltage.includes('3.3V');
              return `
                <div class="card card-hover flex" style="flex-direction:column; justify-content:space-between;">
                  <div>
                    <div class="card-header">
                      <span class="badge ${is3v3 ? 'badge-warning' : 'badge-success'}">${esc(v.logicVoltage)}</span>
                      <span class="badge ${stat.skill.cls}">${stat.skill.label}</span>
                    </div>
                    <h3>${esc(v.name)}</h3>
                    <p class="text-xs text-muted" style="margin-bottom:0.45rem;"><strong>MCU:</strong> ${esc(v.mcu)}</p>
                    <p class="text-xs text-muted" style="margin-bottom:0.6rem;"><strong>Wireless:</strong> ${esc(v.wireless)}</p>
                    <p class="text-sm">${esc(v.bestFor)}</p>
                    <div class="text-xs text-muted mb-sm">
                      ${stat.completedLessons}/${stat.totalLessons} lessons · ${stat.exercisesPassed}/${stat.exercisesTotal} exercises · Quiz: ${stat.quizBestScore !== null ? `${stat.quizBestScore}%` : 'Not taken'}
                    </div>
                    <div class="progress-track sm mb-md">
                      <div class="progress-fill" style="width:${stat.percent}%"></div>
                    </div>
                  </div>
                  <div class="flex flex-wrap gap-xs">
                    <a class="btn btn-primary btn-sm" href="./boards.html?variant=${encodeURIComponent(v.id)}&lesson=${encodeURIComponent(stat.lastLessonId)}">
                      ${stat.completedLessons > 0 ? 'Continue Path →' : 'Start Learning →'}
                    </a>
                    <button type="button" class="btn ${stat.selected ? 'btn-accent' : 'btn-secondary'} btn-sm" data-pin-board="${v.id}">
                      ${stat.selected ? '★ My Board' : '+ My Board'}
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </main>
    `;

    root.querySelectorAll('[data-family]').forEach((btn) => {
      btn.addEventListener('click', () => renderHub(btn.dataset.family));
    });

    root.querySelectorAll('[data-pin-board]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        await window.RoboDexDB.toggleSelectedBoardVariant(profile.id, btn.dataset.pinBoard);
        await refreshBoardState();
        window.RoboDexApp.showToast('Updated your selected board variants.');
        renderHub(activeFamily);
      });
    });
  }

  async function renderVariantWorkspace(variantId, lessonId, quizMode) {
    const root = document.getElementById('boards-app-root');
    const esc = window.RoboDexApp.escapeHtml;
    const variant = boardsData.variants.find((v) => v.id === variantId);

    if (!variant) {
      root.innerHTML = `
        <div class="container" style="padding:2.5rem 1.75rem;">
          <div class="callout callout-danger">
            <div class="callout-title">Board Variant Not Found</div>
            <p>Could not find board variant <code>${esc(variantId)}</code>.</p>
            <a class="btn btn-primary btn-sm" href="./boards.html">← Back to All Board Variants</a>
          </div>
        </div>
      `;
      return;
    }

    const family = boardsData.families.find((f) => f.id === variant.familyId);
    const activeLesson = quizMode ? null : (variant.lessons.find((l) => l.id === lessonId) || variant.lessons[0]);

    if (activeLesson) {
      await window.RoboDexDB.saveBoardLessonVisit(profile.id, variant.id, activeLesson.id);
      await refreshBoardState();
    }

    const rec = (snapshot.boards || []).find((b) => b.boardId === variant.id) || {};
    const doneSet = new Set(rec.completedLessons || []);
    const vStat = boardMetrics.variantStats.find((s) => s.variantId === variant.id);

    const sidebarHtml = `
      <aside class="learn-sidebar" aria-label="Board Variant Lessons">
        <a href="./boards.html" class="btn btn-secondary btn-sm mb-md" style="width:100%;">← All 15 Board Variants</a>
        <div class="sidebar-progress-box">
          <div class="flex items-center justify-between mb-sm">
            <strong style="font-size:0.84rem; font-family:var(--font-display);">${esc(variant.name)}</strong>
            <span class="badge badge-bloom">${vStat.percent}%</span>
          </div>
          <div class="progress-track sm">
            <div class="progress-fill" style="width:${vStat.percent}%"></div>
          </div>
          <div class="text-xs text-muted mt-sm">
            ${vStat.completedLessons}/${vStat.totalLessons} lessons · ${vStat.skill.label}
          </div>
        </div>

        <ul class="sidebar-lessons" style="display:block; padding:0;">
          ${variant.lessons.map((l) => {
            const done = doneSet.has(l.id);
            const active = activeLesson && l.id === activeLesson.id;
            return `
              <li>
                <a href="./boards.html?variant=${encodeURIComponent(variant.id)}&lesson=${encodeURIComponent(l.id)}"
                   class="sidebar-lesson-link ${active ? 'active' : ''}">
                  <span class="lesson-state-icon">${done ? '✓' : esc(l.sectionCode)}</span>
                  <span>${esc(l.title)}</span>
                </a>
              </li>
            `;
          }).join('')}
          <li class="mt-sm">
            <a href="./boards.html?variant=${encodeURIComponent(variant.id)}&quiz=1"
               class="sidebar-lesson-link ${quizMode ? 'active' : ''}">
              <span class="lesson-state-icon">${vStat.quizPassed ? '★' : '📝'}</span>
              <span><strong>Variant Assessment Quiz</strong></span>
            </a>
          </li>
        </ul>
      </aside>
    `;

    const rightRailHtml = `
      <aside class="learn-toc" aria-label="Board Reference & Links">
        <div class="toc-heading">Verified Sources</div>
        <ul style="list-style:none; padding:0; margin:0 0 1.25rem; display:grid; gap:0.45rem;">
          ${variant.sources.map((s) => `
            <li class="text-xs"><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)} ↗</a></li>
          `).join('')}
        </ul>
        <div class="toc-heading">Hardware Photo Status</div>
        <p class="text-xs text-muted">${esc(variant.photoStatus.fallbackText)}</p>
        <div class="toc-heading mt-md">Family Note</div>
        <p class="text-xs text-muted">${esc(family.familyWarning)}</p>
      </aside>
    `;

    if (quizMode) {
      const passScore = Number(window.RoboDexPrefs.get('quizPassScore')) || 70;
      const qData = variant.quiz;
      root.innerHTML = `
        <div class="learn-shell">
          ${sidebarHtml}
          <main class="learn-content">
            <div class="lesson-article">
              <span class="badge badge-bloom">${esc(variant.name)} · Variant Assessment</span>
              <h1 class="mt-sm">${esc(qData.title)}</h1>
              <p>${esc(qData.description)} (Passing threshold: ${passScore}%)</p>
              <form id="board-quiz-form">
                ${qData.questions.map((q, idx) => `
                  <div class="quiz-question" data-bq="${idx}">
                    <span class="badge badge-bloom mb-sm">Question ${idx + 1} · ${esc(q.category)}</span>
                    <h3>${esc(q.prompt)}</h3>
                    <div class="exercise-options">
                      ${q.options.map((opt, oi) => `
                        <label class="exercise-option">
                          <input type="radio" name="bq_${idx}" value="${oi}">
                          <span>${esc(opt)}</span>
                        </label>
                      `).join('')}
                    </div>
                    <div class="exercise-feedback" data-bq-fb></div>
                  </div>
                `).join('')}
                <div class="flex gap-sm mt-md">
                  <button type="submit" class="btn btn-primary">Submit Board Assessment</button>
                  <button type="button" id="bq-retake" class="btn btn-secondary">Retake</button>
                </div>
              </form>
              <div id="bq-summary" class="mt-md"></div>
            </div>
          </main>
          ${rightRailHtml}
        </div>
      `;

      const form = document.getElementById('board-quiz-form');
      const sum = document.getElementById('bq-summary');
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        let correct = 0;
        for (let i = 0; i < qData.questions.length; i++) {
          if (!form.querySelector(`input[name="bq_${i}"]:checked`)) {
            sum.innerHTML = '<div class="callout callout-warning">Please answer all questions before submitting.</div>';
            return;
          }
        }
        qData.questions.forEach((q, i) => {
          const val = Number(form.querySelector(`input[name="bq_${i}"]:checked`).value);
          const ok = val === q.correctIndex;
          if (ok) correct++;
          const fb = form.querySelector(`[data-bq="${i}"] [data-bq-fb]`);
          fb.className = `exercise-feedback show ${ok ? 'correct' : 'incorrect'}`;
          fb.innerHTML = `<strong>${ok ? '✓ Correct' : `✗ Incorrect — Correct: ${esc(q.options[q.correctIndex])}`}</strong><p style="margin:0.3rem 0 0;">${esc(q.explanation)}</p>`;
        });
        const pct = Math.round((correct / qData.questions.length) * 100);
        const passed = pct >= passScore;
        await window.RoboDexDB.saveBoardQuizAttempt(profile.id, variant.id, {
          scorePercent: pct, correctCount: correct, totalQuestions: qData.questions.length, passed
        });
        await refreshBoardState();
        sum.innerHTML = `<div class="callout ${passed ? 'callout-success' : 'callout-danger'}"><strong>${passed ? 'Assessment Passed!' : 'Keep Reviewing'}</strong> — Scored ${pct}% (${correct}/${qData.questions.length}). Saved to your local profile.</div>`;
        window.RoboDexApp.showToast(`Board quiz scored: ${pct}%`);
      });
      document.getElementById('bq-retake').addEventListener('click', () => {
        form.reset();
        form.querySelectorAll('[data-bq-fb]').forEach((el) => { el.className = 'exercise-feedback'; el.innerHTML = ''; });
        sum.innerHTML = '';
      });
      return;
    }

    // Lesson View
    const lIdx = variant.lessons.findIndex((l) => l.id === activeLesson.id);
    const prevL = lIdx > 0 ? variant.lessons[lIdx - 1] : null;
    const nextL = lIdx < variant.lessons.length - 1 ? variant.lessons[lIdx + 1] : null;
    const isDone = doneSet.has(activeLesson.id);

    root.innerHTML = `
      <div class="learn-shell">
        ${sidebarHtml}
        <main class="learn-content">
          <article class="lesson-article">
            <div class="flex flex-wrap items-center gap-xs mb-sm">
              <span class="badge badge-bloom">${esc(variant.name)} · Section ${esc(activeLesson.sectionCode)}</span>
              <span class="badge ${variant.logicVoltage.includes('3.3V') ? 'badge-warning' : 'badge-success'}">${esc(variant.logicVoltage)}</span>
              <span class="badge ${isDone ? 'badge-success' : ''}" id="board-cp-pill">${isDone ? '✓ Completed' : 'In Progress'}</span>
            </div>

            <h1>${esc(activeLesson.title)}</h1>
            <p style="font-size:1.04rem; color:var(--text-primary);">${esc(activeLesson.summary)}</p>

            ${activeLesson.body.map((p) => `<p>${esc(p)}</p>`).join('')}

            ${activeLesson.specsTable ? `
              <div class="table-wrap mt-md mb-md">
                <table class="data-table">
                  <thead><tr><th>Specification</th><th>Verified Hardware Value</th></tr></thead>
                  <tbody>
                    ${activeLesson.specsTable.map(([k, val]) => `<tr><td><strong>${esc(k)}</strong></td><td>${esc(val)}</td></tr>`).join('')}
                  </tbody>
                </table>
              </div>
            ` : ''}

            ${activeLesson.pinTable ? `
              <div class="table-wrap mt-md mb-md">
                <table class="data-table">
                  <thead><tr><th>Pins</th><th>Role</th><th>Variant-Specific Rules</th></tr></thead>
                  <tbody>
                    ${activeLesson.pinTable.map((row) => `<tr><td><code>${esc(row.pins)}</code></td><td><strong>${esc(row.role)}</strong></td><td>${esc(row.notes)}</td></tr>`).join('')}
                  </tbody>
                </table>
              </div>
            ` : ''}

            ${activeLesson.troubleshootList ? `
              <div class="grid mt-md mb-md">
                ${activeLesson.troubleshootList.map((t) => `
                  <div class="callout callout-warning" style="margin:0;">
                    <div class="callout-title">⚠ ${esc(t.issue)}</div>
                    <p class="text-sm" style="margin:0;"><strong>Diagnostic Fix:</strong> ${esc(t.solution)}</p>
                  </div>
                `).join('')}
              </div>
            ` : ''}

            ${activeLesson.tryItYourself ? `<div id="board-editor-host" class="mt-md"></div>` : ''}
            ${activeLesson.exercises ? `<div id="board-exercises-host" class="mt-md"></div>` : ''}

            ${activeLesson.relatedProgrammingLessons && activeLesson.relatedProgrammingLessons.length ? `
              <div class="callout callout-info mt-lg">
                <div class="callout-title">Connected Programming School Lessons</div>
                <p class="text-sm mb-sm">Review the core C++ / Arduino syntax behind this hardware topic in Programming School:</p>
                <div class="flex flex-wrap gap-xs">
                  ${activeLesson.relatedProgrammingLessons.map((rl) => `
                    <a class="btn btn-secondary btn-sm" href="./learn.html?lesson=${encodeURIComponent(rl.id)}">${esc(rl.label)} →</a>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <div class="checkpoint-box">
              <div class="flex flex-wrap items-center justify-between gap-md">
                <div>
                  <h3 style="margin-bottom:0.2rem;">Board Lesson Checkpoint</h3>
                  <p class="text-sm" style="margin:0;">Opening a board lesson does not mark it complete. Confirm once you have reviewed this hardware section.</p>
                </div>
                <button type="button" id="board-checkpoint-btn" class="btn ${isDone ? 'btn-secondary' : 'btn-primary'}">
                  ${isDone ? '✓ Checkpoint Completed' : 'Complete Board Checkpoint'}
                </button>
              </div>
            </div>

            <nav class="lesson-nav-bar">
              <div>${prevL ? `<a class="btn btn-secondary" href="./boards.html?variant=${encodeURIComponent(variant.id)}&lesson=${encodeURIComponent(prevL.id)}">← ${esc(prevL.title)}</a>` : '<span></span>'}</div>
              <div>
                ${nextL
                  ? `<a class="btn btn-primary" href="./boards.html?variant=${encodeURIComponent(variant.id)}&lesson=${encodeURIComponent(nextL.id)}">Next: ${esc(nextL.title)} →</a>`
                  : `<a class="btn btn-primary" href="./boards.html?variant=${encodeURIComponent(variant.id)}&quiz=1">Take Variant Assessment Quiz →</a>`}
              </div>
            </nav>
          </article>
        </main>
        ${rightRailHtml}
      </div>
    `;

    if (activeLesson.tryItYourself) {
      window.RoboDexEditor.mount(document.getElementById('board-editor-host'), activeLesson.tryItYourself);
    }

    if (activeLesson.exercises) {
      const exHost = document.getElementById('board-exercises-host');
      const passedMap = rec.exercisesPassed || {};
      exHost.innerHTML = activeLesson.exercises.map((ex, i) => `
        <div class="exercise-card ${passedMap[ex.id] ? 'passed' : ''}" data-bex="${ex.id}">
          <div class="card-header">
            <div>
              <span class="badge badge-bloom">Board Exercise ${i + 1}</span>
              <h4 class="mt-sm" style="margin-bottom:0;">${esc(ex.prompt)}</h4>
            </div>
            <span class="badge ${passedMap[ex.id] ? 'badge-success' : ''}" data-bex-badge>${passedMap[ex.id] ? '✓ Passed' : 'Not Checked'}</span>
          </div>
          <div class="exercise-options">
            ${ex.options.map((opt, oi) => `
              <label class="exercise-option">
                <input type="radio" name="bex_${ex.id}" value="${oi}">
                <span>${esc(opt)}</span>
              </label>
            `).join('')}
          </div>
          <div class="flex gap-sm">
            <button type="button" class="btn btn-primary btn-sm" data-bex-submit="${ex.id}">Submit &amp; Check</button>
            <button type="button" class="btn btn-ghost btn-sm" data-bex-reveal="${ex.id}">Show Answer</button>
          </div>
          <div class="exercise-feedback" data-bex-fb></div>
        </div>
      `).join('');

      activeLesson.exercises.forEach((ex) => {
        const card = exHost.querySelector(`[data-bex="${ex.id}"]`);
        const fb = card.querySelector('[data-bex-fb]');
        const badge = card.querySelector('[data-bex-badge]');
        card.querySelector(`[data-bex-submit="${ex.id}"]`).addEventListener('click', async () => {
          const picked = card.querySelector(`input[name="bex_${ex.id}"]:checked`);
          if (!picked) {
            fb.className = 'exercise-feedback show incorrect';
            fb.innerHTML = '<strong>Please select an option first.</strong>';
            return;
          }
          const ok = Number(picked.value) === ex.correctIndex;
          await window.RoboDexDB.saveBoardExerciseAttempt(profile.id, variant.id, ex.id, ok);
          await refreshBoardState();
          fb.className = `exercise-feedback show ${ok ? 'correct' : 'incorrect'}`;
          fb.innerHTML = `<strong>${ok ? '✓ Correct!' : '✗ Not quite.'}</strong><p style="margin:0.3rem 0 0;">${esc(ex.explanation)}</p>`;
          if (ok) {
            card.classList.add('passed');
            badge.className = 'badge badge-success';
            badge.textContent = '✓ Passed';
          }
        });
        card.querySelector(`[data-bex-reveal="${ex.id}"]`).addEventListener('click', () => {
          fb.className = 'exercise-feedback show correct';
          fb.innerHTML = `<strong>Answer:</strong> ${esc(ex.options[ex.correctIndex])}<p style="margin:0.3rem 0 0;">${esc(ex.explanation)}</p>`;
        });
      });
    }

    document.getElementById('board-checkpoint-btn').addEventListener('click', async () => {
      await window.RoboDexDB.completeBoardLessonCheckpoint(profile.id, variant.id, activeLesson.id, `${variant.name}: ${activeLesson.title}`);
      await refreshBoardState();
      window.RoboDexApp.showToast('Board lesson checkpoint saved!');
      renderVariantWorkspace(variant.id, activeLesson.id, false);
    });
  }

  async function init() {
    profile = await window.RoboDexApp.requireActiveProfile();
    if (!profile) return;
    boardsData = await window.RoboDexApp.loadJSON('./data/boards-curriculum.json');
    await refreshBoardState();

    const { variantId, lessonId, quizMode } = getParams();
    if (variantId) {
      await renderVariantWorkspace(variantId, lessonId, quizMode);
    } else {
      renderHub('all');
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    init().catch((err) => {
      const root = document.getElementById('boards-app-root');
      if (root) root.innerHTML = `<div class="container" style="padding:2rem;"><div class="callout callout-danger">${window.RoboDexApp.escapeHtml(err.message)}</div></div>`;
    });
  });
})();
