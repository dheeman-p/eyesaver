# Interfaces

EyeSaver exposes **no HTTP/REST endpoints** and makes no external API calls at runtime.
(The only network activity is the browser loading the app's own static assets, which
the PWA service worker also precaches for offline use.) This page documents the
internal contracts that connect the UI, the service workers, and the storage layers of
each target.

## Chrome extension interfaces

The extension's public surface is its Manifest V3 declaration, the `chrome.storage`
keys, `chrome.alarms` names, and the `chrome.notifications` ID/button.

### Manifest entry points and permissions

File: `src/manifest.json`.

| Item | Value |
|------|-------|
| `manifest_version` | `3` |
| `action.default_popup` | `src/popup/index.html` |
| `background.service_worker` | `src/background/service-worker.ts` (type `module`) |
| `permissions` | `notifications`, `storage`, `alarms` |
| `host_permissions` | none (`[]`) |

The build pipeline (`vite-plugin-web-extension`) transforms these source paths into the
bundled files under `dist/`.

### Storage keys

Both keys are declared in `src/shared/constants/index.ts` (lines 7–8). Shapes are
defined in `src/shared/types/index.ts`; see [Data model](data-model.md) for the full
field tables.

| Key | Type |
|-----|------|
| `eyesaver_settings` | `UserSettings` |
| `eyesaver_state` | `ReminderState` |

Contract: the popup writes whole objects via `useStorage.set`; the service worker
writes whole `ReminderState` objects (or patches merged into the current value) via
its `setState` helper. Every change to `eyesaver_settings` is observed by the worker
through `chrome.storage.onChanged`.

### `chrome.alarms` names

Defined in `src/shared/constants/index.ts` (lines 3–4):

| Name | Purpose |
|------|---------|
| `eyesaver-reminder` | Main reminder interval alarm |
| `eyesaver-snooze` | One-shot snooze alarm |

The worker creates these alarms with `delayInMinutes` taken from the current settings.

### `chrome.notifications` contract

Defined in `src/shared/constants/index.ts` (line 5) and used in
`src/background/service-worker.ts` (`showExerciseNotification`, lines 75–92).

| Property | Value |
|----------|-------|
| Notification ID | `eyesaver-active` |
| Type | `basic` |
| Title | current exercise `name` |
| Message | current exercise `description` |
| Buttons | one button, index 0, title `Snooze` |
| `requireInteraction` | `false` |

The notification button handler only reacts to `notificationId === 'eyesaver-active'`
and `buttonIndex === 0` (service worker lines 177–189). The close handler only reacts
to `notificationId === 'eyesaver-active'` and `byUser === true` (lines 193–211).

### `chrome.storage.onChanged` contract (popup → worker)

File: `src/background/service-worker.ts` lines 215–252.

The worker listens for changes to `eyesaver_settings` in the `local` area and reacts:

| Change | Worker response |
|--------|-----------------|
| `enabled` true → false | clear all alarms, clear notification, set `activeNotificationId = null` |
| `enabled` false → true | clear main alarm, create fresh main alarm, reset `cycleStartedAt` |
| `intervalMinutes` changed while enabled | clear main alarm, recreate with new delay, reset `cycleStartedAt` |

## PWA interfaces

The PWA contract spans the service worker lifecycle events, notification data, a deep
link query parameter, the IndexedDB schema, and the VitePWA registration options.

### Service worker events

File: `src/pwa/service-worker.ts`.

| Event | Behaviour |
|-------|-----------|
| `install` | `self.skipWaiting()` so updates activate immediately (lines 121–123) |
| `activate` | clean old caches, `clients.claim()`, then `checkAndFire()` (lines 139–154) |
| `message` | accepts `{ type: 'SKIP_WAITING' }` and calls `skipWaiting()` (lines 125–129) |
| `periodicsync` | if `event.tag === 'eyesaver-reminder'`, run `checkAndFire()` (lines 132–136) |
| `notificationclick` | snooze / dismiss / open-window handling (lines 157–199) |

### Message contract

From the `useRegisterSW` helper (`virtual:pwa-register/vue`), the window may post:

```json
{ "type": "SKIP_WAITING" }
```

The service worker matches only that `type` (lines 125–129).

### Notification contract

Used by both the window (`src/pwa/App.vue` `fireReminder`, lines 92–109) and the
service worker (`showReminder`, lines 60–71):

| Property | Value |
|----------|-------|
| Title | current exercise `name` |
| Body | current exercise `steps[0]` |
| Icon | `/icons/icon-192.png` |
| Actions | `{ action: 'snooze', title: 'Snooze' }` and `{ action: 'dismiss', title: 'Dismiss' }` |
| `data.exerciseIndex` | the exercise index the notification refers to |

### Notification-click contract

File: `src/pwa/service-worker.ts` lines 157–199.

| `event.action` | Handler writes |
|----------------|----------------|
| `snooze` | `state.snoozedUntil = now + snoozeDurationMinutes`, `state.notificationActive = false` |
| `dismiss` | `state.nextFireAt = now + intervalMinutes`, `state.notificationActive = false`, `state.snoozedUntil = null` |
| (default, none) | open/focus a window at `/?exercise=<exerciseIndex>` |

### Deep-link query parameter

- Producer: the service worker's default notification-click URL
  (`/?exercise=<index>`, lines 180–183).
- Consumer: `src/pwa/App.vue` `initApp` reads `?exercise=N` and sets the current
  exercise index (lines 130–138).

> Gotcha: this URL is root-absolute (`/?exercise=...`) while the app is configured with
> `base: '/eyesaver/'`. See [Deployment](deployment.md#base-path-and-root-absolute-urls).

### IndexedDB schema

Cross-referenced from [Data model](data-model.md):

- Database `eyesaver-pwa`, version `1`.
- Object stores `settings` and `state`, both `keyPath: 'key'`.
- Record shape `{ key, value }`.
- Implemented in `src/pwa/composables/useIDBStorage.ts` and duplicated in
  `src/pwa/service-worker.ts` lines 13–56.

### PWA registration contract

File: `vite.config.pwa.ts` (lines 19–49).

| Option | Value | Meaning |
|--------|-------|---------|
| `strategies` | `injectManifest` | custom service worker file is the source |
| `srcDir` | `.` | service worker source directory |
| `filename` | `service-worker.ts` | source file name |
| `registerType` | `prompt` | app controls the update prompt via `useRegisterSW` |
| `injectRegister` | `false` | no auto-registration snippet; the app registers via the virtual module |
| `manifest.start_url` | `/eyesaver/` | installed-app start URL |
| `manifest.scope` | `/eyesaver/` | install scope |

The app consumes `registerType: 'prompt'` through `useRegisterSW()` in
`src/pwa/App.vue` (lines 32–38).
