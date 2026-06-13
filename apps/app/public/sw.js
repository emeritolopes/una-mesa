const CACHE = 'unamesa-v1';
const STATIC = [
  '/',
  '/app/app.jsx',
  '/app/components.jsx',
  '/app/home.jsx',
  '/app/results.jsx',
  '/app/booking.jsx',
  '/app/profile.jsx',
  '/app/app.css',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
