// This is a basic service worker for PWA functionality.
// It allows the app to be "installed" to the home screen.

const CACHE_NAME = 'eventsnap-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/script.js',
  '/manifest.json'
  // NOTE: You would add icon paths here if you create them
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});
