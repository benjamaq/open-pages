// Minimal service worker for installability and conservative offline support
// Cache only safe GET requests; exclude /api/ by default

const CACHE_VERSION = 'v7';
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;
const OFFLINE_FALLBACK_URL = '/offline';

/**
 * Paths that must never be satisfied from cache or altered by the SW.
 * Magic-link /auth/callback (query + hash PKCE) must hit the origin directly.
 */
const NAVIGATION_BYPASS_PREFIXES = ['/auth/callback'];

function shouldBypassFetch(request) {
  let pathname = '';
  try {
    pathname = new URL(request.url).pathname;
  } catch {
    return false;
  }
  return NAVIGATION_BYPASS_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

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

// Passthrough fetch. For /auth/callback do not call respondWith — browser performs default network navigation
// so magic-link PKCE (query or hash) is not mediated by the SW at all.
self.addEventListener('fetch', (event) => {
  if (shouldBypassFetch(event.request)) {
    return;
  }
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


