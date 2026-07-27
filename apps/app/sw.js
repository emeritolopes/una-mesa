const CACHE = 'unamesa-v1';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  // Este service worker es para la app de React (comensales) — páginas
  // independientes como /menu-video/ o /restaurants/ no deben pasar por
  // aquí en absoluto, o cualquier fallo real de red en ellas termina
  // mostrando el "Offline" de respaldo pensado para la SPA, no un error
  // real y útil.
  const path = new URL(e.request.url).pathname;
  if (path.startsWith('/menu-video/') || path.startsWith('/restaurants/')) return;

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
