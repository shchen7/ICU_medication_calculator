// sw.js
const CACHE = 'icu-cache-v5';
const CORE = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener('activate', e=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e=>{
  const req = e.request;
  e.respondWith(
    caches.match(req).then(r=> r || fetch(req).then(res=>{
      // 動態緩存同源 GET（可省略）
      if (req.method==='GET' && new URL(req.url).origin===location.origin) {
        const copy = res.clone();
        caches.open(CACHE).then(c=>c.put(req, copy));
      }
      return res;
    }).catch(()=>caches.match('./index.html')))
  );
});
