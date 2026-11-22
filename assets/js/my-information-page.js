/* ==========================================================================
   RoboDex́ — My Information Controller
   Replaces My Data & Profiles: Profile management, local progress overview,
   persistent storage status, backup/restore (V1 & V2), and profile deletion.
   ========================================================================== */

(function () {
  function formatBytes(bytes) {
    if (typeof bytes !== 'number') return 'Unavailable';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  async function renderAll() {
    const profile = await window.RoboDexApp.requireActiveProfile();
    if (!profile) return;

    const [curriculum, snapshot, allProfiles, storageStatus] = await Promise.all([
      window.RoboDexApp.loadJSON('./data/curriculum.json'),
      window.RoboDexDB.getProfileSnapshot(profile.id),
      window.RoboDexDB.listProfiles(),
      window.RoboDexDB.getStorageStatus()
    ]);

    const metrics = window.RoboDexProgress.computeMetrics(curriculum, snapshot);

    // 1. Current Profile & Local Progress Overview
    document.getElementById('myinfo-overview').innerHTML = `
      <div class="grid grid-4">
        <div class="stat-card">
          <div class="stat-value" style="font-size:1.25rem;">${window.RoboDexApp.escapeHtml(profile.fullName)}</div>
          <div class="stat-label">Active Student · ID <code>${window.RoboDexApp.escapeHtml(profile.id.slice(-6))}</code></div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${metrics.overallPercent}%</div>
          <div class="stat-label">Overall Weighted Progress</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${metrics.completedLessons} / ${metrics.totalLessons}</div>
          <div class="stat-label">Completed Lesson Checkpoints</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${snapshot.exercises.length} / ${snapshot.quizzes.length}</div>
          <div class="stat-label">Exercise &amp; Quiz Records Saved</div>
        </div>
      </div>
    `;

    // 2. Populate Edit Profile & Preferences form
    document.getElementById('info-full-name').value = profile.fullName;
    document.getElementById('info-font-size').value = window.RoboDexPrefs.get('fontSize') || 'md';
    document.getElementById('info-pass-score').value = window.RoboDexPrefs.get('quizPassScore') || 70;
    document.getElementById('info-lock-progression').checked = Boolean(profile.lockProgression);

    // 3. Storage Persistence Status
    const persistLabel = storageStatus.persisted === true
      ? 'Granted (browser reduced automatic eviction risk)'
      : storageStatus.persisted === false
        ? 'Best-effort (browser may evict under extreme disk pressure)'
        : 'Storage persistence status not exposed by this browser';

    document.getElementById('storage-status-box').innerHTML = `
      <div class="callout callout-info" style="margin:0;">
        <div class="callout-title">Where Your Data Lives</div>
        <p class="text-sm" style="margin-bottom:0.45rem;">
          <strong>IndexedDB (<code>RoboDexAcademyDB</code> v2):</strong> Stores your profile, lesson checkpoints, exercise attempts, quiz scores, and future board/project progress strictly inside this browser on this device.
        </p>
        <p class="text-sm" style="margin-bottom:0.45rem;">
          <strong>localStorage:</strong> Stores lightweight display preferences (Dark/Light Hyper-Bloom theme, reading text size, quiz pass score).
        </p>
        <p class="text-sm" style="margin-bottom:0.45rem;">
          <strong>Persistent Storage API:</strong> ${window.RoboDexApp.escapeHtml(persistLabel)}
          ${storageStatus.usageBytes !== null ? ` · Current site usage: ${formatBytes(storageStatus.usageBytes)}` : ''}
        </p>
        <p class="text-xs text-muted" style="margin:0;">
          <strong>Important:</strong> Local data does <em>not</em> automatically sync across devices or browsers. Data may be lost if you explicitly clear site data, reset or uninstall the browser, or lose the device. Requesting persistent storage reduces some automatic eviction risks but cannot guarantee permanent retention — download regular backups below.
        </p>
      </div>
    `;

    // 4. Other Saved Profiles List
    const listHost = document.getElementById('other-profiles-list');
    listHost.innerHTML = allProfiles.map((p) => {
      const isCurrent = p.id === profile.id;
      return `
        <div class="flex flex-wrap items-center justify-between gap-sm" style="padding:0.75rem 0.95rem; border:1px solid ${isCurrent ? 'var(--bloom-400)' : 'var(--border-color)'}; border-radius:var(--radius-sm); background:var(--bg-surface-solid);">
          <div>
            <strong>${window.RoboDexApp.escapeHtml(p.fullName)}</strong>
            ${isCurrent ? '<span class="badge badge-success" style="margin-left:0.4rem;">Active</span>' : ''}
            <div class="text-xs text-muted">Created ${window.RoboDexApp.formatDate(p.createdAt)} · ID #${window.RoboDexApp.escapeHtml(p.id.slice(-5))}</div>
          </div>
          <div class="flex gap-xs">
            ${!isCurrent ? `<button type="button" class="btn btn-secondary btn-sm" data-switch-profile="${window.RoboDexApp.escapeHtml(p.id)}">Switch to Profile</button>` : ''}
          </div>
        </div>
      `;
    }).join('');

    listHost.querySelectorAll('[data-switch-profile]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        await window.RoboDexDB.selectProfile(btn.dataset.switchProfile);
        await window.RoboDexApp.initShell();
        await renderAll();
        window.RoboDexApp.showToast('Switched active local student profile.');
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderAll();

    // Update Profile & Preferences
    document.getElementById('info-profile-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const profile = await window.RoboDexApp.requireActiveProfile();
      if (!profile) return;
      const fullName = document.getElementById('info-full-name').value.trim();
      if (!fullName) {
        window.RoboDexApp.showToast('Full name cannot be empty.');
        return;
      }
      const fontSize = document.getElementById('info-font-size').value;
      const quizPassScore = Math.min(100, Math.max(50, Number(document.getElementById('info-pass-score').value) || 70));
      const lockProgression = document.getElementById('info-lock-progression').checked;

      await window.RoboDexDB.updateProfile(profile.id, { fullName, lockProgression });
      window.RoboDexPrefs.set('fontSize', fontSize);
      window.RoboDexPrefs.set('quizPassScore', quizPassScore);
      window.RoboDexPrefs.applyVisualPrefs();
      await window.RoboDexApp.initShell();
      await renderAll();
      window.RoboDexApp.showToast('Profile and preferences saved.');
    });

    // Export Progress Summary JSON
    document.getElementById('btn-export-progress').addEventListener('click', async () => {
      const profile = await window.RoboDexApp.requireActiveProfile();
      if (!profile) return;
      const [curriculum, snapshot] = await Promise.all([
        window.RoboDexApp.loadJSON('./data/curriculum.json'),
        window.RoboDexDB.getProfileSnapshot(profile.id)
      ]);
      const metrics = window.RoboDexProgress.computeMetrics(curriculum, snapshot);
      const summary = {
        app: 'RoboDex́',
        exportType: 'progress-summary',
        exportedAt: new Date().toISOString(),
        student: profile.fullName,
        profileId: profile.id,
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
      const slug = profile.fullName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      window.RoboDexApp.downloadFile(`robodex-progress-${slug}.json`, JSON.stringify(summary, null, 2), 'application/json');
      window.RoboDexApp.showToast('Exported progress summary JSON.');
    });

    // Export Records CSV
    document.getElementById('btn-export-records').addEventListener('click', async () => {
      const profile = await window.RoboDexApp.requireActiveProfile();
      if (!profile) return;
      const snapshot = await window.RoboDexDB.getProfileSnapshot(profile.id);
      const rows = [['RecordType', 'ItemId', 'ModuleId', 'Status', 'ScoreOrAttempts', 'Timestamp']];
      snapshot.lessons.forEach((l) => rows.push(['Lesson', l.lessonId, l.moduleId, l.checkpointCompleted ? 'Completed' : 'Visited', '1', new Date(l.lastVisitedAt || Date.now()).toISOString()]));
      snapshot.exercises.forEach((e) => rows.push(['Exercise', e.exerciseId, e.moduleId, e.passed ? 'Passed' : 'Attempted', String(e.attempts), new Date(e.updatedAt || Date.now()).toISOString()]));
      snapshot.quizzes.forEach((q) => rows.push(['Quiz', q.moduleId, q.moduleId, q.passed ? 'Passed' : 'Not Passed', `${q.bestScore}%`, new Date(q.updatedAt || Date.now()).toISOString()]));
      const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
      const slug = profile.fullName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      window.RoboDexApp.downloadFile(`robodex-learning-records-${slug}.csv`, csv, 'text/csv;charset=utf-8');
      window.RoboDexApp.showToast('Exported learning records CSV.');
    });

    // Download Versioned Full Backup JSON
    document.getElementById('btn-download-backup').addEventListener('click', async () => {
      const profile = await window.RoboDexApp.requireActiveProfile();
      if (!profile) return;
      const backup = await window.RoboDexDB.exportProfileBackup(profile.id);
      const slug = profile.fullName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const dateStr = new Date().toISOString().slice(0, 10);
      window.RoboDexApp.downloadFile(`robodex-backup-${slug}-${dateStr}.json`, JSON.stringify(backup, null, 2), 'application/json');
      window.RoboDexApp.showToast('Downloaded full versioned backup JSON.');
    });

    // Restore Backup JSON
    document.getElementById('restore-backup-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = document.getElementById('restore-file-input');
      const statusBox = document.getElementById('restore-status');
      const file = input.files && input.files[0];
      if (!file) {
        statusBox.innerHTML = '<div class="callout callout-warning">Please select a RoboDex́ backup (.json) file first.</div>';
        return;
      }
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        const restored = await window.RoboDexDB.restoreProfileBackup(parsed);
        await window.RoboDexApp.initShell();
        await renderAll();
        statusBox.innerHTML = `<div class="callout callout-success">Restored local profile <strong>${window.RoboDexApp.escapeHtml(restored.fullName)}</strong> (backup schema v${window.RoboDexApp.escapeHtml(parsed.schemaVersion || '1.0')}).</div>`;
        window.RoboDexApp.showToast('Backup restored successfully.');
      } catch (err) {
        statusBox.innerHTML = `<div class="callout callout-danger">Restore failed: ${window.RoboDexApp.escapeHtml(err.message)}</div>`;
      }
    });

    // Delete Active Profile
    document.getElementById('btn-delete-profile').addEventListener('click', async () => {
      const profile = await window.RoboDexApp.requireActiveProfile();
      if (!profile) return;
      const confirmed = window.confirm(
        `Permanently delete local profile "${profile.fullName}" and all of its local learning records from this browser? Download a backup first if you want to keep your progress.`
      );
      if (!confirmed) return;
      await window.RoboDexDB.deleteProfile(profile.id);
      window.location.replace('./index.html');
    });
  });
})();
