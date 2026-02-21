// Minimal service worker for installability and conservative offline support
// Cache only safe GET requests; exclude /api/ by default

const CACHE_VERSION = 'v6';
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

// SAFETY: passthrough fetch handler.
// If a SW fetch handler is buggy, it can stall the entire site. For now we do not cache or
// special-case any requests; everything goes straight to the network.
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});


// Display notifications from pushes (for completeness during future server push tests)
self.addEventListener('push', (event) => {
  try {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'BioStackr';
    const body = data.body || 'Time to check in – it only takes 20 seconds.';
    const url = data.url || '/dash/today';
    const options = {
      body,
      icon: '/icon-192-v2.png',
      badge: '/icon-192-v2.png',
      data: { url },
      vibrate: [100, 50, 100],
      tag: 'biostackr-reminder'
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch (e) {
    // fallback if payload isn't JSON
    event.waitUntil(self.registration.showNotification('BioStackr', {
      body: 'Time to check in – it only takes 20 seconds.',
      icon: '/icon-192-v2.png',
      badge: '/icon-192-v2.png',
      tag: 'biostackr-reminder'
    }));
  }
});

// Focus/open the app when a notification is clicked
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || '/dash/today';
  event.waitUntil(
    (async () => {
      const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of allClients) {
        const url = new URL(client.url);
        if (url.pathname === targetUrl || url.pathname === '/') {
          client.focus();
          client.postMessage({ type: 'OPEN_PATH', path: targetUrl });
          return;
        }
      }
      await clients.openWindow(targetUrl);
    })()
  );
});


