/* ==========================================================================
   RoboDex́ — Versioned IndexedDB Persistence Layer (Schema v2)
   - Non-destructive upgrade from V1 (preserves all existing records)
   - Concurrency-safe V1 migration/recovery (shared migrationPromise)
   - Independent multi-profile storage supporting identical full names
   - Prepares boardProgress & activityLog stores for Stages 2 & 3
   - Requests persistent browser storage where supported
   ========================================================================== */

window.RoboDexDB = (function () {
  const DB_NAME = 'RoboDexAcademyDB';
  const DB_VERSION = 2;
  const BACKUP_SCHEMA_VERSION = '2.0';
  let dbPromise = null;
  let migrationPromise = null;

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
          const s = db.createObjectStore('lessonProgress', { keyPath: 'key' });
          s.createIndex('byProfile', 'profileId', { unique: false });
        }
        if (!db.objectStoreNames.contains('exerciseAttempts')) {
          const s = db.createObjectStore('exerciseAttempts', { keyPath: 'key' });
          s.createIndex('byProfile', 'profileId', { unique: false });
        }
        if (!db.objectStoreNames.contains('quizAttempts')) {
          const s = db.createObjectStore('quizAttempts', { keyPath: 'key' });
          s.createIndex('byProfile', 'profileId', { unique: false });
        }
        if (!db.objectStoreNames.contains('projectProgress')) {
          const s = db.createObjectStore('projectProgress', { keyPath: 'key' });
          s.createIndex('byProfile', 'profileId', { unique: false });
        }
        if (!db.objectStoreNames.contains('boardProgress')) {
          const s = db.createObjectStore('boardProgress', { keyPath: 'key' });
          s.createIndex('byProfile', 'profileId', { unique: false });
        }
        if (!db.objectStoreNames.contains('activityLog')) {
          const s = db.createObjectStore('activityLog', { keyPath: 'id' });
          s.createIndex('byProfile', 'profileId', { unique: false });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error('Failed to open local IndexedDB database.'));
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
      tx.onerror = () => reject(tx.error || new Error('IndexedDB transaction failed.'));
    });
  }

  async function getAllFromStore(storeName) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const req = db.transaction(storeName, 'readonly').objectStore(storeName).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async function getByProfile(storeName, profileId) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const idx = db.transaction(storeName, 'readonly').objectStore(storeName).index('byProfile');
      const req = idx.getAll(profileId);
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  function makeUniqueId(prefix = 'stu') {
    const rand = (window.crypto && window.crypto.randomUUID)
      ? window.crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
    return `${prefix}_${Date.now().toString(36)}_${rand}`;
  }

  function normalizeProfile(p) {
    if (!p) return null;
    const name = (p.fullName || p.displayName || 'Student').trim();
    return {
      ...p,
      fullName: name,
      displayName: name,
      lockProgression: typeof p.lockProgression === 'boolean' ? p.lockProgression : true,
      selectedBoards: Array.isArray(p.selectedBoards) ? p.selectedBoards : [],
      lastVisitedLesson: p.lastVisitedLesson || 'm01-l01',
      schemaVersion: 2
    };
  }

  /* Concurrency-safe V1 migration: all simultaneous callers await the same promise */
  function ensureV1Migration() {
    if (migrationPromise) return migrationPromise;
    migrationPromise = (async () => {
      try {
        const profiles = await getAllFromStore('profiles');
        const knownIds = new Set(profiles.map((p) => p.id));

        for (const p of profiles) {
          if (!p.fullName || p.schemaVersion !== 2) {
            await txStore('profiles', 'readwrite', (s) => s.put(normalizeProfile(p)));
          }
        }

        const dataStores = ['lessonProgress', 'exerciseAttempts', 'quizAttempts', 'projectProgress'];
        const orphans = [];
        for (const storeName of dataStores) {
          const rows = await getAllFromStore(storeName);
          for (const r of rows) {
            if (!r.profileId || !knownIds.has(r.profileId)) {
              orphans.push({ storeName, record: r });
            }
          }
        }

        if (orphans.length > 0) {
          const now = Date.now();
          const recovered = normalizeProfile({
            id: makeUniqueId('mig'),
            fullName: 'Migrated Local Learner',
            createdAt: now,
            lastActiveAt: now,
            migratedFromV1: true
          });
          await txStore('profiles', 'readwrite', (s) => s.put(recovered));

          for (const { storeName, record } of orphans) {
            const itemSuffix = record.lessonId || record.exerciseId || record.moduleId || record.projectId || makeUniqueId('rec');
            const migrated = {
              ...record,
              profileId: recovered.id,
              key: `${recovered.id}::${itemSuffix}`
            };
            await txStore(storeName, 'readwrite', (s) => {
              if (record.key && record.key !== migrated.key) s.delete(record.key);
              s.put(migrated);
            });
          }
        }
      } catch {
        // Non-fatal; never wipe existing records
      }
    })();
    return migrationPromise;
  }

  async function requestPersistentStorage() {
    try {
      if (navigator.storage && navigator.storage.persist) {
        const already = await navigator.storage.persisted();
        if (!already) await navigator.storage.persist();
      }
    } catch {
      // Unsupported or browser-declined
    }
  }

  async function getStorageStatus() {
    const status = { supported: Boolean(navigator.storage), persisted: null, usageBytes: null, quotaBytes: null };
    try {
      if (navigator.storage && navigator.storage.persisted) {
        status.persisted = await navigator.storage.persisted();
      }
      if (navigator.storage && navigator.storage.estimate) {
        const est = await navigator.storage.estimate();
        status.usageBytes = typeof est.usage === 'number' ? est.usage : null;
        status.quotaBytes = typeof est.quota === 'number' ? est.quota : null;
      }
    } catch {
      // ignore
    }
    return status;
  }

  async function listProfiles() {
    await ensureV1Migration();
    const rows = await getAllFromStore('profiles');
    return rows.map(normalizeProfile).sort((a, b) => (b.lastActiveAt || 0) - (a.lastActiveAt || 0));
  }

  async function getProfile(id) {
    if (!id) return null;
    await ensureV1Migration();
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const req = db.transaction('profiles', 'readonly').objectStore('profiles').get(id);
      req.onsuccess = () => resolve(normalizeProfile(req.result || null));
      req.onerror = () => reject(req.error);
    });
  }

  async function createProfile({ fullName }) {
    await ensureV1Migration();
    const cleanName = String(fullName || '').trim().slice(0, 64);
    if (!cleanName) throw new Error('Please enter your real full name.');
    const now = Date.now();
    const profile = normalizeProfile({
      id: makeUniqueId('stu'),
      fullName: cleanName,
      displayName: cleanName,
      selectedBoards: [],
      lockProgression: true,
      lastVisitedLesson: 'm01-l01',
      createdAt: now,
      lastActiveAt: now
    });
    await txStore('profiles', 'readwrite', (s) => s.put(profile));
    window.RoboDexPrefs.setSessionProfileId(profile.id);
    requestPersistentStorage();
    return profile;
  }

  async function selectProfile(profileId) {
    const profile = await getProfile(profileId);
    if (!profile) throw new Error('Selected profile no longer exists.');
    const updated = { ...profile, lastActiveAt: Date.now() };
    await txStore('profiles', 'readwrite', (s) => s.put(updated));
    window.RoboDexPrefs.setSessionProfileId(updated.id);
    requestPersistentStorage();
    return updated;
  }

  async function updateProfile(id, patch) {
    const existing = await getProfile(id);
    if (!existing) throw new Error('Profile not found.');
    const nextName = patch.fullName !== undefined
      ? String(patch.fullName).trim().slice(0, 64)
      : patch.displayName !== undefined
        ? String(patch.displayName).trim().slice(0, 64)
        : existing.fullName;

    const updated = normalizeProfile({
      ...existing,
      ...patch,
      id: existing.id,
      fullName: nextName || existing.fullName,
      displayName: nextName || existing.fullName,
      lastActiveAt: Date.now()
    });
    await txStore('profiles', 'readwrite', (s) => s.put(updated));
    return updated;
  }

  async function getActiveProfile() {
    await ensureV1Migration();
    const sessionId = window.RoboDexPrefs.getSessionProfileId();
    if (!sessionId) return null;
    return getProfile(sessionId);
  }

  async function logActivity(profileId, { area, action, label, targetUrl = '' }) {
    const entry = {
      id: makeUniqueId('act'),
      profileId,
      area,
      action,
      label,
      targetUrl,
      timestamp: Date.now()
    };
    await txStore('activityLog', 'readwrite', (s) => s.put(entry));
    return entry;
  }

  async function getLessonRecord(profileId, lessonId) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const req = db.transaction('lessonProgress', 'readonly').objectStore('lessonProgress').get(`${profileId}::${lessonId}`);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

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

  async function completeLessonCheckpoint(profileId, lessonId, moduleId, lessonTitle = '') {
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
    await logActivity(profileId, {
      area: 'Programming School',
      action: 'Completed lesson checkpoint',
      label: lessonTitle || lessonId,
      targetUrl: `./learn.html?lesson=${encodeURIComponent(lessonId)}`
    });
    return record;
  }

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
    await logActivity(profileId, {
      area: 'Programming School',
      action: passed ? 'Passed exercise' : 'Attempted exercise',
      label: exerciseId,
      targetUrl: `./learn.html?lesson=${encodeURIComponent(lessonId)}`
    });
    return record;
  }

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
    await logActivity(profileId, {
      area: 'Programming School',
      action: passed ? `Passed module quiz (${scorePercent}%)` : `Scored ${scorePercent}% on quiz`,
      label: moduleId.toUpperCase(),
      targetUrl: `./learn.html?quiz=${encodeURIComponent(moduleId)}`
    });
    return record;
  }

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

  async function saveBoardProgress(profileId, boardId, payload) {
    const key = `${profileId}::${boardId}`;
    const record = {
      key,
      profileId,
      boardId,
      ...payload,
      updatedAt: Date.now()
    };
    await txStore('boardProgress', 'readwrite', (s) => s.put(record));
    return record;
  }

  async function getProfileSnapshot(profileId) {
    await ensureV1Migration();
    const [profile, lessons, exercises, quizzes, projects, boards, activity] = await Promise.all([
      getProfile(profileId),
      getByProfile('lessonProgress', profileId),
      getByProfile('exerciseAttempts', profileId),
      getByProfile('quizAttempts', profileId),
      getByProfile('projectProgress', profileId),
      getByProfile('boardProgress', profileId),
      getByProfile('activityLog', profileId)
    ]);
    return { profile, lessons, exercises, quizzes, projects, boards, activity };
  }

  async function deleteProfile(profileId) {
    const stores = ['lessonProgress', 'exerciseAttempts', 'quizAttempts', 'projectProgress', 'boardProgress', 'activityLog'];
    for (const storeName of stores) {
      const rows = await getByProfile(storeName, profileId);
      if (rows.length) {
        await txStore(storeName, 'readwrite', (s) => {
          rows.forEach((r) => s.delete(r.key || r.id));
        });
      }
    }
    await txStore('profiles', 'readwrite', (s) => s.delete(profileId));
    if (window.RoboDexPrefs.getSessionProfileId() === profileId) {
      window.RoboDexPrefs.clearSessionProfileId();
    }
  }

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

  function sanitizeKeyedRecords(list, profileId, suffixField) {
    if (!Array.isArray(list)) return [];
    return list
      .filter((r) => r && typeof r === 'object' && r[suffixField])
      .map((r) => ({
        ...r,
        profileId,
        key: `${profileId}::${r[suffixField]}`
      }));
  }

  async function restoreProfileBackup(backupObj) {
    if (!backupObj || typeof backupObj !== 'object') {
      throw new Error('Backup file is not a valid JSON object.');
    }
    const validApps = ['RoboDex́', 'RoboDex'];
    if (!validApps.includes(backupObj.app) || !backupObj.data || !backupObj.data.profile) {
      throw new Error('Incompatible backup file: missing RoboDex́ profile structure.');
    }
    const rawProfile = backupObj.data.profile;
    if (!rawProfile.id || !(rawProfile.fullName || rawProfile.displayName)) {
      throw new Error('Backup profile is missing required identifier or name.');
    }
    const profile = normalizeProfile({ ...rawProfile, lastActiveAt: Date.now() });

    const {
      lessons = [],
      exercises = [],
      quizzes = [],
      projects = [],
      boards = [],
      activity = []
    } = backupObj.data;

    if (!Array.isArray(lessons) || !Array.isArray(exercises) || !Array.isArray(quizzes)) {
      throw new Error('Backup learning records are malformed.');
    }

    const cleanLessons = sanitizeKeyedRecords(lessons, profile.id, 'lessonId');
    const cleanExercises = sanitizeKeyedRecords(exercises, profile.id, 'exerciseId');
    const cleanQuizzes = sanitizeKeyedRecords(quizzes, profile.id, 'moduleId');
    const cleanProjects = sanitizeKeyedRecords(projects, profile.id, 'projectId');
    const cleanBoards = sanitizeKeyedRecords(boards, profile.id, 'boardId');
    const cleanActivity = Array.isArray(activity)
      ? activity.filter((a) => a && typeof a === 'object').map((a) => ({ ...a, id: a.id || makeUniqueId('act'), profileId: profile.id }))
      : [];

    await txStore('profiles', 'readwrite', (s) => s.put(profile));
    if (cleanLessons.length) await txStore('lessonProgress', 'readwrite', (s) => cleanLessons.forEach((r) => s.put(r)));
    if (cleanExercises.length) await txStore('exerciseAttempts', 'readwrite', (s) => cleanExercises.forEach((r) => s.put(r)));
    if (cleanQuizzes.length) await txStore('quizAttempts', 'readwrite', (s) => cleanQuizzes.forEach((r) => s.put(r)));
    if (cleanProjects.length) await txStore('projectProgress', 'readwrite', (s) => cleanProjects.forEach((r) => s.put(r)));
    if (cleanBoards.length) await txStore('boardProgress', 'readwrite', (s) => cleanBoards.forEach((r) => s.put(r)));
    if (cleanActivity.length) await txStore('activityLog', 'readwrite', (s) => cleanActivity.forEach((r) => s.put(r)));

    if (backupObj.preferences) {
      if (backupObj.preferences.theme) window.RoboDexPrefs.set('theme', backupObj.preferences.theme);
      if (backupObj.preferences.fontSize) window.RoboDexPrefs.set('fontSize', backupObj.preferences.fontSize);
      if (backupObj.preferences.quizPassScore) window.RoboDexPrefs.set('quizPassScore', backupObj.preferences.quizPassScore);
    }
    window.RoboDexPrefs.setSessionProfileId(profile.id);
    requestPersistentStorage();
    return profile;
  }

  return {
    DB_NAME,
    DB_VERSION,
    openDB,
    ensureV1Migration,
    requestPersistentStorage,
    getStorageStatus,
    listProfiles,
    getProfile,
    createProfile,
    selectProfile,
    updateProfile,
    getActiveProfile,
    logActivity,
    saveLessonVisit,
    completeLessonCheckpoint,
    getLessonRecord,
    saveExerciseAttempt,
    saveQuizAttempt,
    saveProjectProgress,
    saveBoardProgress,
    getProfileSnapshot,
    deleteProfile,
    exportProfileBackup,
    restoreProfileBackup
  };
})();
