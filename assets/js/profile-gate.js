/* ==========================================================================
   RoboDex́ — Initial Local Student Profile Selection Screen (index.html)
   Always displayed on a fresh visit. Supports multiple profiles including
   identical full names via unique internal IDs. No passwords or onboarding.
   ========================================================================== */

(function () {
  async function renderProfiles() {
    const profiles = await window.RoboDexDB.listProfiles();
    let curriculum = null;
    try {
      curriculum = await window.RoboDexApp.loadJSON('./data/curriculum.json');
    } catch {
      curriculum = null;
    }

    const host = document.getElementById('profile-list-host');
    const heading = document.getElementById('profiles-section-heading');

    if (profiles.length === 0) {
      heading.textContent = 'No Local Profiles Yet';
      host.innerHTML = `
        <div class="empty-state">
          <h3>Create Your First Local Profile</h3>
          <p>Enter your real full name in the form on the right to start learning. Your progress will be stored locally in this browser's IndexedDB with no password or account required.</p>
        </div>
      `;
      return;
    }

    heading.textContent = `Existing Local Profiles (${profiles.length})`;

    // Detect duplicate full names so we can show a subtle disambiguator
    const nameCounts = new Map();
    profiles.forEach((p) => {
      const key = p.fullName.toLowerCase();
      nameCounts.set(key, (nameCounts.get(key) || 0) + 1);
    });

    const cardsHtml = await Promise.all(profiles.map(async (p) => {
      const snap = await window.RoboDexDB.getProfileSnapshot(p.id);
      const metrics = curriculum ? window.RoboDexProgress.computeMetrics(curriculum, snap) : null;
      const isDuplicateName = (nameCounts.get(p.fullName.toLowerCase()) || 0) > 1;
      const pct = metrics ? metrics.overallPercent : 0;
      const doneLessons = metrics ? metrics.completedLessons : 0;
      const totalLessons = metrics ? metrics.totalLessons : 0;

      return `
        <div class="profile-select-card">
          <div class="flex items-center gap-md">
            <span class="profile-select-avatar">${window.RoboDexApp.escapeHtml(window.RoboDexApp.getInitials(p.fullName))}</span>
            <div style="min-width:0; flex:1;">
              <strong style="display:block; font-family:var(--font-display); font-size:1.05rem; color:var(--text-primary);">
                ${window.RoboDexApp.escapeHtml(p.fullName)}
              </strong>
              <span class="text-xs text-muted">
                ${p.migratedFromV1 ? 'Migrated V1 Records · ' : ''}
                Created ${window.RoboDexApp.formatDate(p.createdAt)}
                ${isDuplicateName ? ` · ID #${window.RoboDexApp.escapeHtml(p.id.slice(-5))}` : ''}
              </span>
            </div>
          </div>

          <div>
            <div class="flex justify-between text-xs text-muted mb-sm">
              <span>${doneLessons > 0 ? `${doneLessons}/${totalLessons} lessons completed` : 'Not started yet'}</span>
              <strong>${pct}%</strong>
            </div>
            <div class="progress-track sm">
              <div class="progress-fill" style="width:${pct}%"></div>
            </div>
          </div>

          <button type="button" class="btn btn-primary btn-sm" data-select-profile="${window.RoboDexApp.escapeHtml(p.id)}">
            Open Dashboard →
          </button>
        </div>
      `;
    }));

    host.innerHTML = `<div class="grid grid-2">${cardsHtml.join('')}</div>`;

    host.querySelectorAll('[data-select-profile]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          await window.RoboDexDB.selectProfile(btn.dataset.selectProfile);
          window.location.href = './dashboard.html';
        } catch (err) {
          window.RoboDexApp.showToast(err.message);
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    // Wire theme toggle on the gate topbar
    const themeBtn = document.getElementById('gate-theme-toggle');
    if (themeBtn) {
      const updateLabel = () => {
        const t = window.RoboDexPrefs.get('theme');
        themeBtn.textContent = t === 'light' ? '🌙 Dark Theme' : '☀️ Light Theme';
      };
      updateLabel();
      themeBtn.addEventListener('click', () => {
        window.RoboDexPrefs.toggleTheme();
        updateLabel();
      });
    }

    const form = document.getElementById('create-student-form');
    const errorEl = document.getElementById('create-error');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorEl.textContent = '';
      const fullName = document.getElementById('student-full-name').value.trim();
      if (!fullName) {
        errorEl.textContent = 'Please enter your real full name to create a local profile.';
        return;
      }
      try {
        await window.RoboDexDB.createProfile({ fullName });
        window.location.href = './dashboard.html';
      } catch (err) {
        errorEl.textContent = err.message;
      }
    });

    renderProfiles().catch((err) => {
      const host = document.getElementById('profile-list-host');
      if (host) {
        host.innerHTML = `<div class="callout callout-danger">Could not read local profiles: ${window.RoboDexApp.escapeHtml(err.message)}</div>`;
      }
    });
  });
})();
