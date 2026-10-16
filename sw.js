// Service worker de Asistencia JTB.
// Estrategia: primero la red (para recibir siempre la versión más reciente),
// y si no hay internet, se usa la copia guardada para que la app abra igual.
const CACHE = 'asistencia-jtb-v1';
const BASICOS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASICOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  // Solo archivos de la propia app; Firebase y bibliotecas externas pasan directo
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res && res.ok) {
          const copia = res.clone();
          // Las páginas con ?nfc=... se guardan como la página principal
          const clave = req.mode === 'navigate' ? './index.html' : req;
          caches.open(CACHE).then(c => c.put(clave, copia));
        }
        return res;
      })
      .catch(() => caches.match(req.mode === 'navigate' ? './index.html' : req, { ignoreSearch: true }))
  );
});
