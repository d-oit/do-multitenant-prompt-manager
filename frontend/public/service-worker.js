const STATIC_CACHE = "prompt-manager-static-v1";
const RUNTIME_CACHE = "prompt-manager-runtime-v1";
const OFFLINE_URLS = ["/", "/index.html", "/manifest.webmanifest", "/vite.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(OFFLINE_URLS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== STATIC_CACHE && key !== RUNTIME_CACHE) {
            return caches.delete(key);
          }
          return undefined;
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cache = await caches.open(STATIC_CACHE);
        const cached = await cache.match("/index.html");
        return cached ?? Response.error();
      })
    );
    return;
  }

  if (requestUrl.origin === self.location.origin && requestUrl.pathname.startsWith("/prompts")) {
    event.respondWith(staleWhileRevalidate(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(event.request, responseClone).catch(() => {});
          });
          return response;
        })
        .catch(() => cachedResponse);
    })
  );
});

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);

  const networkFetch = fetch(request)
    .then((response) => {
      const clone = response.clone();
      cache.put(request, clone).catch(() => {});
      return response;
    })
    .catch(() => cached);

  if (cached) {
    networkFetch.catch(() => {});
    return cached;
  }

  return networkFetch;
}
