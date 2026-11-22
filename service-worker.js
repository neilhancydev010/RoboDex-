/* RoboDex́ Service Worker — Offline-capable static asset caching (relative paths) */
const CACHE_NAME = 'robodex-v2-stage3-final';
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
  './assets/js/visual-figures.js',
  './assets/js/project-diagrams.js',
  './assets/js/profile-gate.js',
  './assets/js/dashboard-page.js',
  './assets/js/learn-page.js',
  './assets/js/boards-page.js',
  './assets/js/projects-page.js',
  './assets/js/my-information-page.js',
  './assets/js/editor.js',
  './assets/js/exercises.js',
  './assets/js/quiz.js',
  './data/curriculum.json',
  './data/lessons/mod-01.json',
  './data/lessons/mod-02.json',
  './data/lessons/mod-03.json',
  './data/lessons/mod-04.json',
  './data/lessons/mod-05.json',
  './data/lessons/mod-06.json',
  './data/lessons/mod-07.json',
  './data/lessons/mod-08.json',
  './data/lessons/mod-09.json',
  './data/lessons/mod-10.json',
  './data/lessons/mod-11.json',
  './data/lessons/mod-12.json',
  './assets/diagrams/arduino-loop.svg',
  './assets/diagrams/boards-overview.svg',
  './assets/diagrams/flowchart-basics.svg',
  './assets/diagrams/ipo-model.svg',
  './data/boards-curriculum.json',
  './data/hardware-assets.json',
  './data/quizzes/quizzes.json',
  './data/components-catalog.json',
  './data/projects-catalogue.json',
  './data/stage3-image-manifest.json',
  './data/projects/batch-1.json',
  './data/projects/batch-2.json',
  './data/projects/batch-3.json',
  './data/projects/batch-4.json',
  './assets/img/visuals/visual-programming.jpg',
  './assets/img/visuals/visual-embedded-io.jpg',
  './assets/img/visuals/visual-boards-architecture.jpg',
  './assets/img/visuals/visual-robotics-applied.jpg',
  './assets/img/visuals/visual-power-safety.jpg',
  './assets/img/visuals/visual-ide-upload.jpg',
  './assets/img/visuals/visual-diagnostics.jpg',
  './assets/img/projects/proj-01.svg',
  './assets/img/projects/proj-02.svg',
  './assets/img/projects/proj-03.svg',
  './assets/img/projects/proj-04.svg',
  './assets/img/projects/proj-05.svg',
  './assets/img/projects/proj-06.svg',
  './assets/img/projects/proj-07.svg',
  './assets/img/projects/proj-08.svg',
  './assets/img/projects/proj-09.svg',
  './assets/img/projects/proj-10.svg',
  './assets/img/projects/proj-11.svg',
  './assets/img/projects/proj-12.svg',
  './assets/img/projects/proj-13.svg',
  './assets/img/projects/proj-14.svg',
  './assets/img/projects/proj-15.svg',
  './assets/img/projects/proj-16.svg',
  './assets/img/projects/proj-17.svg',
  './assets/img/projects/proj-18.svg',
  './assets/img/projects/proj-19.svg',
  './assets/img/projects/proj-20.svg',
  './assets/img/projects/proj-21.svg',
  './assets/img/projects/proj-22.svg',
  './assets/img/projects/proj-23.svg',
  './assets/img/projects/proj-24.svg',
  './assets/img/projects/proj-25.svg',
  './assets/img/projects/proj-26.svg',
  './assets/img/projects/proj-27.svg',
  './assets/img/projects/proj-28.svg',
  './assets/img/projects/proj-29.svg',
  './assets/img/projects/proj-30.svg',
  './assets/img/projects/proj-31.svg',
  './assets/img/projects/proj-32.svg',
  './assets/img/projects/proj-33.svg',
  './assets/img/projects/proj-34.svg',
  './assets/img/projects/proj-35.svg',
  './assets/img/projects/proj-36.svg',
  './assets/img/projects/proj-37.svg',
  './assets/img/projects/proj-38.svg',
  './assets/img/projects/proj-39.svg',
  './assets/img/projects/proj-40.svg'
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
