// ============================================================================
//  Service Worker — PWA (cache básico offline) + recepção de Web Push.
// ============================================================================
const CACHE = 'cscb-escala-v3';
const ATIVOS = [
  './',
  './index.html',
  './css/styles.css',
  './js/app.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ATIVOS)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((chaves) => Promise.all(chaves.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// Estratégia: network-first para navegação, cache-first para o restante.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      const copia = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copia)).catch(() => {});
      return res;
    }).catch(() => hit))
  );
});

// ---- Web Push: exibe a notificação enviada pela Edge Function ----
self.addEventListener('push', (e) => {
  let dados = { title: '🎶 Escala da Música', body: 'Você tem um lembrete.', url: './' };
  try { if (e.data) dados = Object.assign(dados, e.data.json()); } catch (_) {}
  e.waitUntil(
    self.registration.showNotification(dados.title, {
      body: dados.body,
      icon: './icons/icon-192.png',
      badge: './icons/badge.png',
      tag: dados.tag || 'cscb-escala',
      data: { url: dados.url || './' },
      vibrate: [90, 40, 90],
    })
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const destino = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cl) => {
      for (const c of cl) if ('focus' in c) return c.focus();
      return self.clients.openWindow(destino);
    })
  );
});
