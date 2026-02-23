const CACHE_NAME = 'bg-photocard-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/404.html',
  '/Logoicon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/logo.png',
  '/PhotocardTemplate.png',
  '/Alert.mp3',
  '/Instant.mp3',
  '/Loud.mp3'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => {
          return cacheName.startsWith('bg-photocard-') && cacheName !== CACHE_NAME;
        }).map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    })
  );
});
