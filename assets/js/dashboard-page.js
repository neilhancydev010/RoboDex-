/* ==========================================================================
   RoboDex́ — Unified Student Dashboard Controller
   Consolidates Dashboard + Explore Academy with 100% genuine IndexedDB data.
   ========================================================================== */

(function () {
  async function init() {
    const profile = await window.RoboDexApp.requireActiveProfile();
    if (!profile) return;

    const [curriculum, boardsCurriculum, snapshot] = await Promise.all([
      window.RoboDexApp.loadJSON('./data/curriculum.json'),
      window.RoboDexApp.loadJSON('./data/boards-curriculum.json'),
      window.RoboDexDB.getProfileSnapshot(profile.id)
    ]);
    const boardMetrics = window.RoboDexProgress.computeBoardMetrics(boardsCurriculum, snapshot);

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
            Weighted from Programming School (30% lessons · 50% exercises · 20% quizzes). Boards and Application-Based Learning metrics will automatically integrate in Stages 2 and 3.
          </div>
        </div>
      </div>
    `;

    // 2. Track Overview Cards
    document.getElementById('dash-tracks-grid').innerHTML = `
      <div class="card card-hover">
        ${window.RoboDexVisuals ? window.RoboDexVisuals.getTrackThumbHtml("programming", "Conceptual Figure") : ""}
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

      <div class="card card-hover">
        ${window.RoboDexVisuals ? window.RoboDexVisuals.getTrackThumbHtml("boards-architecture", "Conceptual Figure") : ""}
        <div class="card-header">
          <span class="badge badge-bloom">Track 2 · Active</span>
          <strong style="font-family:var(--font-display);">${boardMetrics.startedVariants > 0 ? `${boardMetrics.overallBoardsPercent}%` : 'Not started'}</strong>
        </div>
        <h3>Boards Learning</h3>
        <p class="text-sm">
          ${boardMetrics.completedBoardLessons > 0 || boardMetrics.startedVariants > 0
            ? `${boardMetrics.completedBoardLessons} board lessons completed · ${boardMetrics.passedBoardQuizzes} variant assessments passed across ${boardMetrics.startedVariants} started board(s).`
            : `No board learning activity yet. Explore 4 families and ${boardMetrics.totalVariants} hardware variants.`}
        </p>
        <div class="progress-track sm mb-md">
          <div class="progress-fill" style="width:${boardMetrics.overallBoardsPercent}%"></div>
        </div>
        <a class="btn btn-primary btn-sm" href="./boards.html${profile.lastVisitedBoardVariant ? `?variant=${encodeURIComponent(profile.lastVisitedBoardVariant)}&lesson=${encodeURIComponent(profile.lastVisitedBoardLesson || '')}` : ''}">
          ${boardMetrics.startedVariants > 0 ? 'Continue Boards Learning →' : 'Explore Boards →'}
        </a>
      </div>

      <div class="card">
        ${window.RoboDexVisuals ? window.RoboDexVisuals.getTrackThumbHtml("robotics-applied", "Stage 3 Preview") : ""}
        <div class="card-header">
          <span class="badge">Track 3 · Stage 3</span>
          <span class="text-xs text-muted">${metrics.activeProjectsCount > 0 ? `${metrics.activeProjectsCount} in progress` : 'Not started'}</span>
        </div>
        <h3>Application-Based Learning</h3>
        <p class="text-sm">${metrics.activeProjectsCount > 0 ? `${metrics.activeProjectsCount} saved project pathway record(s) found.` : 'No project progress recorded yet. Full project studio arrives in Stage 3.'}</p>
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

    // 4. Recent Learning Activity
    const recentHost = document.getElementById('dash-recent-activity');
    if (metrics.recentActivity.length === 0) {
      recentHost.innerHTML = `
        <div class="empty-state">
          <h3>No learning activity yet</h3>
          <p>Complete a lesson checkpoint, check an exercise, or submit a quiz in Programming School and your activity will appear here.</p>
        </div>
      `;
    } else {
      recentHost.innerHTML = `
        <div class="grid" style="gap:0.6rem;">
          ${metrics.recentActivity.map((item) => `
            <div class="flex items-center justify-between gap-sm" style="padding:0.7rem 0.9rem; border:1px solid var(--border-color); border-radius:var(--radius-sm); background:var(--bg-surface-solid);">
              <div class="text-sm">
                <span class="badge badge-bloom" style="margin-right:0.4rem;">${window.RoboDexApp.escapeHtml(item.area)}</span>
                <strong>${window.RoboDexApp.escapeHtml(item.action)}</strong> —
                ${item.targetUrl ? `<a href="${item.targetUrl}">${window.RoboDexApp.escapeHtml(item.label)}</a>` : window.RoboDexApp.escapeHtml(item.label)}
              </div>
              <span class="text-xs text-muted">${window.RoboDexApp.formatDateTime(item.timestamp)}</span>
            </div>
          `).join('')}
        </div>
      `;
    }

    // 5. Project Progress & Next Steps (Stage 3 ready, zero fake values)
    const projHost = document.getElementById('dash-projects-overview');
    if (metrics.activeProjectsCount === 0) {
      projHost.innerHTML = `
        <div class="empty-state">
          <h3>No project records yet</h3>
          <p>Application-Based Learning launches in Stage 3. Recommended next step right now: continue <a href="./learn.html?lesson=${encodeURIComponent(metrics.nextLesson.id)}">${window.RoboDexApp.escapeHtml(metrics.nextLesson.title)}</a>.</p>
        </div>
      `;
    } else {
      projHost.innerHTML = `
        <ul style="margin:0.4rem 0 0 1.2rem;">
          ${metrics.projectRecords.filter((p) => (p.completedSteps || []).length > 0).map((p) => `
            <li class="text-sm"><strong>${window.RoboDexApp.escapeHtml(p.projectId)}</strong> — ${p.completedSteps.length} step(s) saved locally</li>
          `).join('')}
        </ul>
      `;
    }

    // 6. Module Quiz Scores
    const quizHost = document.getElementById('dash-quizzes-overview');
    const takenQuizzes = metrics.moduleStats.filter((m) => Boolean(m.quiz));
    if (takenQuizzes.length === 0) {
      quizHost.innerHTML = `
        <div class="empty-state">
          <h3>No module quizzes taken yet</h3>
          <p>Pass end-of-module quizzes (default 70% threshold) to earn the 20% assessment weighting.</p>
        </div>
      `;
    } else {
      quizHost.innerHTML = `
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>Module</th><th>Best Score</th><th>Status</th><th></th></tr></thead>
            <tbody>
              ${takenQuizzes.map((m) => `
                <tr>
                  <td><strong>${window.RoboDexApp.escapeHtml(m.shortTitle)}</strong></td>
                  <td>${m.quiz.bestScore}%</td>
                  <td><span class="badge ${m.quiz.passed ? 'badge-success' : 'badge-warning'}">${m.quiz.passed ? 'Passed' : 'Retry'}</span></td>
                  <td><a class="text-sm" href="./learn.html?quiz=${encodeURIComponent(m.moduleId)}">Open</a></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    // 7. Completed Lessons
    const compHost = document.getElementById('dash-completed-lessons');
    const doneList = (snapshot.lessons || [])
      .filter((l) => l.checkpointCompleted)
      .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
    if (doneList.length === 0) {
      compHost.innerHTML = `
        <div class="empty-state">
          <h3>No completed lessons yet</h3>
          <p>Confirm the checkpoint at the end of your first lesson in Programming School to record completion.</p>
        </div>
      `;
    } else {
      compHost.innerHTML = `
        <ul style="margin:0.4rem 0 0 1.2rem;">
          ${doneList.slice(0, 8).map((l) => `
            <li class="text-sm">
              <a href="./learn.html?lesson=${encodeURIComponent(l.lessonId)}">${window.RoboDexApp.escapeHtml(lessonLookup.get(l.lessonId) || l.lessonId)}</a>
              <span class="text-xs text-muted"> · ${window.RoboDexApp.formatDate(l.completedAt)}</span>
            </li>
          `).join('')}
        </ul>
      `;
    }

    // 8. Skill Mastery Grid
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

    // 9. Consolidated Curriculum Explorer
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
              ${modObj.representativeBoardPhoto && window.RoboDexVisuals
                ? window.RoboDexVisuals.getBoardCardPhotoHtml(
                    modObj.representativeBoardPhoto.url,
                    modObj.representativeBoardPhoto.credit,
                    window.RoboDexVisuals.resolveProgrammingKey(stat.moduleId),
                    stat.shortTitle,
                    136
                  )
                : (window.RoboDexVisuals ? window.RoboDexVisuals.getTrackThumbHtml(window.RoboDexVisuals.resolveProgrammingKey(stat.moduleId), stat.shortTitle) : '')}
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
