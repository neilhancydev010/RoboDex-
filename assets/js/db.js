/* ==========================================================================
   RoboDex́ — IndexedDB Persistence Layer
   Stores multiple local student profiles and all structured learning records.
   ========================================================================== */

window.RoboDexDB = (function () {
  const DB_NAME = 'RoboDexAcademyDB';
  const DB_VERSION = 1;
  const BACKUP_SCHEMA_VERSION = '1.0';
  let dbPromise = null;

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) {
        reject(new Error('IndexedDB is not supported in this browser.'));
        return;
      }
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('profiles')) {
          db.createObjectStore('profiles', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('lessonProgress')) {
          const store = db.createObjectStore('lessonProgress', { keyPath: 'key' });
          store.createIndex('byProfile', 'profileId', { unique: false });
        }
        if (!db.objectStoreNames.contains('exerciseAttempts')) {
          const store = db.createObjectStore('exerciseAttempts', { keyPath: 'key' });
          store.createIndex('byProfile', 'profileId', { unique: false });
        }
        if (!db.objectStoreNames.contains('quizAttempts')) {
          const store = db.createObjectStore('quizAttempts', { keyPath: 'key' });
          store.createIndex('byProfile', 'profileId', { unique: false });
        }
        if (!db.objectStoreNames.contains('projectProgress')) {
          const store = db.createObjectStore('projectProgress', { keyPath: 'key' });
          store.createIndex('byProfile', 'profileId', { unique: false });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error('Failed to open IndexedDB.'));
    });
    return dbPromise;
  }

  async function txStore(storeName, mode, fn) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, mode);
      const store = tx.objectStore(storeName);
      let result;
      try {
        result = fn(store);
      } catch (err) {
        reject(err);
        return;
      }
      tx.oncomplete = () => resolve(result && 'result' in result ? result.result : result);
      tx.onerror = () => reject(tx.error || new Error('Transaction failed'));
    });
  }

  async function getAllFromStore(storeName) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const req = tx.objectStore(storeName).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async function getByProfile(storeName, profileId) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const idx = tx.objectStore(storeName).index('byProfile');
      const req = idx.getAll(profileId);
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  function makeId() {
    return 'stu_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
  }

  /* ---- Profiles ---- */
  async function listProfiles() {
    const rows = await getAllFromStore('profiles');
    return rows.sort((a, b) => (b.lastActiveAt || 0) - (a.lastActiveAt || 0));
  }

  async function getProfile(id) {
    if (!id) return null;
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const req = db.transaction('profiles', 'readonly').objectStore('profiles').get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async function createProfile({ displayName, goal = '', selectedBoards = ['uno-r3'], learningStyle = 'guided', lockProgression = true }) {
    const now = Date.now();
    const profile = {
      id: makeId(),
      displayName: (displayName || 'Student').trim().slice(0, 48),
      goal: (goal || '').trim().slice(0, 140),
      selectedBoards: Array.isArray(selectedBoards) && selectedBoards.length ? selectedBoards : ['uno-r3'],
      learningStyle,
      lockProgression: Boolean(lockProgression),
      lastVisitedLesson: 'm01-l01',
      selectedProjects: [],
      createdAt: now,
      lastActiveAt: now
    };
    await txStore('profiles', 'readwrite', (s) => s.put(profile));
    window.RoboDexPrefs.set('activeProfileId', profile.id);
    return profile;
  }

  async function updateProfile(id, patch) {
    const existing = await getProfile(id);
    if (!existing) throw new Error('Profile not found.');
    const updated = {
      ...existing,
      ...patch,
      id: existing.id,
      lastActiveAt: Date.now()
    };
    await txStore('profiles', 'readwrite', (s) => s.put(updated));
    return updated;
  }

  async function getActiveProfile() {
    const savedId = window.RoboDexPrefs.get('activeProfileId');
    if (savedId) {
      const found = await getProfile(savedId);
      if (found) return found;
    }
    const all = await listProfiles();
    if (all.length > 0) {
      window.RoboDexPrefs.set('activeProfileId', all[0].id);
      return all[0];
    }
    return null;
  }

  async function ensureActiveProfile() {
    const current = await getActiveProfile();
    if (current) return current;
    return createProfile({
      displayName: 'Local Learner',
      goal: 'Learn C++ and Arduino programming from scratch',
      selectedBoards: ['uno-r3'],
      learningStyle: 'guided',
      lockProgression: true
    });
  }

  /* ---- Lesson Progress ---- */
  async function saveLessonVisit(profileId, lessonId, moduleId) {
    const key = `${profileId}::${lessonId}`;
    const existing = await getLessonRecord(profileId, lessonId);
    const now = Date.now();
    const record = {
      key,
      profileId,
      lessonId,
      moduleId,
      visited: true,
      checkpointCompleted: existing ? Boolean(existing.checkpointCompleted) : false,
      completedAt: existing ? existing.completedAt : null,
      lastVisitedAt: now
    };
    await txStore('lessonProgress', 'readwrite', (s) => s.put(record));
    await updateProfile(profileId, { lastVisitedLesson: lessonId });
    return record;
  }

  async function completeLessonCheckpoint(profileId, lessonId, moduleId) {
    const key = `${profileId}::${lessonId}`;
    const existing = await getLessonRecord(profileId, lessonId);
    const now = Date.now();
    const record = {
      key,
      profileId,
      lessonId,
      moduleId,
      visited: true,
      checkpointCompleted: true,
      completedAt: existing && existing.completedAt ? existing.completedAt : now,
      lastVisitedAt: now
    };
    await txStore('lessonProgress', 'readwrite', (s) => s.put(record));
    await updateProfile(profileId, { lastVisitedLesson: lessonId });
    return record;
  }

  async function getLessonRecord(profileId, lessonId) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const req = db.transaction('lessonProgress', 'readonly').objectStore('lessonProgress').get(`${profileId}::${lessonId}`);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  /* ---- Exercise Attempts ---- */
  async function saveExerciseAttempt(profileId, { exerciseId, lessonId, moduleId, passed, lastAnswer }) {
    const key = `${profileId}::${exerciseId}`;
    const db = await openDB();
    const existing = await new Promise((resolve, reject) => {
      const req = db.transaction('exerciseAttempts', 'readonly').objectStore('exerciseAttempts').get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
    const now = Date.now();
    const record = {
      key,
      profileId,
      exerciseId,
      lessonId,
      moduleId,
      attempts: (existing ? existing.attempts : 0) + 1,
      passed: Boolean((existing && existing.passed) || passed),
      lastPassed: Boolean(passed),
      lastAnswer,
      updatedAt: now
    };
    await txStore('exerciseAttempts', 'readwrite', (s) => s.put(record));
    return record;
  }

  /* ---- Quiz Attempts ---- */
  async function saveQuizAttempt(profileId, { moduleId, scorePercent, correctCount, totalQuestions, passed }) {
    const key = `${profileId}::${moduleId}`;
    const db = await openDB();
    const existing = await new Promise((resolve, reject) => {
      const req = db.transaction('quizAttempts', 'readonly').objectStore('quizAttempts').get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
    const now = Date.now();
    const bestScore = existing ? Math.max(existing.bestScore, scorePercent) : scorePercent;
    const record = {
      key,
      profileId,
      moduleId,
      attempts: (existing ? existing.attempts : 0) + 1,
      lastScore: scorePercent,
      bestScore,
      correctCount,
      totalQuestions,
      passed: Boolean((existing && existing.passed) || passed),
      updatedAt: now
    };
    await txStore('quizAttempts', 'readwrite', (s) => s.put(record));
    return record;
  }

  /* ---- Project Progress ---- */
  async function saveProjectProgress(profileId, projectId, completedSteps) {
    const key = `${profileId}::${projectId}`;
    const record = {
      key,
      profileId,
      projectId,
      completedSteps: Array.from(new Set(completedSteps || [])),
      updatedAt: Date.now()
    };
    await txStore('projectProgress', 'readwrite', (s) => s.put(record));
    return record;
  }

  /* ---- Full Profile Snapshot ---- */
  async function getProfileSnapshot(profileId) {
    const [profile, lessons, exercises, quizzes, projects] = await Promise.all([
      getProfile(profileId),
      getByProfile('lessonProgress', profileId),
      getByProfile('exerciseAttempts', profileId),
      getByProfile('quizAttempts', profileId),
      getByProfile('projectProgress', profileId)
    ]);
    return { profile, lessons, exercises, quizzes, projects };
  }

  /* ---- Delete Local Profile ---- */
  async function deleteProfile(profileId) {
    const stores = ['lessonProgress', 'exerciseAttempts', 'quizAttempts', 'projectProgress'];
    for (const storeName of stores) {
      const rows = await getByProfile(storeName, profileId);
      await txStore(storeName, 'readwrite', (s) => {
        rows.forEach((r) => s.delete(r.key));
      });
    }
    await txStore('profiles', 'readwrite', (s) => s.delete(profileId));
    if (window.RoboDexPrefs.get('activeProfileId') === profileId) {
      const remaining = await listProfiles();
      window.RoboDexPrefs.set('activeProfileId', remaining[0] ? remaining[0].id : '');
    }
  }

  /* ---- Backup & Restore (Versioned JSON) ---- */
  async function exportProfileBackup(profileId) {
    const snapshot = await getProfileSnapshot(profileId);
    if (!snapshot.profile) throw new Error('No active profile found to export.');
    return {
      app: 'RoboDex́',
      schemaVersion: BACKUP_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      preferences: {
        theme: window.RoboDexPrefs.get('theme'),
        fontSize: window.RoboDexPrefs.get('fontSize'),
        quizPassScore: window.RoboDexPrefs.get('quizPassScore')
      },
      data: snapshot
    };
  }

  async function restoreProfileBackup(backupObj) {
    if (!backupObj || backupObj.app !== 'RoboDex́' || !backupObj.data || !backupObj.data.profile) {
      throw new Error('Invalid RoboDex́ backup file format.');
    }
    const { profile, lessons = [], exercises = [], quizzes = [], projects = [] } = backupObj.data;
    if (!profile.id || !profile.displayName) {
      throw new Error('Backup file is missing required profile fields.');
    }
    await txStore('profiles', 'readwrite', (s) => s.put({ ...profile, lastActiveAt: Date.now() }));
    if (lessons.length) {
      await txStore('lessonProgress', 'readwrite', (s) => lessons.forEach((r) => s.put(r)));
    }
    if (exercises.length) {
      await txStore('exerciseAttempts', 'readwrite', (s) => exercises.forEach((r) => s.put(r)));
    }
    if (quizzes.length) {
      await txStore('quizAttempts', 'readwrite', (s) => quizzes.forEach((r) => s.put(r)));
    }
    if (projects.length) {
      await txStore('projectProgress', 'readwrite', (s) => projects.forEach((r) => s.put(r)));
    }
    if (backupObj.preferences) {
      if (backupObj.preferences.theme) window.RoboDexPrefs.set('theme', backupObj.preferences.theme);
      if (backupObj.preferences.fontSize) window.RoboDexPrefs.set('fontSize', backupObj.preferences.fontSize);
      if (backupObj.preferences.quizPassScore) window.RoboDexPrefs.set('quizPassScore', backupObj.preferences.quizPassScore);
    }
    window.RoboDexPrefs.set('activeProfileId', profile.id);
    return profile;
  }

  return {
    openDB,
    listProfiles,
    getProfile,
    createProfile,
    updateProfile,
    getActiveProfile,
    ensureActiveProfile,
    saveLessonVisit,
    completeLessonCheckpoint,
    getLessonRecord,
    saveExerciseAttempt,
    saveQuizAttempt,
    saveProjectProgress,
    getProfileSnapshot,
    deleteProfile,
    exportProfileBackup,
    restoreProfileBackup
  };
})();
