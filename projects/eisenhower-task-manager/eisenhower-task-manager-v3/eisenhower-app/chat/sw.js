// Service worker for PWA shell caching + Web Push (job notifications)
const CACHE_NAME = 'copilot-v5';
const SHELL_FILES = ['/chat', '/chat/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only cache GET requests for the app shell; API calls go to network
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return;
  }
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

// ── Web Push: job-completion notifications (Phase 2) ──
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch {}
  const title = data.title || 'Copilot';
  const options = {
    body: data.body || '',
    tag: data.tag || 'copilot',
    icon: '/chat/icon-192.png',
    badge: '/chat/icon-192.png',
    data: { url: data.url || '/chat' }
  };
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // If a Copilot window is already focused, the in-app toast covers it — skip the
      // OS buzz, UNLESS forced (a manual Test, which you want to see regardless).
      if (clients.some(c => c.focused) && !data.force) return;
      return self.registration.showNotification(title, options);
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/chat';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const c of clients) { if (c.url.includes('/chat') && 'focus' in c) return c.focus(); }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
