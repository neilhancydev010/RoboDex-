/* ==========================================================================
   RoboDex́ — Student Dashboard Controller
   100% live IndexedDB metrics — zero fabricated statistics.
   ========================================================================== */

(function () {
  async function init() {
    const profile = await window.RoboDexDB.ensureActiveProfile();
    const [curriculum, boardsData, projectsData, snapshot] = await Promise.all([
      window.RoboDexApp.loadJSON('./data/curriculum.json'),
      window.RoboDexApp.loadJSON('./data/boards.json'),
      window.RoboDexApp.loadJSON('./data/projects.json'),
      window.RoboDexDB.getProfileSnapshot(profile.id)
    ]);

    const metrics = window.RoboDexProgress.computeMetrics(curriculum, snapshot);
    const boardLookup = new Map(boardsData.boards.map((b) => [b.id, b]));
    const lessonLookup = new Map();
    curriculum.modules.forEach((m) => m.lessons.forEach((l) => lessonLookup.set(l.id, l.title)));

    // Find recommended project based on completed prerequisites
    const recommendedProject =
      projectsData.projects.find((p) => {
        const prereqsDone = p.prerequisiteLessons.every((lid) => metrics.completedLessonSet.has(lid));
        return prereqsDone;
      }) || projectsData.projects[0];

    const accuracy = metrics.exercisesAttempted > 0
      ? Math.round((metrics.exercisesPassed / metrics.exercisesAttempted) * 100)
      : 0;

    const root = document.getElementById('dashboard-root');
    root.innerHTML = `
      <!-- Personalized Welcome & Continue Learning -->
      <section class="card mb-lg" style="background:linear-gradient(135deg, var(--navy-900), var(--navy-800)); color:#fff; border-color:rgba(34,211,238,0.3);">
        <div class="flex flex-wrap items-center justify-between gap-md">
          <div>
            <span class="badge badge-cyan">Local Student Profile · Active</span>
            <h1 class="mt-sm" style="color:#fff;">Welcome back, ${window.RoboDexApp.escapeHtml(profile.displayName)}</h1>
            <p style="color:#cbd5e1; margin-bottom:0.5rem;">
              Current Learning Level: <strong style="color:#22d3ee;">${window.RoboDexApp.escapeHtml(metrics.level)}</strong>
              ${profile.goal ? ` · Goal: ${window.RoboDexApp.escapeHtml(profile.goal)}` : ''}
            </p>
          </div>
          <div class="flex flex-wrap gap-sm">
            <a class="btn btn-accent btn-lg" href="./learn.html?lesson=${encodeURIComponent(profile.lastVisitedLesson || 'm01-l01')}">
              Continue Learning →
            </a>
            <a class="btn btn-secondary" href="./profiles.html">Switch / Edit Profile</a>
          </div>
        </div>
        <div class="mt-md">
          <div class="flex justify-between text-sm mb-sm" style="color:#e2e8f0;">
            <span>Overall Course Progress (30% Lessons · 50% Exercises · 20% Quizzes)</span>
            <strong>${metrics.overallPercent}%</strong>
          </div>
          <div class="progress-track">
            <div class="progress-fill" style="width:${metrics.overallPercent}%"></div>
          </div>
        </div>
      </section>

      <!-- Live Stat Tiles -->
      <section class="grid grid-4 mb-lg">
        <div class="stat-card">
          <div class="stat-value">${metrics.completedLessons} / ${metrics.totalLessons}</div>
          <div class="stat-label">Completed Lessons</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${metrics.exercisesPassed} / ${metrics.exercisesAttempted}</div>
          <div class="stat-label">Exercises Passed / Attempted (${accuracy}%)</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${metrics.quizzesPassed} / ${metrics.totalQuizzes}</div>
          <div class="stat-label">Module Quizzes Passed</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${(profile.selectedBoards || []).length}</div>
          <div class="stat-label">Selected Target Boards</div>
        </div>
      </section>

      <!-- Recommended Next Lesson + Recommended Project + Selected Boards -->
      <section class="grid grid-3 mb-lg">
        <div class="card">
          <span class="badge badge-blue">Recommended Next Lesson</span>
          <h3 class="mt-sm">${window.RoboDexApp.escapeHtml(metrics.nextLesson.title)}</h3>
          <p class="text-sm">Continue your structured progression to unlock downstream modules and hardware projects.</p>
          <a class="btn btn-primary btn-sm" href="./learn.html?lesson=${encodeURIComponent(metrics.nextLesson.id)}">Open Lesson →</a>
        </div>

        <div class="card">
          <span class="badge badge-cyan">Recommended Project Path</span>
          <h3 class="mt-sm">${window.RoboDexApp.escapeHtml(recommendedProject.title)}</h3>
          <p class="text-sm">${window.RoboDexApp.escapeHtml(recommendedProject.objective)}</p>
          <a class="btn btn-secondary btn-sm" href="./projects.html?project=${encodeURIComponent(recommendedProject.id)}">Start Guided Project →</a>
        </div>

        <div class="card">
          <span class="badge">Selected Boards</span>
          <h3 class="mt-sm">Your Hardware Focus</h3>
          <div class="flex flex-wrap gap-xs mt-sm mb-md">
            ${(profile.selectedBoards && profile.selectedBoards.length)
              ? profile.selectedBoards.map((bid) => {
                  const b = boardLookup.get(bid);
                  return `<a class="badge badge-blue" href="./boards.html?board=${encodeURIComponent(bid)}">${window.RoboDexApp.escapeHtml(b ? b.name : bid)}</a>`;
                }).join('')
              : '<span class="text-sm text-muted">No boards selected yet.</span>'}
          </div>
          <a class="btn btn-secondary btn-sm" href="./boards.html">Manage Board Paths</a>
        </div>
      </section>

      <!-- Skill Mastery Grid -->
      <section class="card mb-lg">
        <div class="card-header">
          <div>
            <h2>Skill Mastery</h2>
            <p class="text-sm" style="margin:0;">Calculated strictly from your completed checkpoints, checked exercises, and module quiz scores.</p>
          </div>
        </div>
        <div class="grid grid-3">
          ${metrics.moduleStats.map((m) => `
            <div style="padding:0.85rem; border:1px solid var(--border-color); border-radius:var(--radius-sm); background:var(--bg-page);">
              <div class="flex items-center justify-between gap-xs mb-sm">
                <strong class="text-sm">${window.RoboDexApp.escapeHtml(m.skillName)}</strong>
                <span class="badge ${m.skill.cls}">${m.skill.label}</span>
              </div>
              <div class="progress-track sm">
                <div class="progress-fill" style="width:${m.percent}%"></div>
              </div>
              <div class="text-xs text-muted mt-sm">${m.percent}% weighted · ${m.completedLessons}/${m.totalLessons} lessons</div>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- My Courses & Module Quiz Results -->
      <section class="card mb-lg">
        <h2>My Courses &amp; Module Quiz Results</h2>
        <div class="table-wrap mt-sm">
          <table class="data-table">
            <thead>
              <tr>
                <th>Module</th>
                <th>Lessons</th>
                <th>Exercises Passed</th>
                <th>Best Quiz Score</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${metrics.moduleStats.map((m) => {
                const modObj = curriculum.modules.find((x) => x.id === m.moduleId);
                return `
                  <tr>
                    <td><strong>${window.RoboDexApp.escapeHtml(m.title)}</strong></td>
                    <td>${m.completedLessons} / ${m.totalLessons}</td>
                    <td>${m.exercisesPassed} / ${m.exercisesTotal}</td>
                    <td>${m.quiz ? `${m.quiz.bestScore}% (${m.quiz.passed ? 'Passed' : 'Retry'})` : 'Not taken'}</td>
                    <td><span class="badge ${m.skill.cls}">${m.skill.label}</span></td>
                    <td>
                      <a class="btn btn-secondary btn-sm" href="./learn.html?lesson=${encodeURIComponent(modObj.lessons[0].id)}">Open</a>
                      <a class="btn btn-ghost btn-sm" href="./learn.html?quiz=${encodeURIComponent(m.moduleId)}">Quiz</a>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </section>

      <!-- Completed Lessons History -->
      <section class="card">
        <h2>Completed Lessons</h2>
        ${snapshot.lessons.filter((l) => l.checkpointCompleted).length === 0 ? `
          <p class="text-sm text-muted" style="margin:0;">You have not completed any lesson checkpoints yet. Open Module 01 Lesson 1 and complete its checkpoint to record your first completion.</p>
        ` : `
          <ul style="margin:0.5rem 0 0 1.2rem;">
            ${snapshot.lessons
              .filter((l) => l.checkpointCompleted)
              .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))
              .map((l) => `
                <li>
                  <a href="./learn.html?lesson=${encodeURIComponent(l.lessonId)}">${window.RoboDexApp.escapeHtml(lessonLookup.get(l.lessonId) || l.lessonId)}</a>
                  <span class="text-xs text-muted"> — completed ${window.RoboDexApp.formatDate(l.completedAt)}</span>
                </li>
              `).join('')}
          </ul>
        `}
      </section>
    `;
  }

  document.addEventListener('DOMContentLoaded', () => {
    init().catch((err) => {
      const root = document.getElementById('dashboard-root');
      if (root) root.innerHTML = `<div class="callout callout-danger">${window.RoboDexApp.escapeHtml(err.message)}</div>`;
    });
  });
})();
