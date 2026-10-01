const CACHE = 'lua-de-mel-v6';
const ASSETS = ['./', './index.html', './manifest.json', './icon.svg', './icon-192.png', './icon-512.png',
  './css/app.css?v=6', './js/app.js?v=6', './js/utils.js?v=6', './js/data.js?v=6', './js/store.js?v=6', './js/weather.js?v=6'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

// Rede primeiro (pega atualizações); cache quando estiver offline.
// A previsão do tempo e o Firestore cuidam do próprio cache, então não passam por aqui.
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || /firestore\.googleapis\.com|api\.open-meteo\.com/.test(url.host)) return;
  // Arquivos do próprio app: revalida sempre, para nunca misturar versão nova com antiga.
  const req = url.origin === location.origin ? new Request(e.request, {cache: 'no-cache'}) : e.request;
  e.respondWith(fetch(req).then(res => {
    if (res && res.status === 200 && (res.type === 'basic' || res.type === 'cors')) {
      const clone = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, clone));
    }
    return res;
  }).catch(() => caches.match(e.request).then(r => r || (e.request.mode === 'navigate' ? caches.match('./index.html') : undefined))));
});
