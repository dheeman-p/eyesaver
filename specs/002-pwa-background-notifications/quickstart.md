# Quickstart: PWA with Background Notifications

**Feature**: `002-pwa-background-notifications`
**Date**: 2026-05-28
**Stack**: Vue 3 + Pinia + TypeScript + Vuetify 3 + Vite + vite-plugin-pwa + Workbox

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 20.x LTS | `node --version` to verify |
| npm | 10.x | Bundled with Node 20 |
| Chrome / Edge | 80+ | For full background sync support |

> **Firefox / Safari** also work but only support foreground-only reminders (no Periodic Background Sync).

---

## New Dependency

```bash
# Install vite-plugin-pwa (Workbox is a peer dep, auto-resolved by npm)
npm install --save-dev vite-plugin-pwa
```

No other new dependencies. Workbox is brought in transitively by `vite-plugin-pwa`.

---

## Build Commands

```bash
# Build the Chrome extension (unchanged)
npm run build             # outputs to dist/

# Build the PWA
npm run build:pwa         # outputs to dist-pwa/
```

The `build:pwa` script in `package.json`:
```json
"scripts": {
  "build:pwa": "vue-tsc --noEmit && vite build --config vite.config.pwa.ts"
}
```

---

## Local Development & Testing

### Option 1: Vite Dev Server (recommended for UI work)

```bash
npm run dev:pwa
```

This starts the Vite dev server pointing at `src/pwa/index.html`. Hot-reload works for Vue components. The service worker is registered in development mode (Workbox dev SW).

Add to `package.json`:
```json
"dev:pwa": "vite --config vite.config.pwa.ts"
```

### Option 2: Production Preview (for testing notifications + install prompt)

The PWA install prompt and Periodic Background Sync require a **production build served over HTTPS** (or localhost). Use `vite preview`:

```bash
npm run build:pwa
npm run preview:pwa       # serves dist-pwa/ on https://localhost:4173
```

Add to `package.json`:
```json
"preview:pwa": "vite preview --config vite.config.pwa.ts"
```

> Chrome/Edge allow `localhost` as a trusted origin for PWA install prompts without a real TLS certificate.

---

## Testing the PWA Manually

### 1. Install the PWA

1. Run `npm run build:pwa && npm run preview:pwa`
2. Open `http://localhost:4173` in Chrome
3. Click the install icon in the address bar (or use the in-app install prompt)
4. Verify the app opens in a standalone window (no address bar)

### 2. Test Notification Permission Flow

1. Open the PWA fresh (clear site data if needed: DevTools → Application → Clear storage)
2. Verify the notification permission prompt appears before any reminder is scheduled
3. **Deny** permission → verify the in-app "Reminders blocked" banner appears
4. Re-enable notifications in Chrome settings → verify banner disappears on next open

### 3. Test Foreground Notifications

1. Set the interval to its minimum (15 minutes) via the settings panel
2. Verify the countdown timer starts immediately
3. Wait for (or manually set) the `nextFireAt` IndexedDB value to be overdue:
   - Open DevTools → Application → IndexedDB → `eyesaver-pwa` → `state`
   - Change `nextFireAt` to `Date.now() - 1000` (past timestamp)
   - Trigger the SW check: close and reopen the app tab
4. Verify a notification appears with "Snooze" and "Dismiss" actions

### 4. Test Background Notifications (Chrome/Edge desktop)

1. Ensure "Continue running background apps when Chrome is closed" is enabled in Chrome settings
2. Build and serve the production PWA (`preview:pwa`)
3. Install the PWA, configure a short interval, then close all Chrome windows
4. Open DevTools → Application → Service Workers and verify the SW is registered
5. To force a Periodic Background Sync (without waiting): DevTools → Application → Background Sync → trigger manually
6. Verify a notification fires on the desktop

### 5. Test Snooze

1. Trigger a notification (step 3 above)
2. Click "Snooze" on the notification
3. Verify the notification closes
4. Verify a new notification appears after the configured snooze duration
5. Confirm no app window was required

### 6. Test Offline

1. Build and install the PWA
2. Open Chrome DevTools → Network → set to "Offline"
3. Close and reopen the PWA
4. Verify the app loads fully and all exercises are visible

---

## Deployment

The `dist-pwa/` folder is a complete static web app. Deploy it to any static HTTPS host:

```bash
# GitHub Pages
npm run build:pwa
# Push dist-pwa/ to gh-pages branch, or use GitHub Actions

# Netlify
netlify deploy --dir=dist-pwa --prod

# Vercel
vercel dist-pwa --prod
```

> HTTPS is required for the PWA install prompt and service worker registration.

---

## Checklist Before Deploying

- [ ] `npm run build:pwa` succeeds with no TypeScript errors
- [ ] App installs from `https://` URL in Chrome and Edge
- [ ] Notification permission prompt appears on first launch
- [ ] Foreground reminders fire at the correct interval
- [ ] Snooze fires after the configured duration without opening the app
- [ ] Dismiss resets the timer to the full interval
- [ ] App loads fully offline after one visit
- [ ] "Update available" banner appears when a new build is deployed (test by deploying twice)
- [ ] Chrome extension `npm run build` still succeeds and `dist/` is unchanged
