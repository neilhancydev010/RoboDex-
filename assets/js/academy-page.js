/* ==========================================================================
   RoboDex́ — Explore Academy Controller (All 12 Modules + Project Pathways)
   ========================================================================== */

(function () {
  async function init() {
    const profile = await window.RoboDexDB.ensureActiveProfile();
    const [curriculum, projectsData, snapshot] = await Promise.all([
      window.RoboDexApp.loadJSON('./data/curriculum.json'),
      window.RoboDexApp.loadJSON('./data/projects.json'),
      window.RoboDexDB.getProfileSnapshot(profile.id)
    ]);
    const metrics = window.RoboDexProgress.computeMetrics(curriculum, snapshot);

    const summaryHost = document.getElementById('academy-summary');
    if (summaryHost) {
      summaryHost.innerHTML = `
        <div class="grid grid-4">
          <div class="stat-card">
            <div class="stat-value">${curriculum.modules.length}</div>
            <div class="stat-label">Structured Modules</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${metrics.completedLessons} / ${metrics.totalLessons}</div>
            <div class="stat-label">Lessons Completed</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${metrics.overallPercent}%</div>
            <div class="stat-label">Weighted Mastery</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${projectsData.projects.length}</div>
            <div class="stat-label">Guided Project Pathways</div>
          </div>
        </div>
      `;
    }

    const modulesGrid = document.getElementById('academy-modules-grid');
    const filterButtons = document.querySelectorAll('[data-track-filter]');

    function renderModules(filter) {
      const list = curriculum.modules.filter((m) => filter === 'all' || m.track === filter);
      modulesGrid.innerHTML = list.map((mod) => {
        const stat = metrics.moduleStats.find((s) => s.moduleId === mod.id);
        const firstLesson = mod.lessons[0];
        return `
          <div class="card card-hover flex" style="flex-direction:column; justify-content:space-between;">
            <div>
              <div class="card-header">
                <span class="badge badge-blue">${window.RoboDexApp.escapeHtml(mod.shortTitle)}</span>
                <span class="badge ${stat.skill.cls}">${stat.skill.label}</span>
              </div>
              <h3>${window.RoboDexApp.escapeHtml(mod.title)}</h3>
              <p class="text-sm">${window.RoboDexApp.escapeHtml(mod.description)}</p>
              <div class="text-xs text-muted mb-sm">
                ${stat.completedLessons}/${stat.totalLessons} lessons · ${stat.exercisesPassed}/${stat.exercisesTotal} exercises · Quiz: ${stat.quiz ? `${stat.quiz.bestScore}%` : 'Not taken'}
              </div>
              <div class="progress-track sm mb-md">
                <div class="progress-fill" style="width:${stat.percent}%"></div>
              </div>
            </div>
            <div class="flex flex-wrap gap-sm">
              <a class="btn btn-primary btn-sm" href="./learn.html?lesson=${encodeURIComponent(firstLesson.id)}">
                ${stat.completedLessons > 0 ? 'Continue Module' : 'Start Module'}
              </a>
              <a class="btn btn-secondary btn-sm" href="./learn.html?quiz=${encodeURIComponent(mod.id)}">Module Quiz</a>
            </div>
          </div>
        `;
      }).join('');
    }

    filterButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        filterButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        renderModules(btn.dataset.trackFilter);
      });
    });

    renderModules('all');

    const projGrid = document.getElementById('academy-projects-grid');
    if (projGrid) {
      projGrid.innerHTML = projectsData.projects.map((p) => `
        <div class="card card-hover">
          <div class="card-header">
            <span class="badge badge-cyan">${window.RoboDexApp.escapeHtml(p.difficulty)}</span>
            <span class="text-xs text-muted">${p.prerequisiteLessons.length} prerequisites</span>
          </div>
          <h3>${window.RoboDexApp.escapeHtml(p.title)}</h3>
          <p class="text-sm">${window.RoboDexApp.escapeHtml(p.objective)}</p>
          <a class="btn btn-secondary btn-sm" href="./projects.html?project=${encodeURIComponent(p.id)}">Open Learning Pathway →</a>
        </div>
      `).join('');
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    init().catch((err) => {
      const host = document.getElementById('academy-modules-grid');
      if (host) host.innerHTML = `<div class="callout callout-danger">${window.RoboDexApp.escapeHtml(err.message)}</div>`;
    });
  });
})();
