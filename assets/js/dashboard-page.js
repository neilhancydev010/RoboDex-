/* ==========================================================================
   RoboDex́ — Unified Student Dashboard Controller
   Consolidates the previous Dashboard + Explore Academy into one personal
   overview backed strictly by the selected profile's IndexedDB records.
   ========================================================================== */

(function () {
  async function init() {
    const profile = await window.RoboDexApp.requireActiveProfile();
    if (!profile) return;

    const [curriculum, snapshot] = await Promise.all([
      window.RoboDexApp.loadJSON('./data/curriculum.json'),
      window.RoboDexDB.getProfileSnapshot(profile.id)
    ]);

    const metrics = window.RoboDexProgress.computeMetrics(curriculum, snapshot);
    const lessonLookup = new Map();
    curriculum.modules.forEach((m) => m.lessons.forEach((l) => lessonLookup.set(l.id, l.title)));

    const accuracy = metrics.exercisesAttempted > 0
      ? Math.round((metrics.exercisesPassed / metrics.exercisesAttempted) * 100)
      : null;

    // 1. Hero Welcome & Continue Learning
    document.getElementById('dash-hero-content').innerHTML = `
      <div class="grid grid-asymmetric items-center">
        <div>
          <span class="badge" style="background:rgba(255,255,255,0.14); color:#fff; border-color:rgba(255,255,255,0.28);">
            Personal Learning Overview · ${window.RoboDexApp.escapeHtml(metrics.level)}
          </span>
          <h1 class="mt-sm">Welcome back, ${window.RoboDexApp.escapeHtml(profile.fullName)}</h1>
          <p style="max-width:600px;">
            Track your real progress across Programming School, upcoming Boards hardware training, and Application-Based Learning — all stored locally for your profile.
          </p>
          <div class="flex flex-wrap gap-sm mt-md">
            <a class="btn btn-primary btn-lg" href="./learn.html?lesson=${encodeURIComponent(profile.lastVisitedLesson || 'm01-l01')}">
              ${metrics.completedLessons > 0 ? 'Continue Learning →' : 'Start Programming School →'}
            </a>
            <a class="btn btn-secondary" style="background:rgba(255,255,255,0.12); color:#fff !important; border-color:rgba(255,255,255,0.32);" href="./learn.html?lesson=${encodeURIComponent(metrics.nextLesson.id)}">
              Next Lesson: ${window.RoboDexApp.escapeHtml(metrics.nextLesson.title)}
            </a>
          </div>
        </div>

        <div class="card" style="background:rgba(15,10,30,0.48); border-color:rgba(233,213,255,0.28); color:#fff;">
          <div class="flex justify-between items-center mb-sm">
            <span style="font-family:var(--font-display); font-weight:700;">Overall Learning Progress</span>
            <strong style="font-size:1.5rem; font-family:var(--font-display);">${metrics.overallPercent}%</strong>
          </div>
          <div class="progress-track mb-md" style="background:rgba(255,255,255,0.14); border-color:rgba(255,255,255,0.2);">
            <div class="progress-fill" style="width:${metrics.overallPercent}%"></div>
          </div>
          <div class="text-xs" style="color:rgba(241,233,255,0.82);">
            Weighted from Programming School (30% lessons · 50% exercises · 20% quizzes). Boards and Application-Based Learning metrics will automatically integrate as you complete them in later stages.
          </div>
        </div>
      </div>
    `;

    // 2. Track Overview Cards (Programming School, Boards, Application-Based Learning)
    document.getElementById('dash-tracks-grid').innerHTML = `
      <div class="card card-hover">
        <div class="card-header">
          <span class="badge badge-bloom">Track 1 · Active</span>
          <strong style="font-family:var(--font-display);">${metrics.programmingPercent}%</strong>
        </div>
        <h3>Programming School</h3>
        <p class="text-sm">${metrics.completedLessons} of ${metrics.totalLessons} lessons completed · ${metrics.quizzesPassed}/${metrics.totalQuizzes} module quizzes passed.</p>
        <div class="progress-track sm mb-md">
          <div class="progress-fill" style="width:${metrics.programmingPercent}%"></div>
        </div>
        <a class="btn btn-primary btn-sm" href="./learn.html?lesson=${encodeURIComponent(profile.lastVisitedLesson || 'm01-l01')}">Open Programming School →</a>
      </div>

      <div class="card">
        <div class="card-header">
          <span class="badge">Track 2 · Stage 2</span>
          <span class="text-xs text-muted">${metrics.boardRecordsCount > 0 ? `${metrics.boardsCompleted} completed` : 'Not started'}</span>
        </div>
        <h3>Boards Learning</h3>
        <p class="text-sm">${metrics.boardRecordsCount > 0 ? `${metrics.boardRecordsCount} local board records saved.` : 'No board learning records yet. Dedicated hardware board paths arrive in Stage 2.'}</p>
        <a class="btn btn-secondary btn-sm" href="./boards.html">View Boards Destination</a>
      </div>

      <div class="card">
        <div class="card-header">
          <span class="badge">Track 3 · Stage 3</span>
          <span class="text-xs text-muted">${metrics.activeProjectsCount > 0 ? `${metrics.activeProjectsCount} in progress` : 'Not started'}</span>
        </div>
        <h3>Application-Based Learning</h3>
        <p class="text-sm">${metrics.activeProjectsCount > 0 ? `${metrics.activeProjectsCount} saved project pathway record(s) found from earlier sessions.` : 'No project progress recorded yet. Full project studio arrives in Stage 3.'}</p>
        <a class="btn btn-secondary btn-sm" href="./projects.html">View Application Learning</a>
      </div>
    `;

    // 3. Genuine Quantitative Stat Tiles
    document.getElementById('dash-stats-grid').innerHTML = `
      <div class="stat-card">
        <div class="stat-value">${metrics.completedLessons} / ${metrics.totalLessons}</div>
        <div class="stat-label">Completed Lessons</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${metrics.exercisesPassed} / ${metrics.exercisesAttempted}</div>
        <div class="stat-label">Exercises Passed / Attempted ${accuracy !== null ? `(${accuracy}%)` : ''}</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${metrics.quizzesPassed} / ${metrics.totalQuizzes}</div>
        <div class="stat-label">Module Quizzes Passed</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${metrics.recentActivity.length}</div>
        <div class="stat-label">Recorded Recent Activities</div>
      </div>
    `;

    // 4. Recent Learning Activity & Project Readiness
    const recentHost = document.getElementById('dash-recent-activity');
    if (metrics.recentActivity.length === 0) {
      recentHost.innerHTML = `
        <div class="empty-state">
          <h3>No learning activity yet</h3>
          <p>Complete a lesson checkpoint, check an exercise, or submit a module quiz in Programming School and your timeline will appear here automatically.</p>
        </div>
      `;
    } else {
      recentHost.innerHTML = `
        <div class="grid" style="gap:0.65rem;">
          ${metrics.recentActivity.map((item) => `
            <div class="flex items-center justify-between gap-sm" style="padding:0.75rem 0.95rem; border:1px solid var(--border-color); border-radius:var(--radius-sm); background:var(--bg-surface-solid);">
              <div>
                <span class="badge badge-bloom" style="margin-right:0.45rem;">${window.RoboDexApp.escapeHtml(item.area)}</span>
                <strong>${window.RoboDexApp.escapeHtml(item.action)}</strong> —
                ${item.targetUrl ? `<a href="${item.targetUrl}">${window.RoboDexApp.escapeHtml(item.label)}</a>` : window.RoboDexApp.escapeHtml(item.label)}
              </div>
              <span class="text-xs text-muted">${window.RoboDexApp.formatDateTime(item.timestamp)}</span>
            </div>
          `).join('')}
        </div>
      `;
    }

    // 5. Skill Mastery Grid
    document.getElementById('dash-skills-grid').innerHTML = metrics.moduleStats.map((m) => `
      <div style="padding:0.9rem; border:1px solid var(--border-color); border-radius:var(--radius-sm); background:var(--bg-surface-solid);">
        <div class="flex items-center justify-between gap-xs mb-sm">
          <strong class="text-sm">${window.RoboDexApp.escapeHtml(m.skillName)}</strong>
          <span class="badge ${m.skill.cls}">${m.skill.label}</span>
        </div>
        <div class="progress-track sm">
          <div class="progress-fill" style="width:${m.percent}%"></div>
        </div>
        <div class="text-xs text-muted mt-sm">${m.percent}% · ${m.completedLessons}/${m.totalLessons} lessons · Quiz: ${m.quiz ? `${m.quiz.bestScore}%` : 'Not taken'}</div>
      </div>
    `).join('');

    // 6. Consolidated Explore Curriculum (Merged from Explore Academy)
    const modulesHost = document.getElementById('dash-modules-grid');
    const filterBtns = document.querySelectorAll('[data-track-filter]');

    function renderModules(filter) {
      const list = metrics.moduleStats.filter((m) => filter === 'all' || m.track === filter);
      modulesHost.innerHTML = list.map((stat) => {
        const modObj = curriculum.modules.find((x) => x.id === stat.moduleId);
        const firstLesson = modObj.lessons[0];
        return `
          <div class="card card-hover flex" style="flex-direction:column; justify-content:space-between;">
            <div>
              <div class="card-header">
                <span class="badge badge-bloom">${window.RoboDexApp.escapeHtml(stat.shortTitle)}</span>
                <span class="badge ${stat.skill.cls}">${stat.skill.label}</span>
              </div>
              <h3>${window.RoboDexApp.escapeHtml(stat.title)}</h3>
              <p class="text-sm">${window.RoboDexApp.escapeHtml(stat.description)}</p>
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
              <a class="btn btn-secondary btn-sm" href="./learn.html?quiz=${encodeURIComponent(stat.moduleId)}">Module Quiz</a>
            </div>
          </div>
        `;
      }).join('');
    }

    filterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        filterBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        renderModules(btn.dataset.trackFilter);
      });
    });

    renderModules('all');
  }

  document.addEventListener('DOMContentLoaded', () => {
    init().catch((err) => {
      const hero = document.getElementById('dash-hero-content');
      if (hero) hero.innerHTML = `<div class="callout callout-danger">${window.RoboDexApp.escapeHtml(err.message)}</div>`;
    });
  });
})();
