/* ==========================================================================
   RoboDex́ — My Data Controller (Export, Versioned Backup, Restore, Delete)
   ========================================================================== */

(function () {
  async function renderStatus() {
    const profile = await window.RoboDexDB.ensureActiveProfile();
    const [curriculum, snapshot] = await Promise.all([
      window.RoboDexApp.loadJSON('./data/curriculum.json'),
      window.RoboDexDB.getProfileSnapshot(profile.id)
    ]);
    const metrics = window.RoboDexProgress.computeMetrics(curriculum, snapshot);

    document.getElementById('mydata-summary').innerHTML = `
      <div class="grid grid-4">
        <div class="stat-card">
          <div class="stat-value" style="font-size:1.3rem;">${window.RoboDexApp.escapeHtml(profile.displayName)}</div>
          <div class="stat-label">Active Local Profile</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${metrics.completedLessons}</div>
          <div class="stat-label">Lesson Checkpoints Saved</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${snapshot.exercises.length}</div>
          <div class="stat-label">Exercise Records Saved</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${snapshot.quizzes.length}</div>
          <div class="stat-label">Quiz Records Saved</div>
        </div>
      </div>
    `;
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderStatus();

    // 1. Export My Progress (Compact Summary JSON)
    document.getElementById('btn-export-progress').addEventListener('click', async () => {
      const profile = await window.RoboDexDB.ensureActiveProfile();
      const [curriculum, snapshot] = await Promise.all([
        window.RoboDexApp.loadJSON('./data/curriculum.json'),
        window.RoboDexDB.getProfileSnapshot(profile.id)
      ]);
      const metrics = window.RoboDexProgress.computeMetrics(curriculum, snapshot);
      const summary = {
        app: 'RoboDex́',
        exportType: 'progress-summary',
        exportedAt: new Date().toISOString(),
        student: profile.displayName,
        overallPercent: metrics.overallPercent,
        learningLevel: metrics.level,
        completedLessons: metrics.completedLessons,
        totalLessons: metrics.totalLessons,
        exercisesPassed: metrics.exercisesPassed,
        quizzesPassed: metrics.quizzesPassed,
        modules: metrics.moduleStats.map((m) => ({
          module: m.title,
          percent: m.percent,
          skill: m.skill.label,
          bestQuizScore: m.quiz ? m.quiz.bestScore : null
        }))
      };
      const slug = profile.displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      window.RoboDexApp.downloadFile(`robodex-progress-${slug}.json`, JSON.stringify(summary, null, 2), 'application/json');
      window.RoboDexApp.showToast('Exported progress summary JSON.');
    });

    // 2. Export My Learning Records (CSV for spreadsheet inspection)
    document.getElementById('btn-export-records').addEventListener('click', async () => {
      const profile = await window.RoboDexDB.ensureActiveProfile();
      const snapshot = await window.RoboDexDB.getProfileSnapshot(profile.id);
      const rows = [['RecordType', 'ItemId', 'ModuleId', 'Status', 'ScoreOrAttempts', 'Timestamp']];
      snapshot.lessons.forEach((l) => {
        rows.push(['Lesson', l.lessonId, l.moduleId, l.checkpointCompleted ? 'Completed' : 'Visited', '1', new Date(l.lastVisitedAt || Date.now()).toISOString()]);
      });
      snapshot.exercises.forEach((e) => {
        rows.push(['Exercise', e.exerciseId, e.moduleId, e.passed ? 'Passed' : 'Attempted', String(e.attempts), new Date(e.updatedAt || Date.now()).toISOString()]);
      });
      snapshot.quizzes.forEach((q) => {
        rows.push(['Quiz', q.moduleId, q.moduleId, q.passed ? 'Passed' : 'Not Passed', `${q.bestScore}%`, new Date(q.updatedAt || Date.now()).toISOString()]);
      });
      const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
      const slug = profile.displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      window.RoboDexApp.downloadFile(`robodex-learning-records-${slug}.csv`, csv, 'text/csv;charset=utf-8');
      window.RoboDexApp.showToast('Exported learning records CSV.');
    });

    // 3. Download Full Versioned Backup
    document.getElementById('btn-download-backup').addEventListener('click', async () => {
      const profile = await window.RoboDexDB.ensureActiveProfile();
      const backup = await window.RoboDexDB.exportProfileBackup(profile.id);
      const slug = profile.displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const dateStr = new Date().toISOString().slice(0, 10);
      window.RoboDexApp.downloadFile(`robodex-backup-v1-${slug}-${dateStr}.json`, JSON.stringify(backup, null, 2), 'application/json');
      window.RoboDexApp.showToast('Downloaded full versioned backup JSON.');
    });

    // 4. Restore Backup
    document.getElementById('restore-backup-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fileInput = document.getElementById('restore-file-input');
      const statusBox = document.getElementById('restore-status');
      const file = fileInput.files && fileInput.files[0];
      if (!file) {
        statusBox.innerHTML = '<div class="callout callout-warning">Please choose a RoboDex́ backup JSON file first.</div>';
        return;
      }
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        const restored = await window.RoboDexDB.restoreProfileBackup(parsed);
        await window.RoboDexApp.renderShell();
        await renderStatus();
        statusBox.innerHTML = `<div class="callout callout-success">Restored local profile <strong>${window.RoboDexApp.escapeHtml(restored.displayName)}</strong> (backup schema v${window.RoboDexApp.escapeHtml(parsed.schemaVersion || '1.0')}).</div>`;
        window.RoboDexApp.showToast('Backup restored successfully.');
      } catch (err) {
        statusBox.innerHTML = `<div class="callout callout-danger">Restore failed: ${window.RoboDexApp.escapeHtml(err.message)}</div>`;
      }
    });

    // 5. Delete Local Profile
    document.getElementById('btn-delete-profile').addEventListener('click', async () => {
      const profile = await window.RoboDexDB.ensureActiveProfile();
      const confirmed = window.confirm(
        `Permanently delete local profile "${profile.displayName}" and all of its IndexedDB progress from this browser? Download a backup first if you want to keep your records.`
      );
      if (!confirmed) return;
      await window.RoboDexDB.deleteProfile(profile.id);
      await window.RoboDexApp.renderShell();
      await renderStatus();
      window.RoboDexApp.showToast(`Deleted local profile "${profile.displayName}".`);
    });
  });
})();
