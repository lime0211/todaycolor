// 오프라인 실행용 서비스 워커.
// 저장해 둔 파일로 바로 열고, 뒤에서 최신 파일을 받아 둔다.
// ⚠️ 파일을 고쳐서 다시 올릴 때마다 VERSION을 올릴 것 — 이 숫자가 바뀌어야
//    열려 있는 앱이 새 버전을 감지하고 자동으로 새로고침한다 (app.js 참고).
const VERSION = "v3";
const CACHE = `todaycolor-${VERSION}`;
const FILES = [
  "./",
  "index.html",
  "styles.css",
  "app.js",
  "logic.js",
  "data/StyleData.json",
  "data/Zodiac.json",
  "manifest.webmanifest",
  "icons/icon-180.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  // cache: "reload" — 브라우저의 HTTP 캐시(GitHub Pages는 10분)를 건너뛰고 서버에서 새로 받는다
  const requests = FILES.map((f) => new Request(f, { cache: "reload" }));
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(requests)).then(() => self.skipWaiting()));
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
