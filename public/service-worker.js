// Service Worker for Shuffle & Sync
// Provides offline support and advanced caching strategies
/* eslint-env serviceworker */
/* eslint-disable no-restricted-globals */

const CACHE_NAME = "shuffle-sync-v1";
const RUNTIME_CACHE = "shuffle-sync-runtime";

// Assets to cache on install
const PRECACHE_URLS = ["/", "/offline.html"];

// Install event - cache essential assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(self.skipWaiting()),
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE];
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return cacheNames.filter(
          (cacheName) => !currentCaches.includes(cacheName),
        );
      })
      .then((cachesToDelete) => {
        return Promise.all(
          cachesToDelete.map((cacheToDelete) => {
            return caches.delete(cacheToDelete);
          }),
        );
      })
      .then(() => self.clients.claim()),
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  // Skip cross-origin requests
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches
        .match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          return caches.open(RUNTIME_CACHE).then((cache) => {
            return fetch(event.request).then((response) => {
              // Cache successful GET requests
              if (event.request.method === "GET" && response.status === 200) {
                cache.put(event.request, response.clone());
              }
              return response;
            });
          });
        })
        .catch(() => {
          // Return offline page for navigation requests
          if (event.request.mode === "navigate") {
            return caches.match("/offline.html");
          }
        }),
    );
  }
});

// Message event - handle cache updates
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
