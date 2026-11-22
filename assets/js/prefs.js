/* ==========================================================================
   RoboDex́ — Lightweight Preferences (localStorage only)
   Structured student records live in IndexedDB (db.js).
   ========================================================================== */

window.RoboDexPrefs = (function () {
  const PREFIX = 'robodex_pref_';
  const DEFAULTS = {
    theme: 'light',
    fontSize: 'md',
    activeProfileId: '',
    quizPassScore: 70,
    lockProgression: true
  };

  function get(key) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (raw === null) return DEFAULTS[key];
      return JSON.parse(raw);
    } catch {
      return DEFAULTS[key];
    }
  }

  function set(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      // Storage quota or private mode fallback
    }
  }

  function remove(key) {
    try {
      localStorage.removeItem(PREFIX + key);
    } catch {
      // ignore
    }
  }

  function applyVisualPrefs() {
    const theme = get('theme') === 'dark' ? 'dark' : 'light';
    const fontSize = ['sm', 'md', 'lg'].includes(get('fontSize')) ? get('fontSize') : 'md';
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-font-size', fontSize);
    return { theme, fontSize };
  }

  function toggleTheme() {
    const next = get('theme') === 'dark' ? 'light' : 'dark';
    set('theme', next);
    applyVisualPrefs();
    return next;
  }

  return { get, set, remove, applyVisualPrefs, toggleTheme, DEFAULTS };
})();
