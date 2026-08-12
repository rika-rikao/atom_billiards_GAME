const CACHE_NAME = 'fusion-billiards-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
  // 音声ファイルは外部URL(Cloudinary)なので、ここでは記述しなくてもブラウザが適宜キャッシュします
];

// 1. インストール時：初回用ファイルをキャッシュ ＋ 即座に有効化
self.addEventListener('install', event => {
  self.skipWaiting(); // 新しいSWを待機させずにすぐ適用
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

// 2. アクティブ化時：不要な古いキャッシュを自動削除
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim()) // ページの制御をすぐに奪取
  );
});

// 3. 通信時：Network First（ネットワーク優先）戦略
self.addEventListener('fetch', event => {
  // HTTP / HTTPS リクエスト以外はスキップ
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // ネットワーク通信に成功したら、最新のレスポンスでキャッシュを上書き
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // オフラインなどで通信失敗したときだけ、保存済みのキャッシュを返す
        return caches.match(event.request);
      })
  );
});
