/* ==========================================================================
   RoboDex́ — Local Student Profiles Manager Controller
   Multiple independent profiles stored locally in IndexedDB (no passwords).
   ========================================================================== */

(function () {
  const BOARD_CHOICES = [
    { id: 'uno-r3', label: 'Arduino Uno R3' },
    { id: 'uno-r4', label: 'Arduino Uno R4' },
    { id: 'nano', label: 'Arduino Nano Family' },
    { id: 'mega-2560', label: 'Arduino Mega 2560' },
    { id: 'esp32', label: 'ESP32 Family' }
  ];

  async function renderAll() {
    const active = await window.RoboDexDB.ensureActiveProfile();
    const profiles = await window.RoboDexDB.listProfiles();

    const listEl = document.getElementById('profiles-list');
    listEl.innerHTML = profiles.map((p) => {
      const isCurrent = p.id === active.id;
      return `
        <div class="card" style="border-color:${isCurrent ? 'var(--blue-600)' : 'var(--border-color)'};">
          <div class="card-header">
            <div>
              <strong>${window.RoboDexApp.escapeHtml(p.displayName)}</strong>
              ${isCurrent ? '<span class="badge badge-success" style="margin-left:0.4rem;">Active</span>' : ''}
              <div class="text-xs text-muted mt-sm">
                Boards: ${(p.selectedBoards || []).join(', ') || 'None'} · Last visited: <code>${window.RoboDexApp.escapeHtml(p.lastVisitedLesson || 'm01-l01')}</code>
              </div>
            </div>
            <div class="flex flex-wrap gap-xs">
              ${!isCurrent ? `<button type="button" class="btn btn-primary btn-sm" data-switch-id="${p.id}">Select Profile</button>` : ''}
              <a class="btn btn-accent btn-sm" href="./learn.html?lesson=${encodeURIComponent(p.lastVisitedLesson || 'm01-l01')}">Resume Session</a>
            </div>
          </div>
          ${p.goal ? `<p class="text-sm" style="margin:0;">Goal: ${window.RoboDexApp.escapeHtml(p.goal)}</p>` : ''}
        </div>
      `;
    }).join('');

    listEl.querySelectorAll('[data-switch-id]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        window.RoboDexPrefs.set('activeProfileId', btn.dataset.switchId);
        await window.RoboDexApp.renderShell();
        await renderAll();
        window.RoboDexApp.showToast('Switched active local student profile.');
      });
    });

    // Populate Edit Active Profile form
    document.getElementById('edit-name').value = active.displayName || '';
    document.getElementById('edit-goal').value = active.goal || '';
    document.getElementById('edit-lock').checked = Boolean(active.lockProgression);
    document.getElementById('edit-font-size').value = window.RoboDexPrefs.get('fontSize') || 'md';
    document.getElementById('edit-pass-score').value = window.RoboDexPrefs.get('quizPassScore') || 70;

    const editBoardsHost = document.getElementById('edit-boards-host');
    editBoardsHost.innerHTML = BOARD_CHOICES.map((b) => `
      <label class="badge" style="cursor:pointer; padding:0.4rem 0.7rem;">
        <input type="checkbox" name="editBoards" value="${b.id}" ${(active.selectedBoards || []).includes(b.id) ? 'checked' : ''}>
        <span>${b.label}</span>
      </label>
    `).join('');
  }

  document.addEventListener('DOMContentLoaded', () => {
    const createBoardsHost = document.getElementById('create-boards-host');
    if (createBoardsHost) {
      createBoardsHost.innerHTML = BOARD_CHOICES.map((b) => `
        <label class="badge" style="cursor:pointer; padding:0.4rem 0.7rem;">
          <input type="checkbox" name="createBoards" value="${b.id}" ${b.id === 'uno-r3' ? 'checked' : ''}>
          <span>${b.label}</span>
        </label>
      `).join('');
    }

    document.getElementById('create-profile-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('new-name').value.trim();
      if (!name) {
        window.RoboDexApp.showToast('Please enter a display name.');
        return;
      }
      const goal = document.getElementById('new-goal').value.trim();
      const boards = Array.from(document.querySelectorAll('input[name="createBoards"]:checked')).map((i) => i.value);
      const lockProgression = document.getElementById('new-lock').checked;

      await window.RoboDexDB.createProfile({
        displayName: name,
        goal,
        selectedBoards: boards.length ? boards : ['uno-r3'],
        lockProgression
      });
      e.target.reset();
      await window.RoboDexApp.renderShell();
      await renderAll();
      window.RoboDexApp.showToast(`Created and activated profile "${name}".`);
    });

    document.getElementById('edit-profile-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const active = await window.RoboDexDB.ensureActiveProfile();
      const displayName = document.getElementById('edit-name').value.trim() || active.displayName;
      const goal = document.getElementById('edit-goal').value.trim();
      const selectedBoards = Array.from(document.querySelectorAll('input[name="editBoards"]:checked')).map((i) => i.value);
      const lockProgression = document.getElementById('edit-lock').checked;
      const fontSize = document.getElementById('edit-font-size').value;
      const quizPassScore = Math.min(100, Math.max(50, Number(document.getElementById('edit-pass-score').value) || 70));

      await window.RoboDexDB.updateProfile(active.id, {
        displayName,
        goal,
        selectedBoards: selectedBoards.length ? selectedBoards : ['uno-r3'],
        lockProgression
      });
      window.RoboDexPrefs.set('fontSize', fontSize);
      window.RoboDexPrefs.set('quizPassScore', quizPassScore);
      window.RoboDexPrefs.applyVisualPrefs();

      await window.RoboDexApp.renderShell();
      await renderAll();
      window.RoboDexApp.showToast('Profile and learning preferences saved.');
    });

    renderAll();
  });
})();
