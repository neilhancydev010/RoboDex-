/* ==========================================================================
   RoboDex́ — Lightweight Preferences (localStorage) & Session Profile Scope
   Theme & reading settings persist in localStorage.
   Active student profile is strictly session-scoped (sessionStorage) so fresh
   visits always display the local profile selection screen.
   ========================================================================== */

window.RoboDexPrefs = (function () {
  const PREFIX = 'robodex_pref_';
  const SESSION_PROFILE_KEY = 'robodex_session_active_profile';
  const DEFAULTS = {
    theme: 'light',
    fontSize: 'md',
    quizPassScore: 70
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
      // Ignore storage quota or restricted context
    }
  }

  function remove(key) {
    try {
      localStorage.removeItem(PREFIX + key);
    } catch {
      // Ignore
    }
  }

  /* Session-scoped active profile (cleared when browser session closes) */
  function getSessionProfileId() {
    try {
      return sessionStorage.getItem(SESSION_PROFILE_KEY) || '';
    } catch {
      return '';
    }
  }

  function setSessionProfileId(profileId) {
    try {
      if (profileId) sessionStorage.setItem(SESSION_PROFILE_KEY, String(profileId));
      else sessionStorage.removeItem(SESSION_PROFILE_KEY);
    } catch {
      // Ignore
    }
  }

  function clearSessionProfileId() {
    try {
      sessionStorage.removeItem(SESSION_PROFILE_KEY);
    } catch {
      // Ignore
    }
  }

  function applyVisualPrefs() {
    const theme = get('theme') === 'light' ? 'light' : 'dark';
    const fontSize = ['sm', 'md', 'lg'].includes(get('fontSize')) ? get('fontSize') : 'md';
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-font-size', fontSize);
    return { theme, fontSize };
  }

  function toggleTheme() {
    const next = get('theme') === 'light' ? 'dark' : 'light';
    set('theme', next);
    applyVisualPrefs();
    return next;
  }

  return {
    get,
    set,
    remove,
    getSessionProfileId,
    setSessionProfileId,
    clearSessionProfileId,
    applyVisualPrefs,
    toggleTheme,
    DEFAULTS
  };
})();
