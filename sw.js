const CACHE = 'mm-v2';
const CORE = ['./', './index.html', './styles.css', './app.js', './manifest.json'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((r) => {
    if (r && r.ok && new URL(r.url).origin === location.origin) { const cp = r.clone(); caches.open(CACHE).then((cc) => cc.put(e.request, cp)); }
    return r;
  }).catch(() => caches.match('./index.html'))));
});
