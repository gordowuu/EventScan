// Service Worker for EventSnap PWA v5.1
// Auto-update capable with network-first strategy

const CACHE_VERSION = 'eventsnap-v5.1.0-' + Date.now();
const CACHE_NAME = CACHE_VERSION;

// Core files to cache for offline functionality
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/privacy.html',
  '/terms.html'
];

// Install event - cache core resources
self.addEventListener('install', event => {
  console.log('[SW] Installing Service Worker...', CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching core assets');
        return cache.addAll(CORE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating new Service Worker...', CACHE_NAME);
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - network first, then cache fallback
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // Skip Firebase and external API requests
  if (
    url.hostname.includes('firebasestorage.googleapis.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('gstatic.com') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com')
  ) {
    return;
  }

  event.respondWith(
    // Try network first
    fetch(event.request)
      .then(response => {
        // Check if valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();

        // Update cache with fresh content
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });

        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request)
          .then(response => {
            if (response) {
              console.log('[SW] Serving from cache:', event.request.url);
              return response;
            }

            // If HTML request and not in cache, return index.html for SPA routing
            if (event.request.headers.get('accept')?.includes('text/html')) {
              return caches.match('/index.html');
            }

            // Return offline error
            return new Response('Offline - content not available', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Handle share target
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Handle share target POST requests
  if (event.request.method === 'POST' && url.pathname === '/') {
    event.respondWith(
      (async () => {
        const formData = await event.request.formData();
        const files = formData.getAll('image');

        // Store files in IndexedDB or pass to client
        if (files.length > 0) {
          // Redirect to the main page with a flag
          const client = await self.clients.get(event.resultingClientId);
          if (client) {
            client.postMessage({
              type: 'SHARE_TARGET',
              files: files
            });
          }
        }

        // Return the main page
        return Response.redirect('/?shared=true', 303);
      })()
    );
  }
});

// Listen for messages from the client
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
