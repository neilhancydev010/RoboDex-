/* ==========================================================================
   RoboDex́ V2 Stage 3: Application-Based Learning Controller
   - Catalogue Mode: All 40 robotics projects with search, category, difficulty,
     board compatibility, and award-potential filters + real per-profile progress.
   - Course Mode (?project=proj-01..proj-40): Full 13-part (PART A–M) guided
     engineering workspace with verified wiring SVGs, BOM, editable progressive
     .ino code stages, exercises, testing logs, troubleshooting, exhibition pitch,
     and 11 IndexedDB-persisted checkpoints per local student profile.
   ========================================================================== */

(function () {
  'use strict';

  let profile = null;
  let catalogue = null;
  let snapshot = null;
  let projectMap = new Map();
  const batchCache = new Map();

  function esc(str) {
    return window.RoboDexApp.escapeHtml(str);
  }

  function getProjectParam() {
    const p = new URLSearchParams(window.location.search);
    return p.get('project');
  }

  async function refreshSnapshot() {
    snapshot = await window.RoboDexDB.getProfileSnapshot(profile.id);
    profile = snapshot.profile;
    projectMap = new Map((snapshot.projects || []).map((r) => [r.projectId, r.completedSteps || []]));
  }

  async function loadFullProject(projectId) {
    const entry = catalogue.projects.find((p) => p.id === projectId);
    if (!entry) return null;
    if (!batchCache.has(entry.batchFile)) {
      const data = await window.RoboDexApp.loadJSON(entry.batchFile);
      batchCache.set(entry.batchFile, data.projects || []);
    }
    return batchCache.get(entry.batchFile).find((p) => p.id === projectId) || null;
  }

  function countSummary() {
    let started = 0;
    let completedProjects = 0;
    let totalChecksDone = 0;
    const totalChecksPossible = catalogue.projects.reduce((a, p) => a + (p.checkpointCount || 11), 0);
    catalogue.projects.forEach((p) => {
      const done = (projectMap.get(p.id) || []).length;
      if (done > 0) started++;
      if (done >= (p.checkpointCount || 11)) completedProjects++;
      totalChecksDone += done;
    });
    return { started, completedProjects, totalChecksDone, totalChecksPossible };
  }

  /* ========================================================================
     CATALOGUE VIEW (All 40 Projects)
     ======================================================================== */
  function renderCatalogue() {
    const root = document.getElementById('projects-app-root');
    const sum = countSummary();

    const categories = [
      { key: 'all', label: 'All Categories (40)' },
      { key: 'natural-disasters', label: 'Natural Disasters' },
      { key: 'farming-water', label: 'Farming & Water' },
      { key: 'environment-water', label: 'Environment & Water' },
      { key: 'health-medical', label: 'Health & Medical' },
      { key: 'accessibility', label: 'Accessibility' },
      { key: 'safety-transport', label: 'Safety, Security & Transport' },
      { key: 'energy-smart-city', label: 'Energy & Smart City' },
      { key: 'weather-climate', label: 'Weather & Climate' },
      { key: 'automation-robotics', label: 'Automation & Robotics' }
    ];
    const difficulties = ['all', 'Easy', 'Easy–Medium', 'Medium', 'Medium–Hard', 'Hard', 'Very Hard'];
    const awards = ['all', 'Very High', 'High', 'Medium–High', 'Medium'];
    const boards = [
      { key: 'all', label: 'All Boards' },
      { key: 'esp32-devkitc', label: 'ESP32 DevKit V1 / DevKitC' },
      { key: 'uno-r3', label: 'Arduino Uno R3' },
      { key: 'esp32-s3', label: 'ESP32-S3 Compatible' },
      { key: 'uno-r4-wifi', label: 'Uno R4 WiFi Compatible' },
      { key: 'nano-classic', label: 'Arduino Nano Compatible' }
    ];

    root.innerHTML = `
      <section class="bloom-hero">
        <svg class="bloom-hero-curves" viewBox="0 0 1440 320" preserveAspectRatio="none" fill="none" aria-hidden="true">
          <path d="M-40,230 C320,80 780,310 1480,90 L1480,-20 L-40,-20 Z" fill="rgba(216,180,254,0.12)"/>
        </svg>
        <div class="container" style="position:relative; z-index:2;">
          <span class="badge" style="background:rgba(255,255,255,0.14); color:#fff; border-color:rgba(255,255,255,0.28);">
            40 Guided Engineering Courses · Parts A–M
          </span>
          <h1 class="mt-sm">Application-Based Learning</h1>
          <p style="max-width:720px;">
            Master practical robotics by building complete Input → Processing → Actuation → Feedback systems. Every project includes verified BOM specs, power safety rules, wiring diagrams, progressive .ino code, lab test logs, and exhibition prep.
          </p>
          <div class="flex flex-wrap gap-sm mt-md">
            <span class="badge" style="background:rgba(255,255,255,0.16); color:#fff; border-color:rgba(255,255,255,0.28);">
              ${sum.started} / 40 projects started
            </span>
            <span class="badge" style="background:rgba(255,255,255,0.16); color:#fff; border-color:rgba(255,255,255,0.28);">
              ${sum.totalChecksDone} / ${sum.totalChecksPossible} engineering checkpoints completed
            </span>
          </div>
        </div>
        <svg class="hero-wave-divider" viewBox="0 0 1440 64" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,26 C400,72 980,-16 1440,32 L1440,64 L0,64 Z" fill="var(--bg-divider-fill)"/>
        </svg>
      </section>

      <main class="page-body">
        <div class="container">
          <!-- Search & Multi-Facet Filter Bar -->
          <div class="card mb-lg">
            <div class="project-filter-grid">
              <div>
                <label class="text-xs text-muted" for="proj-search">Search 40 Projects</label>
                <input id="proj-search" type="search" class="form-input" placeholder="Search title, sensor, board, or keyword (e.g., earthquake, solar, ESP32)...">
              </div>
              <div>
                <label class="text-xs text-muted" for="proj-cat">Category</label>
                <select id="proj-cat" class="form-input">
                  ${categories.map((c) => `<option value="${c.key}">${esc(c.label)}</option>`).join('')}
                </select>
              </div>
              <div>
                <label class="text-xs text-muted" for="proj-diff">Difficulty</label>
                <select id="proj-diff" class="form-input">
                  ${difficulties.map((d) => `<option value="${d}">${d === 'all' ? 'All Difficulties' : esc(d)}</option>`).join('')}
                </select>
              </div>
              <div>
                <label class="text-xs text-muted" for="proj-board">Board Compatibility</label>
                <select id="proj-board" class="form-input">
                  ${boards.map((b) => `<option value="${b.key}">${esc(b.label)}</option>`).join('')}
                </select>
              </div>
              <div>
                <label class="text-xs text-muted" for="proj-award">Award Potential (Estimate)</label>
                <select id="proj-award" class="form-input">
                  ${awards.map((a) => `<option value="${a}">${a === 'all' ? 'All Estimates' : esc(a)}</option>`).join('')}
                </select>
              </div>
            </div>
            <div class="flex flex-wrap items-center justify-between gap-sm mt-sm">
              <span id="proj-count-label" class="text-sm text-muted">Showing 40 of 40 projects</span>
              <span class="text-xs text-muted">Note: Award-potential labels reflect initial exhibition relevance estimates from the source brief, not competition guarantees.</span>
            </div>
          </div>

          <div id="proj-cards-grid" class="grid grid-3"></div>
        </div>
      </main>
    `;

    const searchEl = document.getElementById('proj-search');
    const catEl = document.getElementById('proj-cat');
    const diffEl = document.getElementById('proj-diff');
    const boardEl = document.getElementById('proj-board');
    const awardEl = document.getElementById('proj-award');
    const gridEl = document.getElementById('proj-cards-grid');
    const countEl = document.getElementById('proj-count-label');

    function applyFilters() {
      const q = (searchEl.value || '').trim().toLowerCase();
      const cat = catEl.value;
      const diff = diffEl.value;
      const brd = boardEl.value;
      const awd = awardEl.value;

      const list = catalogue.projects.filter((p) => {
        if (cat !== 'all' && p.categoryKey !== cat) return false;
        if (diff !== 'all' && p.difficulty !== diff) return false;
        if (awd !== 'all' && p.awardPotential !== awd) return false;
        if (brd !== 'all' && !(p.compatibleBoardIds || []).includes(brd)) return false;
        if (q && !p.keywords.includes(q) && !String(p.num).includes(q)) return false;
        return true;
      });

      countEl.textContent = `Showing ${list.length} of ${catalogue.projects.length} projects`;

      if (!list.length) {
        gridEl.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><h3>No matching projects</h3><p>Try clearing one or more filters to browse all 40 robotics courses.</p></div>`;
        return;
      }

      gridEl.innerHTML = list.map((p) => {
        const done = (projectMap.get(p.id) || []).length;
        const total = p.checkpointCount || 11;
        const pct = Math.round((done / total) * 100);
        return `
          <article class="card card-hover project-cat-card flex" style="flex-direction:column; justify-content:space-between;">
            <div>
              <div class="project-card-thumb">
                <img src="${esc(p.cardImage.src)}" alt="${esc(p.cardImage.alt)}" loading="lazy">
                <span class="project-card-num">#${p.num}</span>
                <span class="project-card-board-pill">${esc(p.initialBoard)}</span>
              </div>
              <div class="flex flex-wrap gap-xs mb-xs">
                <span class="badge badge-bloom">${esc(p.area)}</span>
                <span class="badge">${esc(p.difficulty)}</span>
                <span class="badge badge-success" title="Initial exhibition potential estimate">Potential: ${esc(p.awardPotential)}</span>
              </div>
              <h3 style="margin-top:0.35rem;">${esc(p.title)}</h3>
              <p class="text-sm">${esc(p.brief)}</p>
            </div>
            <div>
              <div class="flex items-center justify-between text-xs text-muted mb-xs">
                <span>Board: <strong>${esc(p.recommendedBoardName.split(' (')[0])}</strong></span>
                <span>${done > 0 ? `${done}/${total} checkpoints (${pct}%)` : 'Not started'}</span>
              </div>
              <div class="progress-track sm mb-md">
                <div class="progress-fill" style="width:${pct}%"></div>
              </div>
              <a class="btn btn-primary btn-sm" style="width:100%; justify-content:center;" href="./projects.html?project=${encodeURIComponent(p.id)}">
                ${done > 0 ? 'Continue Project Course →' : 'Open Guided Course →'}
              </a>
            </div>
          </article>
        `;
      }).join('');
    }

    [searchEl, catEl, diffEl, boardEl, awardEl].forEach((el) => {
      el.addEventListener('input', applyFilters);
      el.addEventListener('change', applyFilters);
    });
    applyFilters();
  }

  /* ========================================================================
     INDIVIDUAL PROJECT GUIDED COURSE VIEW (Parts A through M)
     ======================================================================== */
  async function renderProjectCourse(projectId) {
    const root = document.getElementById('projects-app-root');
    const project = await loadFullProject(projectId);

    if (!project) {
      root.innerHTML = `
        <div class="container" style="padding:2rem 1.75rem;">
          <div class="callout callout-danger">
            <h3>Project not found</h3>
            <p>No project record matched ID <code>${esc(projectId)}</code>.</p>
            <a class="btn btn-primary btn-sm mt-sm" href="./projects.html">← Return to All 40 Projects</a>
          </div>
        </div>
      `;
      return;
    }

    const doneSet = new Set(projectMap.get(project.id) || []);
    const totalCp = project.checkpoints.length;
    const pct = Math.round((doneSet.size / totalCp) * 100);
    const prevProj = catalogue.projects.find((x) => x.num === project.num - 1);
    const nextProj = catalogue.projects.find((x) => x.num === project.num + 1);

    const partNav = [
      { id: 'part-a', code: 'A', label: 'Understand the Project', cp: 'intro' },
      { id: 'part-b', code: 'B', label: 'Bill of Materials', cp: 'components' },
      { id: 'part-c', code: 'C', label: 'Component Identification', cp: 'components' },
      { id: 'part-d', code: 'D', label: 'Circuit & Wiring', cp: 'circuit' },
      { id: 'part-e', code: 'E', label: 'Board Compatibility', cp: 'compatibility' },
      { id: 'part-f', code: 'F', label: 'Physical Assembly', cp: 'assembly' },
      { id: 'part-g', code: 'G', label: 'Programming Logic', cp: 'logic' },
      { id: 'part-h', code: 'H', label: 'Progressive Code', cp: 'code' },
      { id: 'part-i', code: 'I', label: 'Arduino IDE & Upload', cp: 'ide' },
      { id: 'part-j', code: 'J', label: 'Testing & Calibration', cp: 'testing' },
      { id: 'part-k', code: 'K', label: 'Troubleshooting', cp: 'troubleshooting' },
      { id: 'part-l', code: 'L', label: 'Improvement Challenges', cp: 'exhibition' },
      { id: 'part-m', code: 'M', label: 'Exhibition Pitch', cp: 'exhibition' }
    ];

    root.innerHTML = `
      <div class="learn-shell">
        <aside class="learn-sidebar" aria-label="Project Course Navigation">
          <a class="btn btn-secondary btn-sm mb-md" style="width:100%; justify-content:center;" href="./projects.html">← All 40 Projects</a>
          <div class="card mb-md" style="padding:0.9rem;">
            <div class="flex items-center justify-between gap-xs mb-xs">
              <strong class="text-sm">Project #${project.num}</strong>
              <span class="badge badge-bloom" id="proj-pct-badge">${pct}%</span>
            </div>
            <div class="progress-track sm mb-xs">
              <div class="progress-fill" id="proj-pct-fill" style="width:${pct}%"></div>
            </div>
            <div class="text-xs text-muted" id="proj-cp-count">${doneSet.size} / ${totalCp} checkpoints completed</div>
          </div>
          <ul class="sidebar-lesson-list" style="list-style:none; padding:0; margin:0; display:grid; gap:0.25rem;">
            ${partNav.map((n) => `
              <li>
                <a class="sidebar-lesson-link" href="#${n.id}">
                  <span class="lesson-state-icon" data-nav-cp="${n.cp}" data-nav-code="${n.code}">${doneSet.has(n.cp) ? '✓' : n.code}</span>
                  <span>${esc(n.label)}</span>
                </a>
              </li>
            `).join('')}
          </ul>
        </aside>

        <main class="learn-content">
          <article class="lesson-article">
            <div class="flex flex-wrap items-center gap-xs mb-sm">
              <span class="badge badge-bloom">Project #${project.num} of 40</span>
              <span class="badge">${esc(project.area)}</span>
              <span class="badge">${esc(project.difficulty)}</span>
              <span class="badge badge-success">Potential: ${esc(project.awardPotential)}</span>
              <span class="badge badge-warning">${esc(project.recommendedBoardName)}</span>
            </div>

            <h1>${esc(project.title)}</h1>
            <p style="font-size:1.06rem; color:var(--text-primary);">${esc(project.partA.introduction)}</p>

            <figure class="visual-figure visual-figure--compact">
              <div class="visual-figure-stage" style="aspect-ratio:4/3; max-width:520px; margin:0 auto;">
                <img src="${esc(project.cardImage.src)}" alt="${esc(project.cardImage.alt)}" style="object-fit:contain;">
                <span class="visual-figure-badge">Conceptual Prototype Visual</span>
              </div>
              <figcaption class="visual-figure-caption">
                <strong>${esc(project.title)}</strong>
                <span>${esc(project.cardImage.caption)}: Conceptual system representation (not a certified engineering datasheet).</span>
              </figcaption>
            </figure>

            <div class="callout callout-warning mb-md">
              <div class="callout-title">⚠ Safety &amp; Prototype Boundary</div>
              <p class="text-sm" style="margin:0;">${esc(project.partA.safetyDisclaimer)}</p>
            </div>

            ${project.partA.aiHonestyNote ? `
              <div class="callout callout-info mb-md">
                <div class="callout-title">Honest AI / Machine-Learning Scope</div>
                <p class="text-sm" style="margin:0;">${esc(project.partA.aiHonestyNote)}</p>
              </div>
            ` : ''}

            <!-- PART A -->
            <section class="lesson-section" id="part-a">
              <h2 class="lesson-section-title">PART A: Understand the Project</h2>
              ${project.partA.plainEnglishGuide ? `<div class="callout callout-success mb-md"><div class="callout-title">In Plain English: How This System Works</div><p class="text-sm" style="margin:0;">${esc(project.partA.plainEnglishGuide)}</p></div>` : ""}
              <div class="beginner-strip">
                <div class="beginner-rule-card"><strong>1. Unplug Before Wiring</strong><p>Always disconnect USB and batteries before moving any jumper wire.</p></div>
                <div class="beginner-rule-card"><strong>2. Match 3.3V vs 5V</strong><p>ESP32 pins are 3.3V only; use resistor dividers for 5V sensor outputs.</p></div>
                <div class="beginner-rule-card"><strong>3. Share Common GND</strong><p>Connect external motor/pump battery negative (-) to board GND.</p></div>
              </div>
              <div class="callout callout-info mb-md">
                <div class="callout-title">Learning Objectives</div>
                <ul style="margin:0.4rem 0 0 1.2rem; padding:0;">
                  ${project.partA.objectives.map((o) => `<li>${esc(o)}</li>`).join('')}
                </ul>
              </div>
              <p><strong>Practical Problem:</strong> ${esc(project.partA.realWorldProblem)}</p>
              <p><strong>Why It Matters:</strong> ${esc(project.partA.whyItMatters)}</p>
              <p><strong>How the Completed System Works:</strong> ${esc(project.partA.completedSystemBehavior)}</p>
              <p><strong>High-Level Architecture:</strong> ${esc(project.partA.highLevelWorking)}</p>
              <p><strong>Expected Final Result:</strong> ${esc(project.partA.expectedResult)}</p>
              <p><strong>Recommended Board Justification:</strong> ${esc(project.partA.recommendedBoardJustification)}</p>
              <p><strong>Prerequisites:</strong> ${project.partA.prerequisites.map((pr) => esc(pr)).join(' · ')}</p>
            </section>

            <!-- PART B -->
            <section class="lesson-section" id="part-b">
              <h2 class="lesson-section-title">PART B: Understand Every Component (Verified BOM)</h2>
              <div class="callout callout-warning mb-md">
                <div class="callout-title">Technical Validation &amp; Electrical Corrections Applied</div>
                <ul style="margin:0.4rem 0 0 1.2rem; padding:0;">
                  ${project.partB.technicalCorrections.map((c) => `<li class="text-sm">${esc(c)}</li>`).join('')}
                </ul>
              </div>
              <div class="table-wrap mb-md">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Component / Module</th>
                      <th>Qty</th>
                      <th>Voltage &amp; Logic</th>
                      <th>Interface &amp; Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${project.partB.bom.map((item) => `
                      <tr>
                        <td><strong>${esc(item.name)}</strong><div class="text-xs text-muted">${esc(item.category)}</div></td>
                        <td><code>${esc(item.qty)}</code></td>
                        <td class="text-xs">${esc(item.operatingVoltage)}<br><em>${esc(item.logicVoltage)}</em></td>
                        <td class="text-xs"><strong>${esc(item.protocol)}</strong>: ${esc(item.howItWorks)}<br><span style="color:var(--warning-color, #fbbf24);">Precaution: ${esc(item.precautions)}</span></td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </section>

            <!-- PART C -->
            <section class="lesson-section" id="part-c">
              <h2 class="lesson-section-title">PART C: Physical Component Identification</h2>
              <ul style="margin:0 0 1rem 1.2rem;">
                ${project.partC.identificationGuide.map((g) => `<li class="mb-xs">${esc(g)}</li>`).join('')}
              </ul>
              <p class="text-xs text-muted">Need the exact official photograph &amp; pinout of your microcontroller board? Open <a href="./boards.html?variant=${encodeURIComponent(project.recommendedBoardId)}">Boards → ${esc(project.recommendedBoardName)}</a>.</p>
            </section>

            <!-- PART D -->
            <section class="lesson-section" id="part-d">
              <h2 class="lesson-section-title">PART D: Understand &amp; Build the Circuit</h2>
              ${window.RoboDexProjectDiagrams ? window.RoboDexProjectDiagrams.renderCircuitWiringDiagram(project) : ''}
              <div class="table-wrap mb-md">
                <table class="data-table">
                  <thead>
                    <tr><th>Component</th><th>Module Pins</th><th>Board Pins</th><th>Voltage Domain &amp; Notes</th></tr>
                  </thead>
                  <tbody>
                    ${project.partD.wiringTable.map((w) => `
                      <tr>
                        <td><strong>${esc(w.component)}</strong></td>
                        <td><code>${esc(w.componentPin)}</code></td>
                        <td><code>${esc(w.boardPin)}</code></td>
                        <td class="text-xs"><strong>${esc(w.voltageDomain)}</strong>: ${esc(w.notes)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
              <div class="callout callout-info mb-md">
                <div class="callout-title">Power &amp; Common Ground Architecture</div>
                <ul class="text-sm" style="margin:0.35rem 0 0 1.2rem; padding:0;">
                  <li><strong>Logic Rail:</strong> ${esc(project.partD.powerArchitecture.logicRail)}</li>
                  <li><strong>Actuator Rail:</strong> ${esc(project.partD.powerArchitecture.actuatorRail)}</li>
                  <li><strong>Common Ground Rule:</strong> ${esc(project.partD.powerArchitecture.commonGroundRule)}</li>
                </ul>
              </div>
              <h3>Ordered Wiring Procedure</h3>
              <ol style="margin:0.4rem 0 1rem 1.25rem;">
                ${project.partD.connectionSteps.map((s) => `<li class="mb-xs">${esc(s)}</li>`).join('')}
              </ol>
              <div class="callout callout-warning">
                <div class="callout-title">Mandatory Pre-Power Verification Checklist</div>
                <ul class="text-sm" style="margin:0.35rem 0 0 1.2rem; padding:0;">
                  ${project.partD.prePowerChecklist.map((c) => `<li>${esc(c)}</li>`).join('')}
                </ul>
              </div>
            </section>

            <!-- PART E -->
            <section class="lesson-section" id="part-e">
              <h2 class="lesson-section-title">PART E: Board Compatibility</h2>
              <p><strong>Primary Recommended Board:</strong> <a href="./boards.html?variant=${encodeURIComponent(project.recommendedBoardId)}">${esc(project.recommendedBoardName)} →</a></p>
              <div class="grid grid-2 mt-sm">
                ${project.partE.alternatives.map((a) => `
                  <div class="card" style="padding:1rem;">
                    <div class="flex items-center justify-between gap-xs mb-xs">
                      <strong>${esc(a.name)}</strong>
                      <a class="text-xs" href="./boards.html?variant=${encodeURIComponent(a.boardId)}">Open Board Course →</a>
                    </div>
                    <ul class="text-xs" style="margin:0.3rem 0 0 1.1rem; padding:0; display:grid; gap:0.25rem;">
                      <li><strong>Pin Changes:</strong> ${esc(a.pinChanges)}</li>
                      <li><strong>Voltage/Power:</strong> ${esc(a.voltageDiff)}</li>
                      <li><strong>Libraries/Code:</strong> ${esc(a.libraryChanges)}</li>
                      <li><strong>Trade-offs:</strong> ${esc(a.tradeoffs)}</li>
                    </ul>
                  </div>
                `).join('')}
              </div>
            </section>

            <!-- PART F -->
            <section class="lesson-section" id="part-f">
              <h2 class="lesson-section-title">PART F: Physical Construction &amp; Assembly</h2>
              ${window.RoboDexProjectDiagrams ? window.RoboDexProjectDiagrams.renderAssemblyLayoutDiagram(project) : ''}
              <ol style="margin:0.4rem 0 1rem 1.25rem;">
                ${project.partF.assemblySteps.map((s) => `<li class="mb-xs">${esc(s)}</li>`).join('')}
              </ol>
            </section>

            <!-- PART G -->
            <section class="lesson-section" id="part-g">
              <h2 class="lesson-section-title">PART G: Understand the Programming Logic</h2>
              ${window.RoboDexProjectDiagrams ? window.RoboDexProjectDiagrams.renderIpoFlowDiagram(project) : ''}
              <h3>Algorithm</h3>
              <ol style="margin:0.4rem 0 1rem 1.25rem;">
                ${project.partG.algorithm.map((a) => `<li class="mb-xs">${esc(a.replace(/^\d+\.\s*/, ''))}</li>`).join('')}
              </ol>
              <h3>Structured Pseudocode</h3>
              <div class="code-block mb-md"><pre><code>${esc(project.partG.pseudocode)}</code></pre></div>
              <h3>Why Each Programming Concept Is Needed</h3>
              <div class="grid grid-2 mb-md">
                ${project.partG.conceptsWhy.map((c) => `
                  <div class="card" style="padding:0.9rem;">
                    <strong class="text-sm">${esc(c.concept)}</strong>
                    <p class="text-xs text-muted" style="margin:0.35rem 0 0;">${esc(c.why)}</p>
                  </div>
                `).join('')}
              </div>
              <div class="callout callout-info">
                <div class="callout-title">Connected Programming School &amp; Boards Lessons</div>
                <div class="flex flex-wrap gap-xs mt-xs">
                  ${project.partG.programmingLinks.map((l) => `<a class="btn btn-secondary btn-sm" href="./learn.html?lesson=${encodeURIComponent(l.lessonId)}">${esc(l.title)}</a>`).join('')}
                  ${project.partG.boardLinks.map((b) => `<a class="btn btn-ghost btn-sm" href="./boards.html?variant=${encodeURIComponent(b.variantId)}&lesson=${encodeURIComponent(b.lessonId)}">${esc(b.title)}</a>`).join('')}
                </div>
              </div>
            </section>

            <!-- PART H -->
            <section class="lesson-section" id="part-h">
              <h2 class="lesson-section-title">PART H: Progressive Code Development</h2>
              <p>Build and test your firmware one stage at a time. Edit, reset, copy, or download any stage as an Arduino <code>.ino</code> file.</p>
              ${project.partH.stages.map((st) => `
                <div class="card mb-md" style="padding:1rem;">
                  <h3>${esc(st.title)}</h3>
                  <p class="text-sm text-muted">${esc(st.goal)}</p>
                  <div id="proj-stage-editor-${st.stageNum}" class="mb-sm"></div>
                  <ul class="text-xs" style="margin:0.4rem 0 0 1.2rem;">
                    ${st.explanation.map((ex) => `<li>${esc(ex)}</li>`).join('')}
                  </ul>
                </div>
              `).join('')}

              <h3>Common Coding &amp; Debugging Mistakes</h3>
              <ul class="text-sm mb-md" style="margin:0.35rem 0 1rem 1.2rem;">
                ${project.partH.commonMistakes.map((m) => `<li>${esc(m)}</li>`).join('')}
              </ul>

              <h3>Interactive Engineering Checkpoints</h3>
              <div id="proj-exercises-host" class="mb-md"></div>

              <details class="card" style="padding:1rem;">
                <summary style="cursor:pointer; font-weight:700;">Final Reference Program (Open Only After Testing Stages 1–3) ▾</summary>
                <p class="text-xs text-muted mt-xs">${esc(project.partH.referenceProgram.note)}</p>
                <div id="proj-ref-editor" class="mt-sm"></div>
              </details>
            </section>

            <!-- PART I -->
            <section class="lesson-section" id="part-i">
              <h2 class="lesson-section-title">PART I: Arduino IDE Setup, Compilation &amp; Uploading</h2>
              <div class="callout callout-info mb-md">
                <div class="callout-title">Browser Editor Scope</div>
                <p class="text-sm" style="margin:0;">${esc(project.partI.honestEditorNote)}</p>
              </div>
              <ul class="text-sm mb-sm" style="margin:0 0 0.85rem 1.2rem;">
                <li><strong>Board Package:</strong> ${esc(project.partI.boardPackage)}</li>
                <li><strong>Board Selection:</strong> <code>${esc(project.partI.boardSelection)}</code></li>
                <li><strong>Required Libraries:</strong> ${project.partI.requiredLibraries.map((l) => `<code>${esc(l)}</code>`).join(', ')}</li>
                <li><strong>Serial Monitor Baud Rate:</strong> <code>${project.partI.baudRate}</code></li>
              </ul>
              <ol style="margin:0.4rem 0 1rem 1.25rem;">
                ${project.partI.uploadSteps.map((s) => `<li class="mb-xs">${esc(s)}</li>`).join('')}
              </ol>
            </section>

            <!-- PART J -->
            <section class="lesson-section" id="part-j">
              <h2 class="lesson-section-title">PART J: Testing, Calibration &amp; Verification</h2>
              <p><strong>Expected Behavior:</strong> ${esc(project.partJ.expectedBehavior)}</p>
              <ul class="text-sm mb-md" style="margin:0.35rem 0 1rem 1.2rem;">
                <li><strong>Sensor Test:</strong> ${esc(project.partJ.sensorTest)}</li>
                <li><strong>Output Test:</strong> ${esc(project.partJ.outputTest)}</li>
                <li><strong>Integrated Test:</strong> ${esc(project.partJ.integratedTest)}</li>
              </ul>
              ${project.partJ.exampleSerialOutput ? `<h3>What Working Output Looks Like (Example Serial Monitor)</h3><pre class="serial-preview-box">${esc(project.partJ.exampleSerialOutput)}</pre>` : ""}
              <h3>Calibration Procedure</h3>
              <ol class="text-sm mb-md" style="margin:0.35rem 0 1rem 1.25rem;">
                ${project.partJ.calibrationSteps.map((c) => `<li>${esc(c)}</li>`).join('')}
              </ol>
              <div class="callout callout-warning mb-sm">
                <div class="callout-title">Measurement Log Template</div>
                <p class="text-xs" style="margin:0;">${esc(project.partJ.sampleTestTable.disclaimer)}</p>
              </div>
              <div class="table-wrap">
                <table class="data-table">
                  <thead><tr>${project.partJ.sampleTestTable.columns.map((col) => `<th>${esc(col)}</th>`).join('')}</tr></thead>
                  <tbody>
                    ${project.partJ.sampleTestTable.sampleRows.map((row) => `<tr>${row.map((cell) => `<td class="text-xs">${esc(cell)}</td>`).join('')}</tr>`).join('')}
                  </tbody>
                </table>
              </div>
            </section>

            <!-- PART K -->
            <section class="lesson-section" id="part-k">
              <h2 class="lesson-section-title">PART K: Project-Specific Troubleshooting</h2>
              <div class="grid">
                ${project.partK.map((t) => `
                  <div class="callout callout-warning" style="margin:0;">
                    <div class="callout-title">${esc(t.category)}: ${esc(t.symptom)}</div>
                    <p class="text-xs" style="margin:0.25rem 0;"><strong>Diagnosis:</strong> ${esc(t.diagnosis)}</p>
                    <p class="text-xs" style="margin:0;"><strong>Fix:</strong> ${esc(t.fix)}</p>
                  </div>
                `).join('')}
              </div>
            </section>

            <!-- PART L -->
            <section class="lesson-section" id="part-l">
              <h2 class="lesson-section-title">PART L: Improvements &amp; Independent Challenges</h2>
              <div class="grid grid-2">
                ${project.partL.map((ch) => `
                  <div class="card" style="padding:1rem;">
                    <span class="badge badge-bloom mb-xs">${esc(ch.level)}</span>
                    <h3>${esc(ch.title)}</h3>
                    <p class="text-sm" style="margin:0;">${esc(ch.task)}</p>
                  </div>
                `).join('')}
              </div>
            </section>

            <!-- PART M -->
            <section class="lesson-section" id="part-m">
              <h2 class="lesson-section-title">PART M: Exhibition &amp; Engineering Presentation</h2>
              <p><strong>Local Problem Story:</strong> ${esc(project.partM.localProblemStory)}</p>
              <p><strong>Complete System Loop Demo:</strong> ${esc(project.partM.completeLoopDemo)}</p>
              <p><strong>Measured Data Talking Points:</strong> ${esc(project.partM.measurementTalkingPoints)}</p>
              <h3>2-Minute Engineering Pitch Structure</h3>
              <ol class="text-sm mb-md" style="margin:0.35rem 0 1rem 1.25rem;">
                ${project.partM.twoMinutePitch.map((step) => `<li>${esc(step)}</li>`).join('')}
              </ol>
              <p class="text-xs text-muted">${esc(project.partM.awardDisclaimer)}</p>
            </section>

            <!-- 11-Checkpoint Local Progress Tracker -->
            <section class="checkpoint-box mt-lg" id="project-progress-box">
              <h3>Your Engineering Progress Checkpoints</h3>
              <p class="text-sm text-muted mb-md">Check off each stage as you genuinely complete and verify it on your workbench. Saved independently to your local student profile.</p>
              <div class="grid grid-2" id="proj-checkpoints-list">
                ${project.checkpoints.map((cp) => `
                  <label class="exercise-option" style="cursor:pointer;">
                    <input type="checkbox" data-cp-id="${esc(cp.id)}" ${doneSet.has(cp.id) ? 'checked' : ''}>
                    <span class="text-sm">${esc(cp.label)}</span>
                  </label>
                `).join('')}
              </div>
            </section>

            <nav class="lesson-nav-bar mt-lg" aria-label="Project Pagination">
              <div>
                ${prevProj ? `<a class="btn btn-secondary" href="./projects.html?project=${encodeURIComponent(prevProj.id)}">← #${prevProj.num}: ${esc(prevProj.title.slice(0, 32))}…</a>` : '<a class="btn btn-secondary" href="./projects.html">← All 40 Projects</a>'}
              </div>
              <div>
                ${nextProj ? `<a class="btn btn-primary" href="./projects.html?project=${encodeURIComponent(nextProj.id)}">#${nextProj.num}: ${esc(nextProj.title.slice(0, 32))}… →</a>` : '<a class="btn btn-primary" href="./projects.html">All 40 Projects →</a>'}
              </div>
            </nav>
          </article>
        </main>
      </div>
    `;

    // Mount editable progressive code editors
    if (window.RoboDexEditor) {
      project.partH.stages.forEach((st) => {
        const host = document.getElementById(`proj-stage-editor-${st.stageNum}`);
        if (host) {
          window.RoboDexEditor.mount(host, {
            starterCode: st.code,
            filename: `robodex_proj_${String(project.num).padStart(2, '0')}_stage${st.stageNum}.ino`,
            title: st.title,
            instructions: st.goal
          });
        }
      });
      const refHost = document.getElementById('proj-ref-editor');
      if (refHost) {
        window.RoboDexEditor.mount(refHost, {
          starterCode: project.partH.referenceProgram.code,
          filename: project.partH.referenceProgram.filename,
          title: project.partH.referenceProgram.title,
          instructions: project.partH.referenceProgram.note
        });
      }
    }

    // Mount interactive Part H exercises
    const exHost = document.getElementById('proj-exercises-host');
    if (exHost && project.partH.exercises) {
      exHost.innerHTML = project.partH.exercises.map((ex, i) => `
        <div class="card mb-sm" data-pex="${i}" style="padding:1rem;">
          <p class="text-sm"><strong>Check ${i + 1}:</strong> ${esc(ex.prompt)}</p>
          <div class="exercise-options">
            ${ex.options.map((opt, oi) => `
              <label class="exercise-option">
                <input type="radio" name="pex_${i}" value="${oi}">
                <span class="text-sm">${esc(opt)}</span>
              </label>
            `).join('')}
          </div>
          <button type="button" class="btn btn-secondary btn-sm mt-xs" data-check-pex="${i}">Check Answer</button>
          <div class="exercise-feedback" data-pex-fb="${i}"></div>
        </div>
      `).join('');

      exHost.querySelectorAll('[data-check-pex]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const i = Number(btn.dataset.checkPex);
          const ex = project.partH.exercises[i];
          const picked = exHost.querySelector(`input[name="pex_${i}"]:checked`);
          const fb = exHost.querySelector(`[data-pex-fb="${i}"]`);
          if (!picked) {
            fb.className = 'exercise-feedback show incorrect';
            fb.textContent = 'Select an option before checking.';
            return;
          }
          const ok = Number(picked.value) === ex.correctIndex;
          fb.className = `exercise-feedback show ${ok ? 'correct' : 'incorrect'}`;
          fb.innerHTML = `<strong>${ok ? '✓ Correct' : '✗ Review this rule'}</strong>: ${esc(ex.explanation)}`;
        });
      });
    }

    // Bind 11 checkpoint toggles -> IndexedDB persistence
    const cpBox = document.getElementById('proj-checkpoints-list');
    if (cpBox) {
      cpBox.querySelectorAll('input[type="checkbox"][data-cp-id]').forEach((cb) => {
        cb.addEventListener('change', async () => {
          const completed = Array.from(cpBox.querySelectorAll('input[type="checkbox"]:checked')).map((el) => el.dataset.cpId);
          await window.RoboDexDB.saveProjectProgress(profile.id, project.id, completed);
          await refreshSnapshot();
          const newPct = Math.round((completed.length / totalCp) * 100);
          const badge = document.getElementById('proj-pct-badge');
          const fill = document.getElementById('proj-pct-fill');
          const cnt = document.getElementById('proj-cp-count');
          if (badge) badge.textContent = `${newPct}%`;
          if (fill) fill.style.width = `${newPct}%`;
          if (cnt) cnt.textContent = `${completed.length} / ${totalCp} checkpoints completed`;
          const setNow = new Set(completed);
          document.querySelectorAll('[data-nav-cp]').forEach((icon) => {
            const key = icon.dataset.navCp;
            icon.textContent = setNow.has(key) ? '✓' : (icon.dataset.navCode || '');
          });
          window.RoboDexApp.showToast(`Project #${project.num} progress saved (${completed.length}/${totalCp})`);
        });
      });
    }

    // Bind click-to-zoom lightbox on technical SVGs
    if (window.RoboDexProjectDiagrams) {
      window.RoboDexProjectDiagrams.bindLightbox();
    }
  }

  async function init() {
    profile = await window.RoboDexApp.requireActiveProfile();
    if (!profile) return;

    catalogue = await window.RoboDexApp.loadJSON('./data/projects-catalogue.json');
    await refreshSnapshot();

    const pid = getProjectParam();
    if (pid) {
      await renderProjectCourse(pid);
    } else {
      renderCatalogue();
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    init().catch((err) => {
      const root = document.getElementById('projects-app-root');
      if (root) root.innerHTML = `<div class="container" style="padding:2rem;"><div class="callout callout-danger">Could not load Application-Based Learning: ${esc(err.message)}</div></div>`;
    });
  });
})();
