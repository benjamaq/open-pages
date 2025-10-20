// Minimal service worker for installability and conservative offline support
// Cache only safe GET requests; exclude /api/ by default

const CACHE_VERSION = 'v4';
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;
const OFFLINE_FALLBACK_URL = '/offline';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(RUNTIME_CACHE).then((cache) => cache.addAll([OFFLINE_FALLBACK_URL]))
  );
  // Activate new SW immediately to purge old caches
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => (key.startsWith('runtime-') && key !== RUNTIME_CACHE ? caches.delete(key) : undefined))
      );
      await self.clients.claim();
    })()
  );
});

// Allow client to trigger immediate activation
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Never cache API calls by default
  if (url.pathname.startsWith('/api/')) return;

  // Navigation requests: network-first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          return fresh;
        } catch (err) {
          const cache = await caches.open(RUNTIME_CACHE);
          const cached = await cache.match(OFFLINE_FALLBACK_URL);
          return cached || new Response('You are offline', { status: 503, statusText: 'Offline' });
        }
      })()
    );
    return;
  }

  // Static assets: stale-while-revalidate
  if (url.origin === self.origin && (url.pathname.startsWith('/_next/') || url.pathname.startsWith('/public/') || url.pathname.match(/\.(?:js|css|png|jpg|jpeg|gif|svg|webp|ico|woff2?)$/))) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(RUNTIME_CACHE);
        const cachedResponse = await cache.match(request);
        const networkFetch = fetch(request)
          .then((response) => {
            // Clone and store a successful response
            if (response && response.status === 200) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => undefined);

        return cachedResponse || (await networkFetch) || new Response('Offline', { status: 503 });
      })()
    );
  }
});


