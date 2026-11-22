/* ==========================================================================
   RoboDex́: Shared Hyper-Bloom Application Shell
   - Text-only wordmark: RoboDex́ | Train Yourself (zero graphical logos)
   - Persistent 6-destination left sidebar + compact top utility bar
   - Organic Hyper-Bloom SVG background curves
   - Exact 3-line footer on every page
   - Session-scoped profile enforcement
   ========================================================================== */

window.RoboDexApp = (function () {
  const jsonCache = new Map();

  const PRIMARY_NAV = [
    { id: 'dashboard', label: 'Dashboard', icon: '◈', href: './dashboard.html' },
    { id: 'learn', label: 'Programming School', icon: '⌘', href: './learn.html' },
    { id: 'boards', label: 'Boards', icon: '⊞', href: './boards.html' },
    { id: 'projects', label: 'Application-Based Learning', icon: '❖', href: './projects.html' },
    { id: 'my-information', label: 'My Information', icon: '◎', href: './my-information.html' },
    { id: 'about', label: 'About', icon: 'ⓘ', href: './about.html' }
  ];

  const PAGE_TITLES = {
    'dashboard': 'Student Dashboard',
    'learn': 'Programming School',
    'boards': 'Boards: Hardware Architecture',
    'projects': 'Application-Based Learning',
    'my-information': 'My Information & Local Data',
    'about': 'About RoboDex́',
    '404': 'Page Not Found'
  };

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

    out = out.replace(/\b(if|else|for|while|do|switch|case|default|break|continue|return|const|struct|enum|class|public|private|new|delete|true|false|nullptr)\b/g, '<span class="tok-kw">$1</span>');
    out = out.replace(/\b(void|int|long|unsigned|float|double|bool|char|byte|String|size_t|uint8_t|uint16_t|uint32_t|HIGH|LOW|INPUT|OUTPUT|INPUT_PULLUP|LED_BUILTIN)\b/g, '<span class="tok-type">$1</span>');
    out = out.replace(/\b(setup|loop|pinMode|digitalWrite|digitalRead|analogRead|analogWrite|delay|delayMicroseconds|millis|micros|map|constrain|tone|noTone|pulseIn|Serial|begin|print|println|available|read|attach|write)\b/g, '<span class="tok-fn">$1</span>');
    out = out.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="tok-num">$1</span>');
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
    if (!ts) return ', ';
    try {
      return new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return ', ';
    }
  }

  function formatDateTime(ts) {
    if (!ts) return ', ';
    try {
      return new Date(ts).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return ', ';
    }
  }

  function getInitials(name) {
    return String(name || 'ST')
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  function renderFooterHtml() {
    return `
      <footer class="site-footer">
        <p class="footer-brand-line">RoboDex&#x0301; | Train Yourself</p>
        <p>United Academy Robotics Club | United Academy</p>
        <p>Copyright &copy; United Academy Robotics Club Member - Neilhancy Dev 2026</p>
      </footer>
    `;
  }

  function injectOrganicBackdrop() {
    if (document.getElementById('hyperbloom-bg')) return;
    const bg = document.createElement('div');
    bg.id = 'hyperbloom-bg';
    bg.className = 'hyperbloom-backdrop';
    bg.setAttribute('aria-hidden', 'true');
    bg.innerHTML = `
      <svg viewBox="0 0 1600 1000" preserveAspectRatio="none" fill="none">
        <path d="M-100,250 C260,70 580,410 980,200 C1280,45 1500,165 1700,85 L1700,-80 L-100,-80 Z" fill="var(--bg-curve-fill-1)"/>
        <path d="M-100,770 C280,580 680,910 1140,685 C1390,560 1550,650 1700,590 L1700,1080 L-100,1080 Z" fill="var(--bg-curve-fill-2)"/>
        <path d="M-100,520 C340,340 760,670 1180,470 C1420,355 1560,420 1700,360 L1700,1080 L-100,1080 Z" fill="var(--bg-curve-fill-3)"/>
      </svg>
    `;
    document.body.prepend(bg);
  }

  async function requireActiveProfile() {
    const profile = await window.RoboDexDB.getActiveProfile();
    if (!profile) {
      window.location.replace('./index.html');
      return null;
    }
    return profile;
  }

  async function initShell() {
    window.RoboDexPrefs.applyVisualPrefs();
    injectOrganicBackdrop();

    const page = document.body.getAttribute('data-page') || '';

    // Register service worker on http/https (relative path for GitHub Pages)
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
      navigator.serviceWorker.register('./service-worker.js').catch(() => {});
    }

    // Profile gate page renders its own full-canvas layout + exact footer
    if (page === 'profile-gate') {
      const footerHost = document.getElementById('site-footer');
      if (footerHost) footerHost.innerHTML = renderFooterHtml();
      return null;
    }

    // Enforce active session profile on student workspace pages
    const requiresProfile = ['dashboard', 'learn', 'boards', 'projects', 'my-information'].includes(page);
    let profile = null;
    try {
      profile = await window.RoboDexDB.getActiveProfile();
    } catch {
      profile = null;
    }

    if (requiresProfile && !profile) {
      window.location.replace('./index.html');
      return null;
    }

    const sidebarHost = document.getElementById('app-sidebar-host');
    if (sidebarHost) {
      sidebarHost.innerHTML = `
        <aside class="app-sidebar" aria-label="Primary Sidebar Navigation">
          <div>
            <div class="sidebar-brand">
              <a class="wordmark" href="${profile ? './dashboard.html' : './index.html'}">RoboDex&#x0301;</a>
              <span class="wordmark-sub">Train Yourself</span>
            </div>
            <nav aria-label="Main Destinations">
              <ul class="sidebar-nav-list">
                ${PRIMARY_NAV.map((item) => `
                  <li>
                    <a href="${item.href}" class="sidebar-nav-link ${page === item.id ? 'active' : ''}">
                      <span class="sidebar-nav-icon" aria-hidden="true">${item.icon}</span>
                      <span>${item.label}</span>
                    </a>
                  </li>
                `).join('')}
              </ul>
            </nav>
          </div>
          <div class="sidebar-bottom-card">
            <strong style="display:block; color:var(--text-primary); margin-bottom:0.2rem;">Local-First Workspace</strong>
            Progress saves in this browser's IndexedDB. No server account required.
          </div>
        </aside>
      `;
    }

    const utilityHost = document.getElementById('utility-bar-host');
    if (utilityHost) {
      const theme = window.RoboDexPrefs.get('theme');
      const contextTitle = PAGE_TITLES[page] || 'RoboDex́';
      utilityHost.innerHTML = `
        <header class="utility-bar">
          <div class="utility-context">${escapeHtml(contextTitle)}</div>
          <div class="utility-actions">
            <button type="button" id="theme-toggle-btn" class="utility-btn" aria-label="Toggle Dark or Light Hyper-Bloom theme">
              <span>${theme === 'light' ? '🌙 Dark Theme' : '☀️ Light Theme'}</span>
            </button>
            ${profile ? `
              <a href="./my-information.html" class="profile-chip" title="Open My Information">
                <span class="profile-avatar">${escapeHtml(getInitials(profile.fullName))}</span>
                <span>${escapeHtml(profile.fullName)}</span>
              </a>
              <a href="./index.html" class="utility-btn" title="Return to local profile selection">Switch Profile</a>
            ` : `
              <a href="./index.html" class="utility-btn">Select Profile</a>
            `}
          </div>
        </header>
      `;

      const themeBtn = document.getElementById('theme-toggle-btn');
      if (themeBtn) {
        themeBtn.addEventListener('click', () => {
          const next = window.RoboDexPrefs.toggleTheme();
          themeBtn.innerHTML = `<span>${next === 'light' ? '🌙 Dark Theme' : '☀️ Light Theme'}</span>`;
          window.dispatchEvent(new CustomEvent('robodex:theme-changed', { detail: { theme: next } }));
        });
      }
    }

    const footerHost = document.getElementById('site-footer');
    if (footerHost) {
      footerHost.innerHTML = renderFooterHtml();
    }

    return profile;
  }

  document.addEventListener('DOMContentLoaded', () => {
    initShell();
  });

  return {
    PRIMARY_NAV,
    escapeHtml,
    highlightCpp,
    loadJSON,
    showToast,
    downloadFile,
    formatDate,
    formatDateTime,
    getInitials,
    renderFooterHtml,
    requireActiveProfile,
    initShell
  };
})();
