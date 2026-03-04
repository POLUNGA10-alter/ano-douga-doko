/// <reference lib="webworker" />

/**
 * Service Worker for "あの動画どこ？"
 * - Share Target API 対応
 * - 基本的なキャッシュ戦略（Network First）
 */

const SW_VERSION = "v1";
const CACHE_NAME = `ano-douga-doko-${SW_VERSION}`;

// インストール時：即座にactivateへ
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

// アクティベート時：旧キャッシュ削除
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch イベント：Network First 戦略
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Share Target: /share へのGETリクエストはそのまま通す
  if (new URL(request.url).pathname === "/share") {
    return; // デフォルトのネットワークリクエスト
  }

  // API リクエストはキャッシュしない
  if (request.url.includes("/api/")) {
    return;
  }

  // その他の静的アセット: Network First
  if (request.method === "GET") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // 成功したらキャッシュに保存
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone);
            });
          }
          return response;
        })
        .catch(() => {
          // オフライン時はキャッシュから返す
          return caches.match(request);
        })
    );
  }
});
