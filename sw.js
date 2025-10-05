// --- Simple PWA Service Worker ---
// 換版本字串即可觸發更新
const CACHE_NAME = 'icu-cache-v1';

// 首次安裝：把關鍵檔案加到快取（路徑用相對路徑，支援 GitHub Pages 子路徑）
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json'
  // 若你的程式有外掛 JS/CSS 檔，記得加上，如：
  // './styles.css', './main.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

// 啟用新版本：清掉舊快取
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

// 讀取策略：Cache First，抓不到再走網路（離線可用）
self.addEventListener('fetch', (event) => {
  const req = event.request;
  // 只攔同源的 GET
  const isGET = req.method === 'GET';
  const isSameOrigin = new URL(req.url).origin === self.location.origin;
  if (!isGET || !isSameOrigin) return;

  event.respondWith(
    caches.match(req).then(cached => {
      // 背景更新（Stale-While-Revalidate）
      const fetchAndUpdate = fetch(req).then(res => {
        // 只快取成功的基本回應
        if (res && res.status === 200 && res.type === 'basic') {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, resClone));
        }
        return res;
      }).catch(() => cached); // 網路失敗則回舊快取（若有）

      // 有快取 → 先回舊的、同時背景更新；沒快取 → 走網路
      return cached || fetchAndUpdate;
    })
  );
});
