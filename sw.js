const C='scout-v10';
const A=['/','/index.html','/app.js','/manifest.json','/icon-192.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(A)));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',e=>{
  if(e.request.url.includes('api-sports.io')||e.request.url.includes('fonts.g')){
    e.respondWith(fetch(e.request).catch(()=>new Response('',{status:503})));return;}
  e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request).then(r=>{
    const cl=r.clone();caches.open(C).then(c2=>c2.put(e.request,cl));return r;})));
});