# Research: PWA with Background Notifications

**Feature**: `specs/002-pwa-background-notifications`
**Generated**: 2026-05-28 (Phase 0 — /speckit.plan)

---

## R-001 — Background Notification Architecture: What Actually Works Without a Server

### Finding

The spec's core promise — "notifications even when the browser is not open" — is achievable on **Chrome/Edge desktop**, but with important platform constraints that must be understood before implementation:

**How service workers are terminated**:
Service workers are terminated by the browser after ~30–40 seconds of inactivity. A plain `setTimeout` inside a service worker does NOT prevent termination, so you cannot rely on a single long-running timer in the service worker.

**What wakes a service worker up (without a push server)**:
| Event | Chrome/Edge Desktop | Firefox | Safari |
|-------|--------------------|---------|----|
| Page/tab open | ✅ | ✅ | ✅ |
| Periodic Background Sync | ✅ (Chrome 80+) | ❌ | ❌ |
| Background Fetch | ✅ (large downloads only) | ❌ | ❌ |
| Push API (needs server) | ✅ | ✅ | ✅ |

**Periodic Background Sync limitations**:
- Available in Chrome 80+ on Android and desktop
- Minimum period enforced by the browser based on the site's usage "engagement score" — ranges from ~12 hours (low engagement) to possibly shorter for frequently used PWAs
- **NOT suitable for precise 15–90 minute interval enforcement** — the browser decides when to fire it
- But it IS suitable as a **catch-up mechanism**: on each wake, check if a notification is overdue and fire it

**Desktop Chrome "Continue running background apps" setting**:
- Enabled by default on Windows Chrome/Edge
- When enabled: the browser process stays in the system tray after all windows are closed
- Service workers are eligible for Periodic Background Sync events while the browser process is alive
- This is the mechanism that makes background notifications work on desktop

**The result**: Background notifications (browser fully closed) are possible on Chrome/Edge desktop via Periodic Background Sync, but timing precision is ±minutes-to-hours, not ±seconds. The spec's NFR-002 ("within 5 minutes, subject to OS-level throttling") is accurate — it's the OS throttling that governs precision, not the app.

### Decision

**Architecture: Dual-layer scheduling**

1. **Foreground layer** (app/tab open): Vue app uses `setTimeout` for precise interval countdown. On expiry: show notification via SW registration, update `nextFireAt` in IndexedDB, reschedule.

2. **Background catch-up layer** (no window open, browser alive): Periodic Background Sync wakes the service worker → SW reads `nextFireAt` from IndexedDB → if overdue, fires notification immediately → writes updated `nextFireAt`.

3. **On app re-open after browser was closed**: SW `activate` event + app startup both check IndexedDB for overdue notifications. Any overdue notification fires immediately.

### Rationale

This is the only client-side-only architecture that satisfies FR-005 and FR-006 simultaneously. The app behaves best when a tab is open (precise), degrades gracefully to catch-up mode when the browser is alive but no tab is open, and recovers on next launch when the browser was fully closed.

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|-------------|
| Notification Triggers API (`showTrigger`) | Removed from Chrome in 2023 (origin trial ended); no production path |
| Web Alarms API | Non-standard; only in Firefox experimental builds |
| Push API + free tier (FCM) | Requires a server to send push messages — excluded by spec and scope |
| Single long `setTimeout` in service worker | SW terminated in ~30–40s; timer lost on termination |

---

## R-002 — vite-plugin-pwa: Integration with Existing Vite Setup

### Finding

`vite-plugin-pwa` is the standard Vite plugin for PWA functionality. It supports two strategies:

- **`generateSW`**: Workbox generates the entire service worker automatically — no custom SW code.
- **`injectManifest`**: You write a custom service worker; the plugin preprocesses it to inject the Workbox precache manifest. **This is the correct strategy** because the EyeSaver service worker needs custom notification scheduling logic beyond what Workbox generates.

**Dual build isolation**:
- Existing `vite.config.ts`: uses `vite-plugin-web-extension`, outputs to `dist/`. **Untouched.**
- New `vite.config.pwa.ts`: uses `vite-plugin-pwa`, outputs to `dist-pwa/`. Separate entry point at `src/pwa/index.html`.
- `package.json` gets a new `build:pwa` script: `vite build --config vite.config.pwa.ts`

**Key `vite-plugin-pwa` configuration**:
```ts
VitePWA({
  strategies: 'injectManifest',
  srcDir: 'src/pwa',
  filename: 'service-worker.ts',
  manifest: { name: 'EyeSaver', ... },
  injectRegister: 'auto',
  registerType: 'prompt',  // shows "Update available" banner (NFR-006)
})
```

`registerType: 'prompt'` means the new SW waits; the PWA plugin exposes `needRefresh` and `updateServiceWorker()` hooks that the Vue app uses to display the update banner. This satisfies NFR-006 without any manual SW lifecycle management.

### Decision

Use `vite-plugin-pwa` with `injectManifest` strategy in a separate `vite.config.pwa.ts`. Use `registerType: 'prompt'` for the update banner.

### Rationale

`injectManifest` is the only strategy that allows a custom service worker for the notification scheduling logic, while still getting automatic Workbox precaching for the offline requirement (FR-011, FR-012). `registerType: 'prompt'` maps exactly to the clarified update UX (Q2).

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|-------------|
| `generateSW` strategy | Cannot add custom notification scheduling code |
| Manual SW without `vite-plugin-pwa` | ~200 lines of boilerplate for manifest injection, SW registration, and Workbox setup — violates KISS |
| Merging PWA into existing `vite.config.ts` | Would require modifying `vite-plugin-web-extension` integration and risks breaking the extension build |

---

## R-003 — IndexedDB in Service Workers

### Finding

The IndexedDB API is fully available in service workers — `indexedDB` is a global in the SW context. Both the Vue app window and the service worker can read/write to the same origin's IndexedDB stores.

**Minimal async wrapper** (sufficient for this use case):
```ts
// ~60 lines — no library needed
async function openDB(): Promise<IDBDatabase> { ... }
async function getItem<T>(store: string, key: string): Promise<T | undefined> { ... }
async function setItem<T>(store: string, key: string, value: T): Promise<void> { ... }
```

The `idb` library (3KB) is the alternative but adds a dependency for functionality achievable in ~60 lines — rejected per KISS (Principle I).

### Decision

Write a minimal `useIDBStorage.ts` composable (~60 lines) that wraps IndexedDB open/get/set in Promises. Used by both the Vue app stores and the service worker (the SW imports it directly from the same source file via the Vite build).

### Rationale

60 lines of straightforward Promise wrappers is readable and self-evident — passes the "2-minute readability" rule from the constitution's Code Review section. The `idb` library's API surface (cursors, transactions, indices) is unnecessary overhead for the key-value access pattern this feature requires.

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|-------------|
| `idb` library | Adds a dependency for functionality achievable in ~60 lines (KISS violation) |
| `localStorage` | Not accessible in service workers |
| `CacheStorage` | For assets/responses only, not structured settings data |
| `chrome.storage.local` | Not available in PWA context (Chrome extension API) |

---

## R-004 — Notification Actions (Snooze / Dismiss) in Service Worker

### Finding

The Web Notifications API supports `actions` on notifications created via a service worker registration:
```ts
self.registration.showNotification('EyeSaver', {
  body: 'Time for your eye exercise',
  actions: [
    { action: 'snooze', title: 'Snooze' },
    { action: 'dismiss', title: 'Dismiss' }
  ],
  data: { exerciseIndex: 2 }
})
```

Action clicks are handled by the service worker's `notificationclick` event:
```ts
self.addEventListener('notificationclick', event => {
  event.notification.close()
  if (event.action === 'snooze') {
    // Write snoozedUntil to IndexedDB
  } else if (event.action === 'dismiss') {
    // Reset nextFireAt to now + intervalMinutes
  } else {
    // Default click: open/focus PWA window
  }
})
```

**Browser support for notification actions**:
- Chrome/Edge desktop: Full support ✅
- Chrome Android: Full support ✅
- Firefox: Actions supported ✅
- Safari macOS 14+: Limited action support (shows first action only) ⚠️ — acceptable fallback

### Decision

Show Snooze and Dismiss as notification actions created via `self.registration.showNotification()` in the service worker. Handle `notificationclick` in the service worker to update IndexedDB and reschedule.

### Rationale

This is the only way to handle notification actions without opening the app window, which is explicitly required by FR-007. Service worker `notificationclick` with IndexedDB write is the standard pattern.

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|-------------|
| In-app only snooze (open popup first) | Violates FR-007 |
| BroadcastChannel to app window | Only works if window is open; service worker must handle it independently |

---

## R-005 — Build Separation: Extension vs PWA

### Finding

The existing `vite.config.ts` uses `vite-plugin-web-extension` which reads `src/manifest.json` and produces a multi-entry Chrome extension build. This plugin and `vite-plugin-pwa` are mutually exclusive (both control the HTML entry and service worker generation).

**Approach**: Two completely separate Vite configs, two `npm run` scripts, two output directories:

```
npm run build       → vite build                        → dist/      (Chrome extension)
npm run build:pwa   → vite build --config vite.config.pwa.ts → dist-pwa/   (PWA)
```

The `.gitignore` file already ignores `dist/`. Add `dist-pwa/` to `.gitignore`.

**Shared code access**: Both configs share the same `src/shared/` directory via the existing `@shared` path alias (defined in `tsconfig.json`). The `vite.config.pwa.ts` will declare the same `resolve.alias` for `@shared`.

### Decision

New `vite.config.pwa.ts` with:
- `root: 'src/pwa'` (or input explicitly set to `src/pwa/index.html`)
- `build.outDir: '../../dist-pwa'` (relative to `src/pwa/`, resolves to repo root `dist-pwa/`)
- `resolve.alias: { '@shared': resolve(__dirname, 'src/shared'), '@pwa': resolve(__dirname, 'src/pwa') }`
- `plugins: [vue(), vuetify(), VitePWA({ ... })]` — no `webExtension()`

### Rationale

Zero risk to the extension build. Additive-only change. The two output directories can be deployed/used independently.

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|-------------|
| Single config producing both outputs | Would require patching `vite-plugin-web-extension` + `vite-plugin-pwa` interop — fragile |
| Same `dist/` folder for both | Extension and PWA asset sets would collide (both need `index.html`, `manifest.json`, `sw.js`) |
