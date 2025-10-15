// Service Worker for do-multitenant-prompt-manager
const CACHE_NAME = "do-multitenant-prompt-manager-v1";
const RUNTIME_CACHE = "runtime-cache-v1";

// Assets to cache on install
const PRECACHE_URLS = ["/", "/index.html", "/manifest.json", "/icon-192.png", "/icon-512.png"];

// Install event - cache critical assets
self.addEventListener("install", (event) => {
  console.log("[SW] Install event");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[SW] Precaching assets");
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - cleanup old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activate event");
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
            })
            .map((cacheName) => {
              console.log("[SW] Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - network first with cache fallback
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // API requests - network first, cache fallback
  if (
    url.pathname.startsWith("/api") ||
    url.pathname.startsWith("/prompts") ||
    url.pathname.startsWith("/analytics") ||
    url.pathname.startsWith("/tenants")
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone the response before caching
          const responseToCache = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return offline page for navigation requests
            if (request.mode === "navigate") {
              return caches.match("/");
            }
            // Return error response
            return new Response("Offline", {
              status: 503,
              statusText: "Service Unavailable",
              headers: new Headers({
                "Content-Type": "text/plain"
              })
            });
          });
        })
    );
    return;
  }

  // Static assets - cache first, network fallback
  if (
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "image" ||
    request.destination === "font"
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Update cache in background
          fetch(request)
            .then((response) => {
              caches.open(RUNTIME_CACHE).then((cache) => {
                cache.put(request, response);
              });
            })
            .catch(() => {});
          return cachedResponse;
        }
        // Not in cache, fetch from network
        return fetch(request).then((response) => {
          const responseToCache = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
          return response;
        });
      })
    );
    return;
  }

  // Default: network first
  event.respondWith(
    fetch(request)
      .then((response) => {
        const responseToCache = response.clone();
        caches.open(RUNTIME_CACHE).then((cache) => {
          cache.put(request, responseToCache);
        });
        return response;
      })
      .catch(() => {
        return caches.match(request).then((cachedResponse) => {
          return cachedResponse || caches.match("/");
        });
      })
  );
});

// Background sync for offline form submissions
self.addEventListener("sync", (event) => {
  console.log("[SW] Background sync:", event.tag);
  if (event.tag === "sync-prompts") {
    event.waitUntil(syncPrompts());
  }
});

async function syncPrompts() {
  // Get pending changes from IndexedDB
  // This would be implemented based on your sync requirements
  console.log("[SW] Syncing prompts...");
}

// Push notifications
self.addEventListener("push", (event) => {
  console.log("[SW] Push notification received:", event);

  const data = event.data ? event.data.json() : {};
  const title = data.title || "d.o. Prompt Manager";
  const options = {
    body: data.body || "You have a new notification",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: data.url || "/"
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked:", event);
  event.notification.close();

  event.waitUntil(clients.openWindow(event.notification.data));
});

// Message handler for communication with app
self.addEventListener("message", (event) => {
  console.log("[SW] Message received:", event.data);

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data && event.data.type === "CLEAR_CACHE") {
    event.waitUntil(
      caches
        .keys()
        .then((cacheNames) => {
          return Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
        })
        .then(() => {
          event.ports[0].postMessage({ success: true });
        })
    );
  }
});
