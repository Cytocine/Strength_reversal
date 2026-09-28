/* Stock 30m Trend Terminal — service worker */
const CACHE_VERSION = 'v2';
const CACHE_NAME = `trend-terminal-${CACHE_VERSION}`;

const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './lightweight-charts.standalone.production.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-192.png',
  './icons/maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Add files individually so a missing icon doesn't abort the entire install
      await Promise.allSettled(
        APP_SHELL.map((url) =>
          cache.add(url).catch((err) => console.warn(`[SW] Could not precache: ${url}`, err))
        )
      );
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith('trend-terminal-') && k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

function staleWhileRevalidate(request, fallbackKey) {
  return caches.open(CACHE_NAME).then((cache) =>
    cache.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && (response.ok || response.type === 'opaque')) {
            cache.put(request, response.clone());
          }
          return response;
        })
        .catch(() => cached);

      if (cached) return cached;
      if (fallbackKey) return cache.match(fallbackKey).then((fb) => fb || network);
      return network;
    })
  );
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Live market data: strictly network, never cache
  if (url.hostname.endsWith('alpaca.markets')) return;

  // Handle navigation requests (standalone launch / reload)
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html').then((cachedIndex) => {
        return (
          cachedIndex ||
          fetch(request).catch(() => caches.match('./') || caches.match('index.html'))
        );
      })
    );
    return;
  }

  // Same-origin static assets
  if (url.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Google Fonts
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(staleWhileRevalidate(request));
  }
});
