# Deployment and operations

## Chrome extension

### Build

```bash
npm run build
```

This runs `vue-tsc --noEmit` and then the Vite extension build, producing `dist/`.

### Load locally

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select `dist/`.

### Package for the Chrome Web Store

Zip the **contents** of `dist/` (not the `dist/` folder itself) and upload the zip in
the Chrome Web Store developer dashboard.

There is no automated store-deploy pipeline in this repository; publishing is manual.

## PWA

### Build

```bash
npm run build:pwa
```

This produces a static site in `dist-pwa/`. Serve `dist-pwa/` from any HTTPS-capable
static host.

### Local preview

```bash
npm run preview:pwa
```

The expected URL is `http://localhost:4173/eyesaver/` (use the exact URL Vite prints).
Chrome/Edge treat `localhost` as a secure context, so install and service worker
features work locally without TLS.

### HTTPS requirement

In production the PWA must be served over HTTPS. Service workers, install prompts, and
web notifications all require a secure context.

## Base path and root-absolute URLs

`vite.config.pwa.ts` configures the app for the base path `/eyesaver/`:

- `base: '/eyesaver/'`
- `manifest.start_url: '/eyesaver/'`
- `manifest.scope: '/eyesaver/'`
- icon URLs: `/eyesaver/icons/icon-192.png` and `/eyesaver/icons/icon-512.png`

This matches GitHub Pages project sites (`https://<owner>.github.io/eyesaver/`).

### Known caveat

Two runtime URLs are **root-absolute** rather than base-aware:

1. The PWA notification icon in `src/pwa/service-worker.ts` (`showReminder`) and
   `src/pwa/App.vue` (`fireReminder`): `/icons/icon-192.png`.
2. The notification-click URL built in `src/pwa/service-worker.ts` lines 180–183:
   `/?exercise=<index>`.

When served under `/eyesaver/`, those should be `/eyesaver/icons/icon-192.png` and
`/eyesaver/?exercise=<index>` respectively. On the current GitHub Pages setup they may
resolve incorrectly at the domain root. If you host the PWA at a domain root, change
`base`, `scope`, `start_url`, and the icon paths in `vite.config.pwa.ts`, and update the
two runtime URLs above.

## GitHub Pages automation

`.github/workflows/deploy.yml` runs on:

- push to `main`, and
- manual `workflow_dispatch`.

Steps:

1. Checkout the repository.
2. Set up Node.js 20 with npm caching.
3. `npm ci`.
4. `npm run build:pwa` (which type-checks and builds `dist-pwa/`).
5. Upload `dist-pwa/` as a GitHub Pages artifact.
6. Deploy via `actions/deploy-pages`.

Requirements and notes:

- The repository's GitHub Pages source must be set to **GitHub Actions**.
- The workflow does **not** run `npm test`; run tests locally before merging.
- The workflow builds only the PWA, not the Chrome extension.

## Static host alternatives

`dist-pwa/` is a plain static site, so any static host works. The key change is the
base path:

| Host | Typical base path change |
|------|--------------------------|
| GitHub Pages project site | keep `/eyesaver/` (current config) |
| GitHub Pages user site / root domain | change base to `/`, update `start_url`, `scope`, icons |
| Netlify / Vercel root domain | change base to `/`, update `start_url`, `scope`, icons |

If you change the base path, remember the runtime root-absolute URLs described above.

## Runtime configuration

- There are **no environment variables**.
- There is no server-side runtime; the PWA is static and the extension runs entirely
  client-side in the browser.
- The only deployment-facing configuration is in:
  - `vite.config.pwa.ts` (base, scope, manifest, icons, PWA options), and
  - `.github/workflows/deploy.yml` (Node version, build command, Pages deployment).

All user-facing runtime settings are stored locally in the browser
(`chrome.storage.local` for the extension, IndexedDB for the PWA).
