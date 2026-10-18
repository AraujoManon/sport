// Service worker : l'app fonctionne entièrement hors ligne.
// Change VERSION à chaque mise à jour des fichiers pour que les téléphones la récupèrent.
const VERSION = 'mon-cadre-v4.2.0';
const FILES = [
  './', 'index.html', 'styles.css', 'app.js', 'charts.js', 'data.js', 'manifest.webmanifest',
  'fonts/fonts.css', 'fonts/figtree-normal.woff2', 'fonts/fraunces-normal.woff2', 'fonts/fraunces-italic.woff2',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Réseau d'abord pour la page (mises à jour rapides), cache d'abord pour le reste.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put('index.html', copy)); return r; })
      .catch(() => caches.match('index.html')));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(r => {
    if (r.ok) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
    return r;
  })));
});
