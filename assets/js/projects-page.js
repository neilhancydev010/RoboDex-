/* ==========================================================================
   RoboDex́ — Guided Project Learning Pathways Controller
   Guides students through objectives, prerequisites, logic, hardware & IDE
   steps without immediately spoiling complete solutions.
   ========================================================================== */

(function () {
  async function init() {
    const profile = await window.RoboDexDB.ensureActiveProfile();
    const [projectsData, curriculum, snapshot] = await Promise.all([
      window.RoboDexApp.loadJSON('./data/projects.json'),
      window.RoboDexApp.loadJSON('./data/curriculum.json'),
      window.RoboDexDB.getProfileSnapshot(profile.id)
    ]);

    const metrics = window.RoboDexProgress.computeMetrics(curriculum, snapshot);
    const projectProgressMap = new Map((snapshot.projects || []).map((p) => [p.projectId, p.completedSteps || []]));

    const lessonLookup = new Map();
    curriculum.modules.forEach((m) => m.lessons.forEach((l) => lessonLookup.set(l.id, l.title)));

    const listHost = document.getElementById('projects-selector');
    const detailHost = document.getElementById('project-detail');
    const urlProj = new URLSearchParams(window.location.search).get('project');
    let activeId = projectsData.projects.some((p) => p.id === urlProj) ? urlProj : projectsData.projects[0].id;

    function renderSelector() {
      listHost.innerHTML = projectsData.projects.map((p) => {
        const doneSteps = (projectProgressMap.get(p.id) || []).length;
        const totalSteps = p.logicSteps.length;
        return `
          <button type="button" class="card card-hover" data-proj-id="${p.id}"
                  style="text-align:left; cursor:pointer; border-color:${p.id === activeId ? 'var(--blue-600)' : 'var(--border-color)'}; background:${p.id === activeId ? 'var(--bg-subtle)' : 'var(--bg-surface)'};">
            <div class="flex items-center justify-between gap-xs mb-sm">
              <span class="badge badge-cyan">${window.RoboDexApp.escapeHtml(p.difficulty)}</span>
              <span class="text-xs text-muted">${doneSteps}/${totalSteps} steps</span>
            </div>
            <strong style="display:block; color:var(--text-primary);">${window.RoboDexApp.escapeHtml(p.title)}</strong>
          </button>
        `;
      }).join('');

      listHost.querySelectorAll('[data-proj-id]').forEach((btn) => {
        btn.addEventListener('click', () => {
          activeId = btn.dataset.projId;
          renderSelector();
          renderDetail();
        });
      });
    }

    function renderDetail() {
      const p = projectsData.projects.find((x) => x.id === activeId);
      const completedSteps = new Set(projectProgressMap.get(p.id) || []);

      detailHost.innerHTML = `
        <div class="card">
          <div class="flex flex-wrap items-center justify-between gap-sm mb-sm">
            <span class="badge badge-cyan">${window.RoboDexApp.escapeHtml(p.difficulty)} Project Pathway</span>
            <span class="badge badge-blue">Self-Guided · No Auto-Spoiler</span>
          </div>
          <h2>${window.RoboDexApp.escapeHtml(p.title)}</h2>

          <!-- 1. Project Objective -->
          <div class="callout callout-info mt-md">
            <div class="callout-title">1. Project Objective</div>
            <p style="margin:0;">${window.RoboDexApp.escapeHtml(p.objective)}</p>
          </div>

          <div class="grid grid-2 mt-md">
            <!-- 2. Required Programming Concepts -->
            <div class="callout" style="margin:0;">
              <div class="callout-title">2. Required Programming Concepts</div>
              <div class="flex flex-wrap gap-xs mt-sm">
                ${p.requiredConcepts.map((c) => `<span class="badge badge-blue">${window.RoboDexApp.escapeHtml(c)}</span>`).join('')}
              </div>
            </div>

            <!-- 3. Prerequisite Lessons -->
            <div class="callout" style="margin:0;">
              <div class="callout-title">3. Prerequisite Lessons (Live Status)</div>
              <ul style="margin:0.4rem 0 0 1.1rem; padding:0;">
                ${p.prerequisiteLessons.map((lid) => {
                  const done = metrics.completedLessonSet.has(lid);
                  const title = lessonLookup.get(lid) || lid;
                  return `<li>${done ? '✓' : '○'} <a href="./learn.html?lesson=${encodeURIComponent(lid)}">${window.RoboDexApp.escapeHtml(title)}</a></li>`;
                }).join('')}
              </ul>
            </div>
          </div>

          <!-- 4. Recommended Learning Sequence -->
          <div class="mt-lg">
            <h3>4. Recommended Learning Sequence</h3>
            <ol style="margin:0.4rem 0 0 1.25rem;">
              ${p.learningSequence.map((s) => `<li>${window.RoboDexApp.escapeHtml(s)}</li>`).join('')}
            </ol>
          </div>

          <!-- 5. Programming Logic Guide (Interactive Checklist) -->
          <div class="mt-lg">
            <h3>5. Programming Logic Guide (Build It Yourself)</h3>
            <p class="text-sm text-muted">Check off each reasoning step as you design your own sketch. Progress saves locally to IndexedDB.</p>
            <div class="grid" style="gap:0.55rem;">
              ${p.logicSteps.map((step, idx) => `
                <label class="exercise-option">
                  <input type="checkbox" data-logic-step="${idx}" ${completedSteps.has(idx) ? 'checked' : ''}>
                  <span><strong>Step ${idx + 1}:</strong> ${window.RoboDexApp.escapeHtml(step)}</span>
                </label>
              `).join('')}
            </div>
          </div>

          <!-- 6. Relevant Hardware -->
          <div class="mt-lg">
            <h3>6. Hardware Components &amp; Wiring Notes</h3>
            <ul style="margin:0.4rem 0 0 1.25rem;">
              ${p.hardwareNotes.map((h) => `<li>${window.RoboDexApp.escapeHtml(h)}</li>`).join('')}
            </ul>
          </div>

          <!-- 7. Implement in Arduino IDE (Starter Skeleton + Progressive Hints) -->
          <div class="mt-lg">
            <h3>7. Implement in Arduino IDE</h3>
            <ol style="margin:0.4rem 0 0.85rem 1.25rem;">
              ${p.ideSteps.map((s) => `<li>${window.RoboDexApp.escapeHtml(s)}</li>`).join('')}
            </ol>
            <div class="callout callout-warning">
              <div class="callout-title">Design Challenge — Starter Skeleton Only</div>
              <p class="text-sm" style="margin:0;">RoboDex́ intentionally provides a structured starter skeleton instead of a copy-paste finished solution so you practice writing the core logic yourself.</p>
            </div>
            <div id="project-skeleton-editor"></div>

            <div class="mt-md">
              <button type="button" id="toggle-hint-btn" class="btn btn-secondary btn-sm">Need a Nudge? Reveal Logic Hint</button>
              <div id="project-hint-box" class="callout callout-info mt-sm" style="display:none;">
                <div class="callout-title">Logic Hint</div>
                <p style="margin:0;">${window.RoboDexApp.escapeHtml(p.logicHint)}</p>
              </div>
            </div>
          </div>
        </div>
      `;

      window.RoboDexEditor.mount(document.getElementById('project-skeleton-editor'), {
        title: `${p.id.replace(/-/g, '_')}_starter.ino`,
        starterCode: p.starterSkeleton,
        challengePrompt: 'Fill in the TODO comments yourself, then download the .ino file and test it in Arduino IDE.',
        expectedBehavior: p.expectedHardwareBehavior
      });

      detailHost.querySelectorAll('[data-logic-step]').forEach((cb) => {
        cb.addEventListener('change', async () => {
          const idx = Number(cb.dataset.logicStep);
          if (cb.checked) completedSteps.add(idx);
          else completedSteps.delete(idx);
          const arr = Array.from(completedSteps);
          projectProgressMap.set(p.id, arr);
          await window.RoboDexDB.saveProjectProgress(profile.id, p.id, arr);
          renderSelector();
        });
      });

      const hintBtn = document.getElementById('toggle-hint-btn');
      const hintBox = document.getElementById('project-hint-box');
      hintBtn.addEventListener('click', () => {
        const visible = hintBox.style.display !== 'none';
        hintBox.style.display = visible ? 'none' : 'block';
        hintBtn.textContent = visible ? 'Need a Nudge? Reveal Logic Hint' : 'Hide Logic Hint';
      });
    }

    renderSelector();
    renderDetail();
  }

  document.addEventListener('DOMContentLoaded', () => {
    init().catch((err) => {
      const host = document.getElementById('project-detail');
      if (host) host.innerHTML = `<div class="callout callout-danger">${window.RoboDexApp.escapeHtml(err.message)}</div>`;
    });
  });
})();
