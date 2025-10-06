// --- Simple PWA Service Worker ---
// 版本字串只要改動就能強制使用者更新快取
const CACHE_NAME = 'icu-cache-v3';

const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  // 若你日後把 CSS/JS 拆檔，記得一併列入，例如：
  // './styles.css', './main.js',
  // 圖示可選擇快取，提高首次顯示速度
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// 安裝：預先快取核心檔案
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

// 啟用：清除舊版快取
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

// 讀取策略：Cache First + 背景更新（Stale-While-Revalidate）
self.addEventListener('fetch', (event) => {
  const req = event.request;
  // 只處理同源的 GET 請求
  const isGET = req.method === 'GET';
  const isSameOrigin = new URL(req.url).origin === self.location.origin;
  if (!isGET || !isSameOrigin) return;

  event.respondWith(
    caches.match(req).then(cached => {
      // 背景更新
      const fetchAndUpdate = fetch(req).then(res => {
        // 僅快取成功且同源的回應
        if (res && res.status === 200 && (res.type === 'basic' || res.type === 'default')) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
        }
        return res;
      }).catch(() => cached);

      // 有快取 → 先回舊，再背景更新；沒快取 → 走網路
      return cached || fetchAndUpdate;
    })
  );
});
