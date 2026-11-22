/* ==========================================================================
   RoboDex́ — Shared Application Shell, Navigation, Syntax Highlight & Helpers
   ========================================================================== */

window.RoboDexApp = (function () {
  const jsonCache = new Map();

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function highlightCpp(code) {
    const src = String(code ?? '');
    const tokens = [];
    let out = escapeHtml(src);

    // Protect comments & strings first with placeholders
    out = out.replace(/(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/g, (m) => {
      tokens.push(`<span class="tok-com">${m}</span>`);
      return `@@TOK${tokens.length - 1}@@`;
    });
    out = out.replace(/(&quot;(?:\\.|[^&]|&(?!quot;))*?&quot;|&#39;(?:\\.|[^&]|&(?!#39;))*?&#39;)/g, (m) => {
      tokens.push(`<span class="tok-str">${m}</span>`);
      return `@@TOK${tokens.length - 1}@@`;
    });
    out = out.replace(/(^|\n)(#\s*[a-zA-Z_]+[^\n]*)/g, (_, p1, p2) => {
      tokens.push(`<span class="tok-pre">${p2}</span>`);
      return `${p1}@@TOK${tokens.length - 1}@@`;
    });

    // Keywords
    out = out.replace(/\b(if|else|for|while|do|switch|case|default|break|continue|return|const|struct|enum|class|public|private|new|delete|true|false|nullptr)\b/g, '<span class="tok-kw">$1</span>');
    // Types & Arduino constants
    out = out.replace(/\b(void|int|long|unsigned|float|double|bool|char|byte|String|size_t|uint8_t|uint16_t|uint32_t|HIGH|LOW|INPUT|OUTPUT|INPUT_PULLUP|LED_BUILTIN)\b/g, '<span class="tok-type">$1</span>');
    // Common Arduino/C++ functions
    out = out.replace(/\b(setup|loop|pinMode|digitalWrite|digitalRead|analogRead|analogWrite|delay|delayMicroseconds|millis|micros|map|constrain|tone|noTone|pulseIn|Serial|begin|print|println|available|read|attach|write)\b/g, '<span class="tok-fn">$1</span>');
    // Numbers
    out = out.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="tok-num">$1</span>');

    // Restore placeholders
    out = out.replace(/@@TOK(\d+)@@/g, (_, idx) => tokens[Number(idx)]);
    return out;
  }

  async function loadJSON(relativePath) {
    if (jsonCache.has(relativePath)) return jsonCache.get(relativePath);
    const res = await fetch(relativePath);
    if (!res.ok) {
      throw new Error(`Could not load data file: ${relativePath} (HTTP ${res.status})`);
    }
    const data = await res.json();
    jsonCache.set(relativePath, data);
    return data;
  }

  function showToast(message) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 200ms ease';
      setTimeout(() => toast.remove(), 220);
    }, 3000);
  }

  function downloadFile(filename, content, mimeType = 'text/plain;charset=utf-8') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function formatDate(ts) {
    if (!ts) return '—';
    try {
      return new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return '—';
    }
  }

  async function renderShell() {
    window.RoboDexPrefs.applyVisualPrefs();
    const page = document.body.getAttribute('data-page') || '';
    let profile = null;
    try {
      profile = await window.RoboDexDB.getActiveProfile();
    } catch {
      profile = null;
    }

    const navItems = [
      { id: 'home', label: 'Home', href: './index.html' },
      { id: 'learn', label: 'Learn', href: './learn.html' },
      { id: 'academy', label: 'Explore Academy', href: './academy.html' },
      { id: 'boards', label: 'Boards', href: './boards.html' },
      { id: 'projects', label: 'Projects', href: './projects.html' },
      { id: 'dashboard', label: 'Dashboard', href: './dashboard.html' },
      { id: 'my-data', label: 'My Data', href: './my-data.html' }
    ];

    const headerEl = document.getElementById('site-header');
    if (headerEl) {
      const initials = profile
        ? profile.displayName.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()
        : 'ST';
      const profileName = profile ? escapeHtml(profile.displayName) : 'Local Profile';
      const theme = window.RoboDexPrefs.get('theme');

      headerEl.innerHTML = `
        <header class="topbar">
          <div class="topbar-inner">
            <a class="brand-link" href="./index.html" aria-label="RoboDex́ Home">
              <img src="./assets/img/logo.svg" alt="RoboDex́ logo">
              <span>Robo<span class="brand-accent">Dex&#x0301;</span></span>
            </a>
            <nav aria-label="Primary Navigation">
              <ul class="nav-links">
                ${navItems.map((item) => `
                  <li><a href="${item.href}" class="${page === item.id ? 'active' : ''}">${item.label}</a></li>
                `).join('')}
              </ul>
            </nav>
            <div class="topbar-actions">
              <button type="button" id="theme-toggle-btn" class="icon-btn" title="Toggle light or dark reading theme" aria-label="Toggle reading theme">
                <span>${theme === 'dark' ? '☀️ Light' : '🌙 Dark'}</span>
              </button>
              <a href="./profiles.html" class="profile-pill" title="Manage local student profiles">
                <span class="profile-avatar">${escapeHtml(initials)}</span>
                <span>${profileName}</span>
              </a>
              <button type="button" id="mobile-menu-toggle" class="icon-btn mobile-menu-btn" aria-label="Open menu">☰ Menu</button>
            </div>
          </div>
        </header>
        <div id="mobile-nav-drawer" class="mobile-nav-drawer" aria-label="Mobile Navigation">
          ${navItems.map((item) => `
            <a href="${item.href}" class="${page === item.id ? 'active' : ''}">${item.label}</a>
          `).join('')}
          <a href="./profiles.html" class="${page === 'profiles' ? 'active' : ''}">Student Profiles</a>
        </div>
      `;

      const themeBtn = document.getElementById('theme-toggle-btn');
      if (themeBtn) {
        themeBtn.addEventListener('click', () => {
          const next = window.RoboDexPrefs.toggleTheme();
          themeBtn.innerHTML = `<span>${next === 'dark' ? '☀️ Light' : '🌙 Dark'}</span>`;
          window.dispatchEvent(new CustomEvent('robodex:theme-changed', { detail: { theme: next } }));
        });
      }

      const menuBtn = document.getElementById('mobile-menu-toggle');
      const drawer = document.getElementById('mobile-nav-drawer');
      if (menuBtn && drawer) {
        menuBtn.addEventListener('click', () => drawer.classList.toggle('open'));
      }
    }

    const footerEl = document.getElementById('site-footer');
    if (footerEl) {
      footerEl.innerHTML = `
        <footer class="site-footer">
          <div class="container footer-inner">
            <div>
              <strong style="color:#fff;">RoboDex&#x0301; v1.0</strong> — Independent C++ &amp; Arduino Robotics Academy.
              <span style="display:block; margin-top:0.2rem;">100% static, offline-friendly, local IndexedDB storage. No accounts, no tracking, no fake compiler.</span>
            </div>
            <div class="footer-links">
              <a href="./learn.html">Curriculum</a>
              <a href="./boards.html">Boards</a>
              <a href="./projects.html">Projects</a>
              <a href="./profiles.html">Profiles</a>
              <a href="./my-data.html">Backup &amp; Data</a>
            </div>
          </div>
        </footer>
      `;
    }

    // Register service worker on http/https (works cleanly on GitHub Pages subpaths)
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
      navigator.serviceWorker.register('./service-worker.js').catch(() => {});
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderShell();
  });

  return {
    escapeHtml,
    highlightCpp,
    loadJSON,
    showToast,
    downloadFile,
    formatDate,
    renderShell
  };
})();
