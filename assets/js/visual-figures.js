/* RoboDex́ — Conceptual Visual Learning Figures Module
 * Renders bundled local conceptual illustrations for visual learning across
 * Programming School, Boards Learning Environment (all steps A-H), Dashboard,
 * and the Stage 3 Application-Based Learning preview.
 * Always labeled explicitly as Conceptual Visual Learning Figures (distinct from
 * real manufacturer hardware photographs).
 */
(function () {
  'use strict';

  const FIGURES = {
    programming: {
      src: './assets/img/visuals/visual-programming.jpg',
      title: 'Algorithmic Logic & Structured Code Flow',
      alt: 'Conceptual 3D visual learning figure illustrating structured C++ logic flow, variables, loops, and branching pathways',
      caption: 'Conceptual visual model of variables, control flow, and modular functions transforming inputs into deterministic outputs.'
    },
    'embedded-io': {
      src: './assets/img/visuals/visual-embedded-io.jpg',
      title: 'Embedded Microcontroller I/O & Sensor-Actuator Loop',
      alt: 'Conceptual 3D visual learning figure illustrating microcontroller signal flow between ultrasonic sensors, PWM motor coils, and LED outputs',
      caption: 'Conceptual visual model of how microcontroller code reads sensor signals and drives PWM actuators and indicator outputs.'
    },
    'boards-architecture': {
      src: './assets/img/visuals/visual-boards-architecture.jpg',
      title: 'Board Voltage Domains, Data Buses & Wireless Architecture',
      alt: 'Conceptual 3D visual learning figure illustrating layered microcontroller power rails, clock signals, serial buses, and wireless wave rings',
      caption: 'Conceptual visual model of 5V/3.3V power rails, clock timing, SPI/I2C/UART buses, and onboard RF subsystems.'
    },
    'power-safety': {
      src: './assets/img/visuals/visual-power-safety.jpg',
      title: 'Voltage Regulation, Logic Levels & Circuit Protection',
      alt: 'Conceptual 3D visual learning figure illustrating 5V and 3.3V power rails passing through a voltage regulator, logic level shifter, and current-limiting resistors',
      caption: 'Conceptual visual model of safe voltage regulation, 5V-to-3.3V logic level shifting, and current-limiting pin protection.'
    },
    'ide-upload': {
      src: './assets/img/visuals/visual-ide-upload.jpg',
      title: 'Compilation Pipeline, USB Flashing & Bootloader Flow',
      alt: 'Conceptual 3D visual learning figure illustrating compiled code blocks streaming through a USB-C conduit into an illuminated microcontroller bootloader',
      caption: 'Conceptual visual model of compiling C++ sketches into machine code and flashing firmware over USB serial to the board.'
    },
    diagnostics: {
      src: './assets/img/visuals/visual-diagnostics.jpg',
      title: 'Signal Diagnostics, Waveform Probing & Hardware Debugging',
      alt: 'Conceptual 3D visual learning figure illustrating oscilloscope sine and square waveforms above a microcontroller testbench with diagnostic probe beams',
      caption: 'Conceptual visual model of inspecting voltage rails, PWM waveforms, and serial output to isolate hardware and code bugs.'
    },
    'robotics-applied': {
      src: './assets/img/visuals/visual-robotics-applied.jpg',
      title: 'Applied Robotics Systems & Multi-Sensor Integration (Stage 3 Preview)',
      alt: 'Conceptual 3D visual learning figure illustrating an autonomous wheeled rover, articulated robotic arm, and sensor telemetry on an engineering workbench',
      caption: 'Conceptual preview of Stage 3 Application-Based Learning: integrating C++ logic, board hardware, sensors, and actuators into real robotic systems.'
    }
  };

  function esc(str) {
    if (window.RoboDexApp && typeof window.RoboDexApp.escapeHtml === 'function') {
      return window.RoboDexApp.escapeHtml(str);
    }
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function resolveProgrammingKey(moduleId) {
    if (!moduleId) return 'programming';
    const num = parseInt(String(moduleId).replace(/\D+/g, ''), 10);
    if (isNaN(num)) return 'programming';
    if (num === 9) return 'ide-upload';
    if (num === 10) return 'embedded-io';
    if (num === 11) return 'boards-architecture';
    if (num >= 12) return 'robotics-applied';
    return 'programming';
  }

  function resolveProgrammingAppKey(moduleId) {
    if (!moduleId) return 'embedded-io';
    const num = parseInt(String(moduleId).replace(/\D+/g, ''), 10);
    if (isNaN(num)) return 'embedded-io';
    if (num >= 11) return 'diagnostics';
    if (num >= 9) return 'power-safety';
    return 'embedded-io';
  }

  function resolveBoardSectionKey(sectionCode) {
    const code = String(sectionCode || 'A').toUpperCase();
    switch (code) {
      case 'A': return 'boards-architecture';
      case 'B': return 'boards-architecture';
      case 'C': return 'power-safety';
      case 'D': return 'boards-architecture';
      case 'E': return 'ide-upload';
      case 'F': return 'embedded-io';
      case 'G': return 'programming';
      case 'H': return 'diagnostics';
      default: return 'boards-architecture';
    }
  }

  function getFigure(key) {
    return FIGURES[key] || FIGURES.programming;
  }

  function getFigureHtml(key, options) {
    const opts = options || {};
    const fig = getFigure(key);
    const title = opts.title || fig.title;
    const caption = opts.caption || fig.caption;
    const badge = opts.badge || 'Conceptual Visual Learning Figure';
    const compactClass = opts.compact ? ' visual-figure--compact' : '';

    return `
      <figure class="visual-figure${compactClass}" data-visual-key="${esc(key)}">
        <div class="visual-figure-stage">
          <img src="${esc(fig.src)}" alt="${esc(opts.alt || fig.alt)}" loading="lazy"
               onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
          <div class="visual-figure-fallback" style="display:none;">
            <span>${esc(title)}</span>
          </div>
          <span class="visual-figure-badge">${esc(badge)}</span>
        </div>
        <figcaption class="visual-figure-caption">
          <strong>${esc(title)}</strong>
          <span>${esc(caption)}</span>
        </figcaption>
      </figure>
    `;
  }

  function getTrackThumbHtml(key, label) {
    const fig = getFigure(key);
    return `
      <div class="visual-track-thumb" data-visual-key="${esc(key)}">
        <img src="${esc(fig.src)}" alt="${esc(fig.alt)}" loading="lazy">
        <span class="visual-track-tag">${esc(label || 'Visual Figure')}</span>
      </div>
    `;
  }

  function getBoardCardPhotoHtml(photoUrl, altText, fallbackKey, tagLabel, heightPx) {
    const fig = getFigure(fallbackKey || 'boards-architecture');
    const styleAttr = heightPx ? ` style="height:${Number(heightPx)}px;"` : '';
    return `
      <div class="board-card-thumb"${styleAttr}>
        <img src="${esc(photoUrl)}" alt="${esc(altText)}" loading="lazy"
             onerror="if(!this.dataset.fb){this.dataset.fb='1';this.src='${esc(fig.src)}';this.classList.add('is-conceptual-fallback');}">
        ${tagLabel ? `<span class="board-card-tag">${esc(tagLabel)}</span>` : ''}
      </div>
    `;
  }

  function getBoardHeroPhotoHtml(photoUrl, altText, captionLeft, sourceUrl, credit, fallbackKey, compact) {
    const fig = getFigure(fallbackKey || 'boards-architecture');
    const stageStyle = compact ? ' style="min-height:170px; max-height:220px;"' : '';
    return `
      <figure class="board-photo-figure">
        <div class="board-photo-stage"${stageStyle}>
          <img src="${esc(photoUrl)}" alt="${esc(altText)}" loading="lazy"
               onerror="if(!this.dataset.fb){this.dataset.fb='1';this.src='${esc(fig.src)}';this.classList.add('is-conceptual-fallback');}">
        </div>
        <figcaption class="board-photo-caption">
          <span>${captionLeft}</span>
          ${sourceUrl ? `<a href="${esc(sourceUrl)}" target="_blank" rel="noopener noreferrer">${esc(credit || 'Official Hardware Source')} ↗</a>` : ''}
        </figcaption>
      </figure>
    `;
  }

  function mountFigure(target, key, options) {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return false;
    el.innerHTML = getFigureHtml(key, options);
    return true;
  }

  window.RoboDexVisuals = {
    FIGURES,
    getFigure,
    resolveProgrammingKey,
    resolveProgrammingAppKey,
    resolveBoardSectionKey,
    getFigureHtml,
    getTrackThumbHtml,
    getBoardCardPhotoHtml,
    getBoardHeroPhotoHtml,
    mountFigure
  };
})();
