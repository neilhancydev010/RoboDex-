/* ==========================================================================
   RoboDex́ — Beginner Workbench Toolkit & Psychological Confidence Engine
   100% offline, local-first engineering tools that help real beginners:
   1. Interactive Pre-Power Safety Gate (reduces fear of frying hardware)
   2. Workbench Calculators (LED Resistor, 5V->3.3V Divider, Battery Runtime)
   3. Interactive Lab Measurement Notebook + CSV Export (real exhibition data)
   4. Guided "Fix My Hardware" Symptom Troubleshooter (prevents quitting)
   ========================================================================== */
(function () {
  'use strict';

  function esc(str) {
    if (window.RoboDexApp && typeof window.RoboDexApp.escapeHtml === 'function') {
      return window.RoboDexApp.escapeHtml(str);
    }
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* ------------------------------------------------------------------------
     1. INTERACTIVE PRE-POWER SAFETY GATE (Part D)
     ------------------------------------------------------------------------ */
  function renderSafetyGate(container, checklist) {
    if (!container || !checklist || !checklist.length) return;
    container.innerHTML = `
      <div class="safety-gate-box">
        <div class="flex flex-wrap items-center justify-between gap-sm mb-sm">
          <div>
            <strong>Interactive Pre-Power Safety Gate</strong>
            <p class="text-xs text-muted" style="margin:0.15rem 0 0;">Verify each item physically on your breadboard before plugging in USB or battery power.</p>
          </div>
          <span class="badge badge-warning" data-gate-status>0 / ${checklist.length} Verified</span>
        </div>
        <div style="display:grid; gap:0.45rem;">
          ${checklist.map((item, idx) => `
            <label class="exercise-option" style="cursor:pointer;">
              <input type="checkbox" data-gate-cb="${idx}">
              <span class="text-sm">${esc(item)}</span>
            </label>
          `).join('')}
        </div>
        <div class="safety-gate-banner mt-sm" data-gate-banner>
          Complete all ${checklist.length} checks above to clear your circuit for safe power-up.
        </div>
      </div>
    `;

    const cbs = Array.from(container.querySelectorAll('[data-gate-cb]'));
    const pill = container.querySelector('[data-gate-status]');
    const banner = container.querySelector('[data-gate-banner]');

    function updateGate() {
      const done = cbs.filter((c) => c.checked).length;
      const all = done === cbs.length;
      pill.textContent = all ? '✓ Cleared for Power' : `${done} / ${cbs.length} Verified`;
      pill.className = `badge ${all ? 'badge-success' : 'badge-warning'}`;
      banner.className = `safety-gate-banner mt-sm ${all ? 'cleared' : ''}`;
      banner.textContent = all
        ? '✓ Hardware Cleared: Your wiring checks passed. Connect USB or battery power now and watch for normal LED startup.'
        : `Complete all ${cbs.length} checks above (${cbs.length - done} remaining) before connecting power.`;
    }
    cbs.forEach((cb) => cb.addEventListener('change', updateGate));
  }

  /* ------------------------------------------------------------------------
     2. INTERACTIVE LAB MEASUREMENT NOTEBOOK + CSV EXPORT (Part J)
     ------------------------------------------------------------------------ */
  function renderLabNotebook(container, project, profileId) {
    if (!container) return;
    const storageKey = `robodex_lab_${profileId || 'guest'}_${project.id}`;
    const defaultRows = [
      { trial: 'Trial 1', condition: 'Baseline / Normal State', measured: '', observed: '', pass: 'Pending' },
      { trial: 'Trial 2', condition: 'Moderate Stimulus (Near Threshold)', measured: '', observed: '', pass: 'Pending' },
      { trial: 'Trial 3', condition: 'Critical Stimulus (Above Threshold)', measured: '', observed: '', pass: 'Pending' },
      { trial: 'Trial 4', condition: 'Recovery (Return to Normal)', measured: '', observed: '', pass: 'Pending' }
    ];

    let rows = defaultRows;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length) rows = parsed;
      }
    } catch { /* ignore */ }

    function saveRows() {
      try { localStorage.setItem(storageKey, JSON.stringify(rows)); } catch { /* ignore */ }
    }

    function draw() {
      container.innerHTML = `
        <div class="card" style="padding:1rem;">
          <div class="flex flex-wrap items-center justify-between gap-sm mb-sm">
            <div>
              <strong>Interactive Lab Measurement Notebook</strong>
              <p class="text-xs text-muted" style="margin:0.15rem 0 0;">Type your actual sensor measurements below. Saved locally and exportable as CSV for exhibition graphs.</p>
            </div>
            <div class="flex flex-wrap gap-xs">
              <button type="button" class="btn btn-secondary btn-sm" data-lab-add>+ Add Trial</button>
              <button type="button" class="btn btn-primary btn-sm" data-lab-csv>Download CSV ↓</button>
            </div>
          </div>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr><th>Trial</th><th>Applied Condition</th><th>Your Measured Reading</th><th>Observed System Action</th><th>Result</th></tr>
              </thead>
              <tbody>
                ${rows.map((r, i) => `
                  <tr>
                    <td><strong>${esc(r.trial)}</strong></td>
                    <td><input type="text" class="form-input lab-input" data-f="condition" data-i="${i}" value="${esc(r.condition)}"></td>
                    <td><input type="text" class="form-input lab-input" data-f="measured" data-i="${i}" placeholder="e.g. 24.5 C / 14 cm" value="${esc(r.measured)}"></td>
                    <td><input type="text" class="form-input lab-input" data-f="observed" data-i="${i}" placeholder="e.g. Alert ON in 0.4s" value="${esc(r.observed)}"></td>
                    <td>
                      <select class="form-input lab-input" data-f="pass" data-i="${i}">
                        ${['Pending', 'Pass', 'Needs Calibration'].map((opt) => `<option value="${opt}" ${r.pass === opt ? 'selected' : ''}>${opt}</option>`).join('')}
                      </select>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      container.querySelectorAll('.lab-input').forEach((inp) => {
        inp.addEventListener('input', () => {
          rows[Number(inp.dataset.i)][inp.dataset.f] = inp.value;
          saveRows();
        });
        inp.addEventListener('change', () => {
          rows[Number(inp.dataset.i)][inp.dataset.f] = inp.value;
          saveRows();
        });
      });

      container.querySelector('[data-lab-add]').addEventListener('click', () => {
        rows.push({ trial: `Trial ${rows.length + 1}`, condition: 'Custom Test', measured: '', observed: '', pass: 'Pending' });
        saveRows();
        draw();
      });

      container.querySelector('[data-lab-csv]').addEventListener('click', () => {
        const header = ['Trial', 'Applied Condition', 'Measured Reading', 'Observed System Action', 'Result'];
        const csvLines = [header.join(',')].concat(
          rows.map((r) => [r.trial, r.condition, r.measured, r.observed, r.pass]
            .map((v) => `"${String(v || '').replace(/"/g, '""')}"`).join(','))
        );
        const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `robodex_${project.id}_lab_data.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        if (window.RoboDexApp) window.RoboDexApp.showToast('Lab measurement CSV downloaded!');
      });
    }
    draw();
  }

  /* ------------------------------------------------------------------------
     3. INTERACTIVE "FIX MY HARDWARE" SYMPTOM WIZARD (Part K)
     ------------------------------------------------------------------------ */
  const SYMPTOMS = [
    {
      id: 'reboot',
      label: 'Board resets when pump, servo, or relay turns ON',
      steps: [
        '1. Unplug the actuator from your board 5V/3.3V pin immediately. Microcontrollers cannot supply motor/pump startup surges.',
        '2. Power the actuator from a separate 5V–12V 2A+ battery pack or power supply.',
        '3. Connect one black wire from the external supply negative (-) directly to your board GND (Common Ground).'
      ]
    },
    {
      id: 'port',
      label: 'Arduino IDE cannot find my USB / COM port',
      steps: [
        '1. Swap your USB cable: many phone cables are charge-only and lack data wires.',
        '2. Install the USB-to-UART driver matching your board chip (CP2102 or CH340).',
        '3. On ESP32, hold the BOOT button for 1–2 seconds when Arduino IDE prints "Connecting...".'
      ]
    },
    {
      id: 'sensor',
      label: 'Sensor prints 0, 4095, -1, or NaN',
      steps: [
        '1. Check VCC and GND polarity on the sensor silkscreen (never assume pin 1 is VCC).',
        '2. On ESP32 with Wi-Fi enabled, move analog sensors to ADC1 pins (GPIO32–39); ADC2 pins fail while Wi-Fi is active.',
        '3. Run the Stage 2 single-sensor sketch alone to isolate whether the issue is wiring or decision logic.'
      ]
    },
    {
      id: 'oled',
      label: 'OLED or I2C LCD screen stays completely blank',
      steps: [
        '1. Verify SDA/SCL pins (ESP32: GPIO21 SDA, GPIO22 SCL; Arduino Uno R3: A4 SDA, A5 SCL).',
        '2. Check whether your display uses I2C address 0x3C vs 0x3D (OLED) or 0x27 vs 0x3F (16x2 LCD).',
        '3. On 16x2 LCDs, gently turn the blue contrast potentiometer on the back until characters appear.'
      ]
    },
    {
      id: 'jitter',
      label: 'Relay clicks rapidly or servo jitters',
      steps: [
        '1. Confirm Common Ground between external actuator supply and microcontroller GND.',
        '2. Add a hysteresis gap in your code (e.g., turn ON above 30, turn OFF below 28) so noise does not chatter the output.',
        '3. Keep sensor jumper wires routed away from noisy motor/pump power wires.'
      ]
    }
  ];

  function renderSymptomTroubleshooter(container) {
    if (!container) return;
    container.innerHTML = `
      <div class="card mb-md" style="padding:1rem;">
        <strong>Interactive "Fix My Hardware" Diagnostic Assistant</strong>
        <p class="text-xs text-muted" style="margin:0.2rem 0 0.75rem;">Stuck on the workbench? Click what you are seeing right now for a calm 3-step fix.</p>
        <div class="flex flex-wrap gap-xs mb-sm" data-sym-btns>
          ${SYMPTOMS.map((s, i) => `<button type="button" class="btn btn-secondary btn-sm ${i === 0 ? 'active-sym' : ''}" data-sym="${s.id}">${esc(s.label)}</button>`).join('')}
        </div>
        <div class="callout callout-info" style="margin:0;" data-sym-out></div>
      </div>
    `;
    const out = container.querySelector('[data-sym-out]');
    const btns = Array.from(container.querySelectorAll('[data-sym]'));

    function show(id) {
      const s = SYMPTOMS.find((x) => x.id === id) || SYMPTOMS[0];
      btns.forEach((b) => {
        b.classList.toggle('btn-primary', b.dataset.sym === s.id);
        b.classList.toggle('btn-secondary', b.dataset.sym !== s.id);
      });
      out.innerHTML = `
        <div class="callout-title">${esc(s.label)}</div>
        <ol class="text-sm" style="margin:0.35rem 0 0 1.2rem; padding:0; display:grid; gap:0.3rem;">
          ${s.steps.map((st) => `<li>${esc(st.replace(/^\d+\.\s*/, ''))}</li>`).join('')}
        </ol>
      `;
    }
    btns.forEach((b) => b.addEventListener('click', () => show(b.dataset.sym)));
    show(SYMPTOMS[0].id);
  }

  /* ------------------------------------------------------------------------
     4. WORKBENCH ENGINEERING CALCULATORS MODAL (LED, 5V->3.3V, Battery)
     ------------------------------------------------------------------------ */
  function openToolkitModal() {
    let modal = document.getElementById('robodex-workbench-toolkit');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'robodex-workbench-toolkit';
      modal.className = 'diagram-lightbox';
      modal.setAttribute('aria-hidden', 'true');
      modal.innerHTML = `
        <div class="diagram-lightbox-panel" role="dialog" aria-modal="true" aria-label="Beginner Workbench Engineering Calculators" style="max-width:760px;">
          <div class="diagram-lightbox-header">
            <strong>Beginner Workbench Engineering Calculators</strong>
            <button type="button" class="btn btn-secondary btn-sm" id="toolkit-close-btn">Close ✕</button>
          </div>
          <div style="padding:1.1rem; overflow:auto; background:var(--bg-surface); display:grid; gap:1rem;">
            <!-- Calc 1: 5V to 3.3V Divider -->
            <div class="card" style="padding:1rem;">
              <h3 style="margin-bottom:0.25rem;">1. ESP32 Voltage Divider Safety Checker (5V → 3.3V)</h3>
              <p class="text-xs text-muted mb-sm">Check if your resistor pair safely drops a 5V sensor output (HC-SR04 ECHO, MQ-2) to 3.3V for ESP32.</p>
              <div class="grid grid-3" style="gap:0.6rem;">
                <div><label class="text-xs">Sensor Voltage (V)</label><input id="calc-vin" type="number" step="0.1" value="5.0" class="form-input"></div>
                <div><label class="text-xs">R1 Series (Ω)</label><input id="calc-r1" type="number" step="100" value="1000" class="form-input"></div>
                <div><label class="text-xs">R2 to GND (Ω)</label><input id="calc-r2" type="number" step="100" value="2000" class="form-input"></div>
              </div>
              <div id="calc-div-out" class="callout callout-success mt-sm" style="margin-bottom:0;"></div>
            </div>

            <!-- Calc 2: LED Resistor -->
            <div class="card" style="padding:1rem;">
              <h3 style="margin-bottom:0.25rem;">2. LED Current-Limiting Resistor Calculator</h3>
              <p class="text-xs text-muted mb-sm">Never burn an LED or GPIO pin: find the safe series resistor value.</p>
              <div class="grid grid-3" style="gap:0.6rem;">
                <div><label class="text-xs">Board Logic (V)</label><select id="calc-led-vs" class="form-input"><option value="3.3">3.3V (ESP32)</option><option value="5.0">5.0V (Arduino Uno R3)</option></select></div>
                <div><label class="text-xs">LED Color (Vf)</label><select id="calc-led-vf" class="form-input"><option value="2.0">Red / Yellow (2.0V)</option><option value="2.2">Green (2.2V)</option><option value="3.0">Blue / White (3.0V)</option></select></div>
                <div><label class="text-xs">Target Current (mA)</label><input id="calc-led-ma" type="number" value="10" min="2" max="20" class="form-input"></div>
              </div>
              <div id="calc-led-out" class="callout callout-info mt-sm" style="margin-bottom:0;"></div>
            </div>

            <!-- Calc 3: Exhibition Battery Runtime -->
            <div class="card" style="padding:1rem;">
              <h3 style="margin-bottom:0.25rem;">3. Exhibition Battery Runtime Estimator</h3>
              <p class="text-xs text-muted mb-sm">Estimate how long your robot will run on a power bank or 18650 pack during exhibition judging.</p>
              <div class="grid grid-2" style="gap:0.6rem;">
                <div><label class="text-xs">Battery Capacity (mAh)</label><input id="calc-bat-mah" type="number" value="2600" class="form-input"></div>
                <div><label class="text-xs">Average System Draw (mA)</label><input id="calc-bat-ma" type="number" value="250" class="form-input"></div>
              </div>
              <div id="calc-bat-out" class="callout callout-info mt-sm" style="margin-bottom:0;"></div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      const close = () => { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); };
      modal.querySelector('#toolkit-close-btn').addEventListener('click', close);
      modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

      function recalc() {
        // 1. Voltage divider
        const vin = Math.max(0, Number(modal.querySelector('#calc-vin').value) || 0);
        const r1 = Math.max(1, Number(modal.querySelector('#calc-r1').value) || 1);
        const r2 = Math.max(1, Number(modal.querySelector('#calc-r2').value) || 1);
        const vout = vin * (r2 / (r1 + r2));
        const divBox = modal.querySelector('#calc-div-out');
        const safe = vout <= 3.35 && vout >= 2.2;
        const tooHigh = vout > 3.35;
        divBox.className = `callout mt-sm ${tooHigh ? 'callout-danger' : (safe ? 'callout-success' : 'callout-warning')}`;
        divBox.innerHTML = `<strong>Output Voltage: ${vout.toFixed(2)} V</strong> — ${tooHigh ? 'DANGER: Too high for ESP32 (max 3.3V). Increase R1 or decrease R2!' : (safe ? 'SAFE FOR ESP32 GPIO (within 2.2V–3.3V HIGH threshold).' : 'Low voltage: may not register reliably as digital HIGH on 3.3V logic.')}`;

        // 2. LED resistor
        const vs = Number(modal.querySelector('#calc-led-vs').value) || 3.3;
        const vf = Number(modal.querySelector('#calc-led-vf').value) || 2.0;
        const ma = Math.max(1, Number(modal.querySelector('#calc-led-ma').value) || 10);
        const rawOhm = Math.max(47, Math.round(((vs - vf) / (ma / 1000))));
        const std = [100, 150, 220, 330, 470, 680, 1000].find((v) => v >= rawOhm) || 1000;
        modal.querySelector('#calc-led-out').innerHTML = `<strong>Calculated: ${rawOhm} Ω</strong> → Use standard <strong>${std} Ω</strong> resistor in series with the LED.`;

        // 3. Battery runtime (80% usable efficiency factor)
        const mah = Math.max(100, Number(modal.querySelector('#calc-bat-mah').value) || 2000);
        const draw = Math.max(10, Number(modal.querySelector('#calc-bat-ma').value) || 200);
        const hrs = (mah / draw) * 0.8;
        modal.querySelector('#calc-bat-out').innerHTML = `<strong>Estimated Exhibition Runtime: ~${hrs.toFixed(1)} hours</strong> (includes 80% real-world battery/regulator efficiency factor).`;
      }

      modal.querySelectorAll('input, select').forEach((el) => {
        el.addEventListener('input', recalc);
        el.addEventListener('change', recalc);
      });
      recalc();
    }
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  }

  window.RoboDexToolkit = {
    renderSafetyGate,
    renderLabNotebook,
    renderSymptomTroubleshooter,
    openToolkitModal
  };
})();
