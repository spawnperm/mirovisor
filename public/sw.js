/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Mirovisor Service Worker
 * Caches static assets (HTML, CSS, JS) and API responses for offline access and improved repeat-load performance.
 */

const CACHE_VERSION = 'v1.1.0';
const STATIC_CACHE_NAME = `mirovisor-static-${CACHE_VERSION}`;
const API_CACHE_NAME = `mirovisor-api-${CACHE_VERSION}`;

// Pre-cached shell assets
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/metadata.json',
];

// 1. Install Event: Pre-cache core application shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching application shell');
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[ServiceWorker] Precache partial error (ignored):', err);
      });
    })
  );
  // Force active state immediately without waiting for old worker to exit
  self.skipWaiting();
});

// 2. Activate Event: Clean up outdated caches
self.addEventListener('activate', (event) => {
  const allowedCaches = [STATIC_CACHE_NAME, API_CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!allowedCaches.includes(cacheName)) {
            console.log('[ServiceWorker] Removing legacy cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event: Routing & Caching Strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and WebSocket connections
  if (request.method !== 'GET' || url.protocol === 'ws:' || url.protocol === 'wss:') {
    return;
  }

  // A. API Requests (/api/*): Network-First with Cache Fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(API_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // Network failed: attempt to retrieve from offline cache
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            console.log('[ServiceWorker] Serving cached API response for offline:', url.pathname);
            return cachedResponse;
          }
          // Fallback offline mock response
          return new Response(
            JSON.stringify({
              error: 'Offline mode active',
              cached: true,
              timestamp: new Date().toISOString(),
            }),
            {
              headers: { 'Content-Type': 'application/json' },
              status: 200,
            }
          );
        })
    );
    return;
  }

  // B. Static Assets & App Shell: Stale-While-Revalidate Strategy
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            (networkResponse.type === 'basic' || networkResponse.type === 'cors')
          ) {
            const responseClone = networkResponse.clone();
            caches.open(STATIC_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch((err) => {
          // If offline and request is HTML document navigation, return cached /index.html
          if (request.mode === 'navigate') {
            return caches.match('/index.html') || caches.match('/');
          }
          throw err;
        });

      return cachedResponse || fetchPromise;
    })
  );
});
