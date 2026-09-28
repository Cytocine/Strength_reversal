/* Stock 30m Trend Terminal — service worker
 * - App shell is precached so the app opens instantly and offline.
 * - Same-origin files and fonts: stale-while-revalidate.
 * - Alpaca market data is NEVER cached (always live network).
 * Bump CACHE_VERSION whenever you deploy changed files.
 */
const CACHE_VERSION = 'v1';
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
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('trend-terminal-') && k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function staleWhileRevalidate(request, cacheKey) {
  return caches.open(CACHE_NAME).then((cache) =>
    cache.match(cacheKey || request).then((cached) => {
      const network = fetch(request).then((response) => {
        if (response && (response.ok || response.type === 'opaque')) {
          cache.put(cacheKey || request, response.clone());
        }
        return response;
      }).catch(() => cached);
      return cached || network;
    })
  );
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Live market data: always go to the network, never cache.
  if (url.hostname.endsWith('alpaca.markets')) return;

  if (url.origin === self.location.origin) {
    // Page loads: serve the cached shell (works offline), refresh in background.
    if (request.mode === 'navigate') {
      event.respondWith(staleWhileRevalidate(new Request('./index.html'), './index.html'));
      return;
    }
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Google Fonts (stylesheet + font files)
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(staleWhileRevalidate(request));
  }
});
