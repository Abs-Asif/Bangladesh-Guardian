const CACHE_NAME = 'bg-photocard-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/404.html',
  '/Logoicon.svg',
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
