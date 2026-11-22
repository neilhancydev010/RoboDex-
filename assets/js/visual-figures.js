/* RoboDex́ — Conceptual Visual Learning Figures Module
 * Renders bundled local conceptual illustrations for visual learning across
 * Programming School, Boards Learning Environment, Dashboard, and Stage 3 Preview.
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
    return (!isNaN(num) && num >= 9) ? 'embedded-io' : 'programming';
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
    getFigureHtml,
    getTrackThumbHtml,
    mountFigure
  };
})();
