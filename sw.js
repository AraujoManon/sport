// Service worker : l'app fonctionne entièrement hors ligne.
// Change VERSION à chaque mise à jour des fichiers pour que les téléphones la récupèrent.
const VERSION = 'mon-cadre-v4.3.0';
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

// Rappel du soir (best effort, Android/Chrome) : la page écrit dans IndexedDB
// (pas d'accès à localStorage depuis un service worker) si la journée est remplie.
const IDB_NAME = 'mon-cadre-kv', IDB_STORE = 'kv';
function idbGet(key) {
  return new Promise(resolve => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
    req.onsuccess = () => {
      const db = req.result, tx = db.transaction(IDB_STORE, 'readonly');
      const g = tx.objectStore(IDB_STORE).get(key);
      g.onsuccess = () => { db.close(); resolve(g.result); };
      g.onerror = () => { db.close(); resolve(undefined); };
    };
    req.onerror = () => resolve(undefined);
  });
}
function idbSet(key, val) {
  return new Promise(resolve => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
    req.onsuccess = () => {
      const db = req.result, tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(val, key);
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); resolve(); };
    };
    req.onerror = () => resolve();
  });
}
function todayKey() {
  const d = new Date(), p = n => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}
self.addEventListener('periodicsync', e => {
  if (e.tag === 'evening-check') e.waitUntil(checkEvening());
});
async function checkEvening() {
  if (new Date().getHours() < 19) return;
  const status = await idbGet('status');
  if (!status?.remind) return;
  const k = todayKey();
  if (status.date === k && status.complete) return;
  if (await idbGet('lastNotif') === k) return;
  await self.registration.showNotification('Mon cadre', {
    body: 'Un moment pour noter tes habitudes du jour : eau, pas, respiration…',
    icon: 'icons/icon-192.png', tag: 'evening-reminder'
  });
  await idbSet('lastNotif', k);
}
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: 'window' }).then(list => (list.find(c => 'focus' in c) || {}).focus?.() || clients.openWindow('./')));
});
