// 오프라인 실행용 서비스 워커.
// 저장해 둔 파일로 바로 열고, 뒤에서 최신 파일을 받아 다음 실행 때 반영한다.
// ⚠️ 파일 목록을 바꾸면 VERSION 숫자를 올릴 것.
const VERSION = "v1";
const CACHE = `todaycolor-${VERSION}`;
const FILES = [
  "./",
  "index.html",
  "styles.css",
  "app.js",
  "logic.js",
  "data/StyleData.json",
  "manifest.webmanifest",
  "icons/icon-180.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || new URL(request.url).origin !== location.origin) return;
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(request, { ignoreSearch: true });
      const fresh = fetch(request)
        .then((res) => {
          if (res.ok) cache.put(request, res.clone());
          return res;
        })
        .catch(() => cached);
      return cached || fresh;
    }),
  );
});
