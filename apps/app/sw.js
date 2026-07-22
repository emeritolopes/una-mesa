const CACHE = 'unamesa-v1';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).catch(async () => {
      // caches.match() puede devolver undefined si no hay nada guardado
      // para esta petición exacta — respondWith() nunca acepta undefined,
      // solo una Response real, o el navegador rompe con
      // "Failed to convert value to 'Response'".
      const cached = await caches.match(e.request);
      return cached || new Response('Offline', { status: 503, statusText: 'Offline' });
    })
  );
});
