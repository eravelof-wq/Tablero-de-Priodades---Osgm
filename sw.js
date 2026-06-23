/* Service Worker — Tablero OSGM
   Estrategia:
   - App shell (HTML, manifest, íconos): cache-first (abre offline).
   - Datos del Web App (Apps Script): siempre red (no se cachea aquí; la app
     guarda el último JSON en localStorage para mostrar offline).
*/
const CACHE = 'osgm-tablero-v1';
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  // No interceptar llamadas al backend ni a Google: siempre red.
  if (url.includes('script.google.com') || url.includes('googleusercontent.com') || e.request.method !== 'GET') {
    return; // deja pasar a la red normal
  }
  // App shell y estáticos: cache-first con respaldo de red.
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(resp => {
      const copy = resp.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
      return resp;
    }).catch(() => caches.match('./index.html')))
  );
});
