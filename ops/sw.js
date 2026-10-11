/*
 * Notifications only. There is deliberately no fetch handler and no cache: a
 * service worker that caches pages is how an app gets stuck on last week's
 * code, and this one only exists because iOS will not deliver a push without it.
 *
 * The push body is JSON from netlify/lib/push.mjs: { title, body, url, tag }.
 */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || 'New order', {
    body: d.body || '',
    tag: d.tag,
    icon: 'icon-192.png',
    data: { url: d.url || './' },
  }));
});

// Tapping opens that order. An app already open is told which one (a hash
// change alone does not re-run start()); otherwise a window opens on the link.
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = new URL(e.notification.data.url, self.registration.scope).href;
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const win = wins[0];
    if (win) {
      await win.focus();
      win.postMessage({ open: url });
      return;
    }
    await self.clients.openWindow(url);
  })());
});
