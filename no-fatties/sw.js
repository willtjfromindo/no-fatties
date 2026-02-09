// DEPLOY CHECKLIST:
// 1. Make your changes to the app files
// 2. Increment APP_VERSION below
// 3. Deploy all files to the server
// The new SW will automatically:
//   - Pre-cache all shell files on install
//   - Delete old shell caches on activate
//   - Take over when the page signals SKIP_WAITING
const APP_VERSION = 2;
const CACHE_NAME = `no-fatties-v${APP_VERSION}`;
const MODEL_CACHE = 'no-fatties-models-v1';

const SHELL_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/css/styles.css',
  '/fonts/fredoka-one-latin.woff2',
  '/js/main.js',
  '/js/config.js',
  '/js/state.js',
  '/js/screens.js',
  '/js/camera.js',
  '/js/models.js',
  '/js/detection.js',
  '/js/audio.js',
  '/js/wakelock.js',
  '/js/ui.js',
  '/js/capability.js',
  '/js/bite-state-machine.js',
  '/js/shame.js',
];

const MODEL_PATTERNS = [
  'vision_bundle.mjs',
  'hand_landmarker.task',
  'blaze_face_short_range.tflite',
  '/wasm/',
  '/models/',
];

function isModelRequest(url) {
  return MODEL_PATTERNS.some(p => url.includes(p));
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(SHELL_FILES))
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys
        .filter(k => k !== CACHE_NAME && k !== MODEL_CACHE)
        .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  if (isModelRequest(url)) {
    // Cache-first for models (large, rarely change)
    event.respondWith(
      caches.open(MODEL_CACHE).then(cache =>
        cache.match(event.request).then(cached => {
          if (cached) return cached;
          return fetch(event.request).then(response => {
            if (response.ok) {
              cache.put(event.request, response.clone());
            }
            return response;
          });
        })
      )
    );
    return;
  }

  // Network-first for app shell (so deploys propagate)
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
