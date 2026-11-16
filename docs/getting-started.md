# Getting started

This guide takes you from a clean checkout to a running extension and a running PWA.

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 20.x LTS (recommended) | CI pins Node 20. The project has no `engines` field, but Vitest 4 requires Node `^20.0.0 || ^22.0.0 || >=24.0.0`, so Node 20 LTS matches both CI and the test runner. |
| npm | 10.x | Bundled with Node 20. |
| Chrome or Edge | recent stable | Required to load the extension. Chrome 88+ has full Manifest V3 support. |
| Chrome or Edge | 80+ (desktop) | Required for **background** PWA notifications via Periodic Background Sync. |

Firefox and Safari can run the PWA in the foreground only (no Periodic Background
Sync); they cannot load the Chrome extension.

## Install

Run from the repository root:

```bash
npm install
```

If you are reproducing a clean, lockfile-based build (for example in CI), use:

```bash
npm ci
```

Both commands install the dependencies declared in `package.json`/`package-lock.json`.
There is no postinstall step and no generated code.

## Configuration and environment variables

There are **no environment variables** used anywhere in the application code. A search
for `import.meta.env` and `process.env` returns no matches.

- Runtime settings (reminder interval, snooze duration, enable/disable) are changed in
  the app UI and persisted locally — see [Data model](data-model.md).
- `.env*` is listed in `.gitignore`, but the app never reads `.env` files.

## Run the Chrome extension

### Development mode

```bash
npm run dev
```

`npm run dev` runs Vite in watch mode using `vite.config.ts` and
`vite-plugin-web-extension`; it emits the built extension into `dist/`. By default the
plugin also tries to **launch Chrome/Chromium and auto-install the extension**
(`disableAutoLaunch` defaults to `false`). That requires Chrome/Chromium to be
installed, or `CHROME_PATH` to point at an executable.

If you prefer not to auto-launch (or you are in a headless environment), use
`npm run build` and load `dist/` manually:

1. Open `chrome://extensions`.
2. Enable **Developer mode** (top-right toggle).
3. Click **Load unpacked** and select the `dist/` directory.
4. Click the EyeSaver icon in the toolbar to open the popup.

Reloading after changes:

- **Popup UI changes** hot-reload automatically via Vite HMR.
- **Service worker changes** require you to click the refresh icon on the EyeSaver card
  in `chrome://extensions`.

### Production build

```bash
npm run build
```

`npm run build` runs `vue-tsc --noEmit` (type check) and then `vite build`, producing
`dist/`. Load `dist/` as an unpacked extension exactly as above, or zip it for the
Chrome Web Store (see [Deployment](deployment.md)).

## Run the PWA

The PWA is built for the base path `/eyesaver/`, so local URLs include `/eyesaver/`.
Always use the exact URL Vite prints when it starts.

### Development mode (UI work)

```bash
npm run dev:pwa
```

Vite prints the local URL; it is expected to be:

```text
http://localhost:5173/eyesaver/
```

If the printed port differs, use the printed URL.

### Production build and preview

```bash
npm run build:pwa
npm run preview:pwa
```

`npm run build:pwa` runs `vue-tsc --noEmit` and then `vite build --config
vite.config.pwa.ts`, producing `dist-pwa/`. `npm run preview:pwa` serves that build
locally; the expected URL is:

```text
http://localhost:4173/eyesaver/
```

Use the exact URL printed by Vite.

> `localhost` is treated as a secure context by Chrome/Edge, so the install prompt and
> service worker work without a real TLS certificate during local development.

## Run the tests

Single run:

```bash
npm test
```

Watch mode:

```bash
npm run test:watch
```

The test suite currently contains one spec, `src/popup/components/__tests__/CountdownTimer.spec.ts`.
See [Development guide](development-guide.md#testing-approach) for how it works and
what is still validated manually.

## Type check

Both build commands already type-check the project as their first step:

```bash
npm run build       # vue-tsc --noEmit && vite build
npm run build:pwa   # vue-tsc --noEmit && vite build --config vite.config.pwa.ts
```

There is no standalone `typecheck` script; the build commands are the canonical way to
verify types.

> **Low-memory environments:** `vue-tsc`/Vite can hit Node's default heap limit on
> memory-constrained machines and exit with `JavaScript heap out of memory`. If that
> happens, rerun the same command with a larger heap, e.g.
> `NODE_OPTIONS=--max-old-space-size=4096 npm run build`.

## Verified-from-clean-checkout checklist

The following steps were run from a clean checkout (no `node_modules`, no `dist/`, no
`dist-pwa/`):

1. `npm ci` — installs from the lockfile.
2. `npm test` — runs the Vitest suite.
3. `npm run build` — type-checks and builds the extension into `dist/`.
4. `npm run build:pwa` — type-checks and builds the PWA into `dist-pwa/`.
5. Start `npm run dev:pwa` and `npm run preview:pwa` to confirm the printed URLs, then
   stop the servers.

On a memory-constrained machine, steps 3–4 may need the `NODE_OPTIONS` heap flag from
the note above.

If a step fails in your environment, re-run the individual command to see the error; the
commands above are the source of truth from `package.json`.
