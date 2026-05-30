const CACHE_NAME = 'chemsim-pwa-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Install Event - cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event - clean up obsolete caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - network-first with cache-fallback
self.addEventListener('fetch', (event) => {
  // Skip browser extensions, chrome-extension, other origins
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Simply don't call respondWith for non-GET methods or API routes, which completely bypasses the Service Worker and allows normal browser fetching to prevent Safari WebKit errors.
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache dynamic assets on the fly
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Offline: Fallback to cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If the resource is not in cache (like high-weight bundles we didn't cache yet), fallback to index.html for SPA matching
          const acceptHeader = event.request.headers.get('accept');
          if (acceptHeader && acceptHeader.includes('text/html')) {
            return caches.match('/');
          }
          // Return a fallback JSON response if an API endpoint fails / is offline
          if (event.request.url.includes('/api/')) {
            return new Response(JSON.stringify({ error: 'عذراً، محرك المحاكاة أوفلاين حالياً. يرجى التحقق من اتصال الخادم.' }), {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        });
      })
  );
});
