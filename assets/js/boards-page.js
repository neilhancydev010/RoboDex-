/* ==========================================================================
   RoboDex́ — Board-Specific Development Paths Controller
   Covers Uno R3, Uno R4, Nano (variants), Mega 2560, and ESP32 (variants).
   ========================================================================== */

(function () {
  async function init() {
    let profile = await window.RoboDexDB.ensureActiveProfile();
    const boardsData = await window.RoboDexApp.loadJSON('./data/boards.json');
    const tabsHost = document.getElementById('board-tabs');
    const detailHost = document.getElementById('board-detail');
    const tableBody = document.getElementById('board-comparison-body');

    const urlBoard = new URLSearchParams(window.location.search).get('board');
    let activeId = boardsData.boards.some((b) => b.id === urlBoard) ? urlBoard : boardsData.boards[0].id;

    // Populate comparison matrix
    tableBody.innerHTML = boardsData.boards.map((b) => `
      <tr>
        <td><strong>${window.RoboDexApp.escapeHtml(b.name)}</strong></td>
        <td>${window.RoboDexApp.escapeHtml(b.mcu)}</td>
        <td><span class="badge ${b.logicVoltage.includes('3.3V') ? 'badge-warning' : 'badge-success'}">${window.RoboDexApp.escapeHtml(b.logicVoltage)}</span></td>
        <td>${window.RoboDexApp.escapeHtml(b.digitalPins)}</td>
        <td>${window.RoboDexApp.escapeHtml(b.analogInputs)}</td>
        <td>${window.RoboDexApp.escapeHtml(b.pwmSummary)}</td>
        <td>${window.RoboDexApp.escapeHtml(b.bestFor)}</td>
      </tr>
    `).join('');

    function renderTabs() {
      tabsHost.innerHTML = boardsData.boards.map((b) => `
        <button type="button" class="tab-btn ${b.id === activeId ? 'active' : ''}" data-board-id="${b.id}">
          ${window.RoboDexApp.escapeHtml(b.name)}
        </button>
      `).join('');

      tabsHost.querySelectorAll('[data-board-id]').forEach((btn) => {
        btn.addEventListener('click', () => {
          activeId = btn.dataset.boardId;
          renderTabs();
          renderDetail();
        });
      });
    }

    function renderDetail() {
      const b = boardsData.boards.find((x) => x.id === activeId);
      const isSelected = (profile.selectedBoards || []).includes(b.id);

      detailHost.innerHTML = `
        <div class="card">
          <div class="card-header flex-wrap">
            <div>
              <span class="badge badge-cyan">${window.RoboDexApp.escapeHtml(b.architecture)}</span>
              <span class="badge ${b.logicVoltage.includes('3.3V') ? 'badge-warning' : 'badge-success'}">${window.RoboDexApp.escapeHtml(b.logicVoltage)}</span>
              <h2 class="mt-sm">${window.RoboDexApp.escapeHtml(b.name)}</h2>
              <p class="mb-sm">${window.RoboDexApp.escapeHtml(b.overview)}</p>
            </div>
            <div class="flex flex-wrap gap-sm">
              <button type="button" id="toggle-board-btn" class="btn ${isSelected ? 'btn-secondary' : 'btn-primary'}">
                ${isSelected ? '✓ In My Selected Boards' : '+ Add to My Selected Boards'}
              </button>
              <a class="btn btn-accent" href="./learn.html?lesson=${encodeURIComponent(b.lessonId)}">Open Full Board Lesson →</a>
            </div>
          </div>

          ${b.voltageWarning ? `
            <div class="callout callout-danger">
              <div class="callout-title">⚡ Critical Voltage &amp; Electrical Safety Note</div>
              <p style="margin:0;">${window.RoboDexApp.escapeHtml(b.voltageWarning)}</p>
            </div>
          ` : ''}

          <div class="grid grid-2 mt-md">
            <div class="callout" style="margin:0;">
              <div class="callout-title">Pin Capabilities &amp; Peripherals</div>
              <ul style="margin:0.4rem 0 0 1.15rem;">
                ${b.pinHighlights.map((h) => `<li>${window.RoboDexApp.escapeHtml(h)}</li>`).join('')}
              </ul>
            </div>
            <div class="callout" style="margin:0;">
              <div class="callout-title">Arduino IDE Board Setup</div>
              <ol style="margin:0.4rem 0 0 1.15rem;">
                ${b.ideSetupSteps.map((s) => `<li>${window.RoboDexApp.escapeHtml(s)}</li>`).join('')}
              </ol>
            </div>
          </div>

          ${b.variants && b.variants.length ? `
            <div class="mt-lg">
              <h3>Important Hardware Variants (Do Not Confuse)</h3>
              <div class="table-wrap mt-sm">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Variant</th>
                      <th>MCU / Core</th>
                      <th>Logic Voltage</th>
                      <th>Key Distinctions</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${b.variants.map((v) => `
                      <tr>
                        <td><strong>${window.RoboDexApp.escapeHtml(v.name)}</strong></td>
                        <td>${window.RoboDexApp.escapeHtml(v.mcu)}</td>
                        <td>${window.RoboDexApp.escapeHtml(v.voltage)}</td>
                        <td>${window.RoboDexApp.escapeHtml(v.notes)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          ` : ''}

          <div class="mt-lg">
            <h3>Board-Specific Programming Example</h3>
            <p class="text-sm">${window.RoboDexApp.escapeHtml(b.codeNote)}</p>
            <div class="code-block">
              <div class="code-block-header"><span>${window.RoboDexApp.escapeHtml(b.id)}_starter.ino</span></div>
              <pre><code>${window.RoboDexApp.highlightCpp(b.starterCode)}</code></pre>
            </div>
          </div>
        </div>
      `;

      document.getElementById('toggle-board-btn').addEventListener('click', async () => {
        const list = new Set(profile.selectedBoards || []);
        if (list.has(b.id)) {
          list.delete(b.id);
        } else {
          list.add(b.id);
        }
        profile = await window.RoboDexDB.updateProfile(profile.id, { selectedBoards: Array.from(list) });
        window.RoboDexApp.showToast(`Updated selected boards for ${profile.displayName}.`);
        renderDetail();
      });
    }

    renderTabs();
    renderDetail();
  }

  document.addEventListener('DOMContentLoaded', () => {
    init().catch((err) => {
      const host = document.getElementById('board-detail');
      if (host) host.innerHTML = `<div class="callout callout-danger">${window.RoboDexApp.escapeHtml(err.message)}</div>`;
    });
  });
})();
