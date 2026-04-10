const C = 'scout-v7';
const ASSETS = ['/', '/index.html', '/app.js', '/manifest.json', '/icon-192.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks =>
    Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const url = e.request.url;
  if (url.includes('api-sports.io') || url.includes('odds-api.com') || url.includes('fonts.g')) {
    e.respondWith(fetch(e.request).catch(() => new Response('', { status: 503 })));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(c => c || fetch(e.request).then(r => {
      const cl = r.clone();
      caches.open(C).then(c2 => c2.put(e.request, cl));
      return r;
    }))
  );
});
