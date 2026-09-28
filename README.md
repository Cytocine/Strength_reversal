# Stock 30m Trend Terminal — PWA

Installable, offline-capable version of the terminal.

## Files
- `index.html` – the app (chart library is bundled locally so it works offline)
- `manifest.webmanifest` – name, colors, icons
- `sw.js` – service worker (caches the app shell; Alpaca data is never cached)
- `lightweight-charts.standalone.production.js` – TradingView Lightweight Charts 4.1.3
- `icons/` – app icons (any + maskable), iOS touch icon, favicon

## Run / deploy
A PWA must be served over **HTTPS** (or `localhost`). Opening `index.html` from disk works as a normal page but will not install or cache.

**Quick local test**
```
cd trend-terminal-pwa
python3 -m http.server 8080
# open http://localhost:8080
```

**Host it (any static host)** — GitHub Pages, Netlify, Cloudflare Pages, Vercel: upload the whole folder as-is. It works from a sub-path (all URLs are relative).

## Install
- **Android / Chrome / Edge (desktop):** tap the **Install** button in the header (or the browser's install icon).
- **iPhone / iPad:** open in Safari → Share → **Add to Home Screen** (the Install button shows these steps).

## Updating
After changing any file, bump `CACHE_VERSION` in `sw.js` (e.g. `v2`) and redeploy. Installed apps pick up the new version the next time they are opened.

## Notes
- Alpaca API keys stay in the device's `localStorage`; nothing is sent anywhere except `data.alpaca.markets`.
- Offline: the app shell opens, the header badge shows OFFLINE, and data reloads automatically when you're back online.
