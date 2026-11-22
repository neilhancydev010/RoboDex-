/* RoboDex́ Stage 3: Data-Driven Technical SVG Diagram & Lightbox Engine
 * Generates technically synchronized SVG diagrams directly from each project's
 * validated wiringTable, BOM, and IPO model so diagrams NEVER contradict written pin tables.
 */
(function () {
  'use strict';

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function trunc(str, max) {
    const s = String(str || '');
    return s.length > max ? s.slice(0, max - 1) + '…' : s;
  }

  const SIGNAL_COLORS = {
    Power: '#ef4444',    // Red: Positive power / rail
    I2C: '#38bdf8',      // Blue: I2C communication
    UART: '#38bdf8',     // Blue: UART serial
    SPI: '#60a5fa',      // Blue: SPI bus
    Sensor: '#facc15',   // Yellow/Amber: Sensor signal
    Actuator: '#22c55e', // Green: Driver / actuator output
    Output: '#22c55e',   // Green: Indicator output
    Wireless: '#c084fc'  // Purple: Optional wireless
  };

  function wrapDiagramCard(title, badge, svgHtml, caption) {
    const id = 'diag-' + Math.random().toString(36).slice(2, 9);
    return `
      <figure class="tech-diagram-card" id="${id}">
        <div class="tech-diagram-bar">
          <div>
            <span class="badge badge-bloom">${esc(badge)}</span>
            <strong class="tech-diagram-title">${esc(title)}</strong>
          </div>
          <button type="button" class="btn btn-secondary btn-sm tech-zoom-btn" data-zoom-target="${id}">Expand Diagram ⤢</button>
        </div>
        <div class="tech-diagram-stage">
          ${svgHtml}
        </div>
        <figcaption class="tech-diagram-caption">${esc(caption)}</figcaption>
      </figure>
    `;
  }

  // PART D: Color-Coded Circuit & Power-Domain Wiring Diagram synchronized 1:1 with wiringTable
  function renderCircuitWiringDiagram(project) {
    const rows = (project.partD && project.partD.wiringTable) || [];
    const boardName = project.recommendedBoardName || 'Microcontroller';
    const isEsp = project.recommendedBoardId === 'esp32-devkitc';
    const rowH = 48;
    const topPad = 72;
    const h = Math.max(320, topPad + rows.length * rowH + 64);

    const nodes = rows.map((r, i) => {
      const y = topPad + i * rowH;
      const col = SIGNAL_COLORS[r.signalType] || '#a78bfa';
      const pinText = trunc(r.boardPin, 32);
      const compText = trunc(r.component, 34);
      const voltText = trunc(r.voltageDomain, 24);
      return `
        <g>
          <rect x="28" y="${y}" width="215" height="36" rx="8" fill="#1b1530" stroke="${col}" stroke-width="2"/>
          <text x="40" y="${y + 15}" fill="#f8fafc" font-size="11" font-weight="700">${esc(pinText)}</text>
          <text x="40" y="${y + 29}" fill="#cbd5e1" font-size="9.5">${esc(r.signalType)} · ${esc(voltText)}</text>

          <line x1="243" y1="${y + 18}" x2="415" y2="${y + 18}" stroke="${col}" stroke-width="3" stroke-dasharray="${r.signalType === 'Power' ? '0' : '0'}"/>
          <circle cx="243" cy="${y + 18}" r="4" fill="${col}"/>
          <circle cx="415" cy="${y + 18}" r="4" fill="${col}"/>
          <rect x="292" y="${y + 6}" width="74" height="22" rx="11" fill="#0f0a1e" stroke="${col}" stroke-width="1.2"/>
          <text x="329" y="${y + 20}" text-anchor="middle" fill="${col}" font-size="9.5" font-weight="700">${esc(r.signalType)}</text>

          <rect x="415" y="${y}" width="325" height="36" rx="8" fill="#171326" stroke="#475569" stroke-width="1.5"/>
          <text x="428" y="${y + 15}" fill="#f8fafc" font-size="11" font-weight="700">${esc(compText)}</text>
          <text x="428" y="${y + 29}" fill="#94a3b8" font-size="9.5">Pins: ${esc(trunc(r.componentPin, 42))}</text>
        </g>
      `;
    }).join('');

    const legendY = h - 38;
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 768 ${h}" role="img" aria-label="Circuit and wiring concept diagram for ${esc(project.title)}">
        <rect width="768" height="${h}" rx="12" fill="#0c0818"/>
        <rect x="18" y="16" width="235" height="42" rx="10" fill="#2e1065" stroke="#c084fc" stroke-width="2"/>
        <text x="135" y="34" text-anchor="middle" fill="#ffffff" font-size="12" font-weight="700">${esc(trunc(boardName, 30))}</text>
        <text x="135" y="49" text-anchor="middle" fill="#e9d5ff" font-size="10">${isEsp ? '3.3V Logic ONLY · ADC1 Safe Pins' : '5V TTL Logic · Hardware I2C A4/A5'}</text>

        <rect x="415" y="16" width="325" height="42" rx="10" fill="#1e293b" stroke="#38bdf8" stroke-width="1.8"/>
        <text x="577" y="34" text-anchor="middle" fill="#ffffff" font-size="12" font-weight="700">Project Subsystems &amp; External Power</text>
        <text x="577" y="49" text-anchor="middle" fill="#bae6fd" font-size="10">Separate Actuator Rail + Mandatory Common GND</text>

        ${nodes}

        <g transform="translate(24, ${legendY})">
          <circle cx="8" cy="8" r="5" fill="#ef4444"/><text x="18" y="12" fill="#cbd5e1" font-size="10">Power / GND</text>
          <circle cx="104" cy="8" r="5" fill="#facc15"/><text x="114" y="12" fill="#cbd5e1" font-size="10">Sensor Signal</text>
          <circle cx="206" cy="8" r="5" fill="#38bdf8"/><text x="216" y="12" fill="#cbd5e1" font-size="10">I2C / UART / SPI</text>
          <circle cx="322" cy="8" r="5" fill="#22c55e"/><text x="332" y="12" fill="#cbd5e1" font-size="10">Actuator / Driver Out</text>
          <text x="716" y="12" text-anchor="end" fill="#94a3b8" font-size="9.5">Verify silkscreen pins before powering</text>
        </g>
      </svg>
    `;
    return wrapDiagramCard(
      `Circuit Connection & Power-Domain Diagram: ${project.title}`,
      'Verified Technical Schematic Concept',
      svg,
      'Generated directly from Part D validated pin table. Always verify silkscreen pin labels and external actuator power polarity before energizing.'
    );
  }

  // PART G: Input -> Process -> Output -> Feedback System-Flow SVG
  function renderIpoFlowDiagram(project) {
    const ipo = (project.partG && project.partG.ipo) || { inputs: [], processing: [], outputs: [], feedback: [] };
    const cols = [
      { title: '1. INPUTS', color: '#facc15', items: ipo.inputs || [] },
      { title: '2. PROCESSING', color: '#c084fc', items: ipo.processing || [] },
      { title: '3. OUTPUTS', color: '#22c55e', items: ipo.outputs || [] },
      { title: '4. FEEDBACK', color: '#38bdf8', items: ipo.feedback || [] }
    ];

    const colSvg = cols.map((c, idx) => {
      const x = 18 + idx * 188;
      const lines = c.items.slice(0, 3).map((item, li) => `
        <rect x="${x + 10}" y="${66 + li * 48}" width="152" height="40" rx="7" fill="#171326" stroke="#334155" stroke-width="1"/>
        <text x="${x + 18}" y="${83 + li * 48}" fill="#f8fafc" font-size="9.5" font-weight="600">${esc(trunc(item, 23))}</text>
        <text x="${x + 18}" y="${97 + li * 48}" fill="#94a3b8" font-size="8.5">${esc(trunc(item.slice(23), 25))}</text>
      `).join('');
      const arrow = idx < 3 ? `<path d="M${x + 174},125 L${x + 186},125" stroke="${c.color}" stroke-width="3" stroke-linecap="round"/><polygon points="${x + 186},125 ${x + 180},120 ${x + 180},130" fill="${c.color}"/>` : '';
      return `
        <g>
          <rect x="${x}" y="22" width="172" height="198" rx="12" fill="#120d22" stroke="${c.color}" stroke-width="2"/>
          <rect x="${x}" y="22" width="172" height="32" rx="10" fill="${c.color}" opacity="0.18"/>
          <text x="${x + 86}" y="42" text-anchor="middle" fill="${c.color}" font-size="11" font-weight="800">${c.title}</text>
          ${lines}
          ${arrow}
        </g>
      `;
    }).join('');

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 768 242" role="img" aria-label="Input process output feedback system flow for ${esc(project.title)}">
        <rect width="768" height="242" rx="12" fill="#0c0818"/>
        ${colSvg}
      </svg>
    `;
    return wrapDiagramCard(
      `System-Flow Architecture (Input → Process → Output → Feedback)`,
      'Conceptual System-Flow Diagram',
      svg,
      'Shows how physical measurements enter your microcontroller, pass through calibrated decision logic, drive safe outputs, and produce verifiable telemetry.'
    );
  }

  // PART F: Physical Assembly & Enclosure Layout Concept SVG
  function renderAssemblyLayoutDiagram(project) {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 768 230" role="img" aria-label="Physical assembly layout concept for ${esc(project.title)}">
        <rect width="768" height="230" rx="12" fill="#0c0818"/>
        <rect x="24" y="22" width="220" height="186" rx="12" fill="#141026" stroke="#facc15" stroke-width="2"/>
        <text x="134" y="46" text-anchor="middle" fill="#facc15" font-size="11.5" font-weight="700">SENSING ZONE</text>
        <text x="134" y="72" text-anchor="middle" fill="#e2e8f0" font-size="10">Clear physical exposure</text>
        <text x="134" y="90" text-anchor="middle" fill="#94a3b8" font-size="9.5">Rigid sensor mounting</text>
        <text x="134" y="108" text-anchor="middle" fill="#94a3b8" font-size="9.5">Away from motor/pump noise</text>
        <rect x="46" y="130" width="176" height="54" rx="8" fill="#1e1b4b" stroke="#38bdf8" stroke-width="1.5"/>
        <text x="134" y="154" text-anchor="middle" fill="#bae6fd" font-size="10" font-weight="600">Primary Sensor(s)</text>
        <text x="134" y="170" text-anchor="middle" fill="#94a3b8" font-size="9">${esc(trunc((project.partG.ipo.inputs || ['Sensor'])[0], 26))}</text>

        <rect x="274" y="22" width="220" height="186" rx="12" fill="#141026" stroke="#c084fc" stroke-width="2"/>
        <text x="384" y="46" text-anchor="middle" fill="#c084fc" font-size="11.5" font-weight="700">PROTECTED CONTROL BAY</text>
        <text x="384" y="72" text-anchor="middle" fill="#e2e8f0" font-size="10">Dry, ventilated enclosure</text>
        <text x="384" y="90" text-anchor="middle" fill="#94a3b8" font-size="9.5">${esc(trunc(project.recommendedBoardName, 28))}</text>
        <text x="384" y="108" text-anchor="middle" fill="#94a3b8" font-size="9.5">Breadboard + 1kΩ/2kΩ dividers</text>
        <rect x="296" y="130" width="176" height="54" rx="8" fill="#2e1065" stroke="#c084fc" stroke-width="1.5"/>
        <text x="384" y="154" text-anchor="middle" fill="#f5f3ff" font-size="10" font-weight="600">Common GND Bus Bar</text>
        <text x="384" y="170" text-anchor="middle" fill="#d8b4fe" font-size="9">Logic + External Supply Tied</text>

        <rect x="524" y="22" width="220" height="186" rx="12" fill="#141026" stroke="#22c55e" stroke-width="2"/>
        <text x="634" y="46" text-anchor="middle" fill="#22c55e" font-size="11.5" font-weight="700">ACTUATION &amp; POWER BAY</text>
        <text x="634" y="72" text-anchor="middle" fill="#e2e8f0" font-size="10">Separate 5V–12V DC Supply</text>
        <text x="634" y="90" text-anchor="middle" fill="#94a3b8" font-size="9.5">Relay / MOSFET / Motor Driver</text>
        <text x="634" y="108" text-anchor="middle" fill="#94a3b8" font-size="9.5">Strain-relieved load leads</text>
        <rect x="546" y="130" width="176" height="54" rx="8" fill="#052e16" stroke="#22c55e" stroke-width="1.5"/>
        <text x="634" y="154" text-anchor="middle" fill="#bbf7d0" font-size="10" font-weight="600">Outputs &amp; Indicators</text>
        <text x="634" y="170" text-anchor="middle" fill="#86efac" font-size="9">${esc(trunc((project.partG.ipo.outputs || ['Actuator'])[0], 26))}</text>

        <line x1="244" y1="115" x2="274" y2="115" stroke="#facc15" stroke-width="3"/>
        <line x1="494" y1="115" x2="524" y2="115" stroke="#22c55e" stroke-width="3"/>
      </svg>
    `;
    return wrapDiagramCard(
      `Physical Enclosure & Subsystem Placement Concept`,
      'Conceptual Assembly Layout',
      svg,
      'Physical zoning guideline separating delicate sensors, dry controller electronics, and high-current actuators/water/moving parts.'
    );
  }

  // Lightweight Click-to-Zoom Lightbox Handler
  function bindLightbox() {
    let modal = document.getElementById('robodex-diagram-lightbox');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'robodex-diagram-lightbox';
      modal.className = 'diagram-lightbox';
      modal.setAttribute('aria-hidden', 'true');
      modal.innerHTML = `
        <div class="diagram-lightbox-panel" role="dialog" aria-modal="true" aria-label="Expanded technical diagram">
          <div class="diagram-lightbox-header">
            <strong id="lightbox-title">Expanded Technical Diagram</strong>
            <button type="button" class="btn btn-secondary btn-sm" id="lightbox-close-btn">Close ✕</button>
          </div>
          <div class="diagram-lightbox-body" id="lightbox-body"></div>
        </div>
      `;
      document.body.appendChild(modal);

      const close = () => {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
      };
      modal.querySelector('#lightbox-close-btn').addEventListener('click', close);
      modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('open')) close(); });
    }

    document.querySelectorAll('.tech-zoom-btn').forEach((btn) => {
      if (btn.dataset.bound) return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', () => {
        const card = document.getElementById(btn.dataset.zoomTarget);
        if (!card) return;
        const title = card.querySelector('.tech-diagram-title')?.textContent || 'Technical Diagram';
        const svgEl = card.querySelector('.tech-diagram-stage')?.innerHTML || '';
        modal.querySelector('#lightbox-title').textContent = title;
        modal.querySelector('#lightbox-body').innerHTML = svgEl;
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
      });
    });
  }

  window.RoboDexProjectDiagrams = {
    renderCircuitWiringDiagram,
    renderIpoFlowDiagram,
    renderAssemblyLayoutDiagram,
    bindLightbox
  };
})();
