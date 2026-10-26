// Service worker: permite abrir o app sem internet.
// Estratégia "rede primeiro": sempre tenta a versão mais nova e cai no cache
// se estiver offline. Cotações (brapi.dev) nunca são guardadas aqui.
const CACHE = 'carteira-v2';
const ARQUIVOS = [
  './', 'index.html', 'css/styles.css', 'manifest.webmanifest', 'icons/icone.svg',
  'js/app.js', 'js/core/classes.js', 'js/core/glossario.js', 'js/core/money.js', 'js/core/portfolio.js',
  'js/core/tax.js', 'js/core/benchmark.js', 'js/data/indices.js', 'js/views/comparar.js', 'js/core/validacao.js', 'js/data/cotacoes.js', 'js/data/demo.js', 'js/data/store.js',
  'js/ui/dom.js', 'js/ui/graficos.js', 'js/views/aprender.js', 'js/views/ativo.js', 'js/views/carteira.js',
  'js/views/config.js', 'js/views/formularios.js', 'js/views/ir.js', 'js/views/lancamentos.js',
  'js/views/painel.js', 'js/views/proventos.js',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.hostname === 'brapi.dev' || url.hostname === 'api.bcb.gov.br') return;
  e.respondWith(
    fetch(e.request)
      .then((r) => {
        if (r.ok && (url.origin === location.origin || url.hostname === 'cdnjs.cloudflare.com')) {
          const copia = r.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copia));
        }
        return r;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match('index.html'))),
  );
});
