// 更新がすぐ届くよう「ネットワーク優先・失敗したらキャッシュ」で配信する
// （index.html は各ファイルに ?v=版番号 を付けて読み込むので、古い版と混ざらない）
const CACHE_NAME = 'nazo-no-doukutsu-v4';
const ASSETS = ['./', './index.html', './style.css', './art.js', './audio.js', './game.js', './chat.js', './csp.js', './manifest.json', './icon.svg'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(
    // ブラウザの一時保存を使わず、毎回サーバーに最新か確かめる
    fetch(event.request, { cache: 'no-cache' }).then(res => {
      if (res && res.status === 200) {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(event.request, copy));
      }
      return res;
    }).catch(() => caches.match(event.request))
  );
});
