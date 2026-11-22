/* RoboDex́ Service Worker — Offline-capable static asset caching (relative paths) */
const CACHE_NAME = 'robodex-v2-stage2';
const CORE_ASSETS = [
  './',
  './index.html',
  './dashboard.html',
  './learn.html',
  './boards.html',
  './projects.html',
  './my-information.html',
  './about.html',
  './404.html',
  './manifest.webmanifest',
  './assets/css/tokens.css',
  './assets/css/base.css',
  './assets/css/layout.css',
  './assets/css/components.css',
  './assets/js/prefs.js',
  './assets/js/db.js',
  './assets/js/progress.js',
  './assets/js/app.js',
  './assets/js/profile-gate.js',
  './assets/js/dashboard-page.js',
  './assets/js/learn-page.js',
  './assets/js/boards-page.js',
  './assets/js/my-information-page.js',
  './assets/js/editor.js',
  './assets/js/exercises.js',
  './assets/js/quiz.js',
  './data/curriculum.json',
  './data/boards-curriculum.json',
  './data/hardware-assets.json',
  './data/quizzes/quizzes.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});
