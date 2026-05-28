# Tasks: PWA with Background Notifications

**Input**: Design documents from `specs/002-pwa-background-notifications/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/storage-schema.md ✅, quickstart.md ✅

**Tests**: NOT included — constitution Principle IV (no automated tests).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no shared in-progress dependencies)
- **[US#]**: Which user story this task belongs to
- Exact file paths are included in every description

---

## Phase 1: Setup

**Purpose**: Add the new dependency, create the PWA source tree and build config — no existing files modified except `package.json`, `tsconfig.json`, `.gitignore`.

- [x] T001 Install `vite-plugin-pwa` dev dependency (`npm install --save-dev vite-plugin-pwa`) and update `package.json` with `build:pwa`, `dev:pwa`, and `preview:pwa` scripts
- [x] T002 [P] Add `dist-pwa/` to `.gitignore`
- [x] T003 [P] Create `src/pwa/` directory tree: `src/pwa/index.html`, `src/pwa/main.ts`, `src/pwa/App.vue`, `src/pwa/service-worker.ts`, `src/pwa/composables/`, `src/pwa/stores/`; also create `src/shared/components/` directory (required by T035)
- [x] T004 Create `vite.config.pwa.ts` at repo root with `vite-plugin-pwa` (`injectManifest` strategy, `registerType: 'prompt'`), `resolve.alias` for `@shared` and `@pwa`, and `build.outDir: 'dist-pwa'`
- [x] T005 Add `@pwa` path alias to `tsconfig.json` (`src/pwa`)

**Checkpoint**: `npm run build:pwa` produces a `dist-pwa/` folder (may be empty shell). No extension build regression: `npm run build` still succeeds.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that every user story depends on — IndexedDB composable, shared type extensions, PWA app bootstrap. Must be complete before any user story work begins.

- [x] T035 Move `ExerciseCard.vue`, `CountdownTimer.vue`, and `SettingsPanel.vue` from `src/popup/components/` to `src/shared/components/`; update all import paths in `src/popup/App.vue` and any other `src/popup/` files that reference these components to use `@shared/components/` — no logic changes to the components themselves; ensures `src/pwa/` never imports from `src/popup/` (C1 fix)
- [x] T006 Implement `src/pwa/composables/useIDBStorage.ts` — minimal IndexedDB wrapper (~60 lines): `openDB()`, `getItem<T>()`, `setItem<T>()` for database `"eyesaver-pwa"` v1 with object stores `"settings"` and `"state"` (per `contracts/storage-schema.md`)
- [x] T007 [P] Create `src/pwa/stores/settingsStore.ts` — Pinia store backed by `useIDBStorage`: exposes `intervalMinutes` (default 20), `snoozeDurationMinutes` (default 5), `enabled` (default true); persists on change; exposes `ready` flag
- [x] T008 [P] Create `src/pwa/stores/scheduleStore.ts` — Pinia store backed by `useIDBStorage`: exposes `nextFireAt`, `snoozedUntil`, `currentExerciseIndex`, `notificationActive`; provides `initSchedule()`, `recordFired()`, `recordSnooze()`, `recordDismiss()`, `recordPopupOpen()` mutations (per state transitions in `data-model.md`); `initSchedule()` MUST be idempotent — no-op if `nextFireAt` is already set and in the future, preventing double-initialization when T022 and T031 both call it on first launch (M4 fix)
- [x] T009 Bootstrap `src/pwa/main.ts` — Vue 3 app init with Pinia and Vuetify (same Vuetify config as popup but no `chrome.*` imports); mount to `#app` in `src/pwa/index.html`
- [x] T010 Create `src/pwa/index.html` — PWA DOM mount point (mirrors `src/popup/index.html` structure, references `main.ts`)

**Checkpoint**: `npm run dev:pwa` starts without errors; stores hydrate from IndexedDB on load; no `chrome.*` references in `src/pwa/`.

---

## Phase 3: User Story 1 — Install EyeSaver as a PWA (Priority: P1)

**Goal**: A user can visit the web app, install it as a standalone PWA, and have it load offline.

**Independent Test**: Visit `http://localhost:4173` after `npm run build:pwa && npm run preview:pwa`, install via the address-bar prompt, launch from the OS — verify standalone mode and offline load.

- [x] T011 [US1] Add PWA web app manifest to `vite.config.pwa.ts`: `name: 'EyeSaver'`, `short_name: 'EyeSaver'`, `display: 'standalone'`, `background_color`, `theme_color`, `start_url: '/'`, `icons` (reuse `public/icons/` 192px and 512px entries)
- [x] T012 [P] [US1] Create `public/icons/icon-192.png` and `public/icons/icon-512.png` — masked PWA icons (192×192 and 512×512); reuse or resize existing extension icons
- [x] T013 [US1] Implement Workbox precache in `src/pwa/service-worker.ts` — call `precacheAndRoute(self.__WB_MANIFEST)` so all built assets are cached on install (enables offline load per FR-011, FR-012)
- [x] T014 [US1] Create `src/pwa/App.vue` shell — Vuetify `VApp` root; import and render `ExerciseCard.vue`, `CountdownTimer.vue`, and `SettingsPanel.vue` from `src/shared/components/` (via `@shared` alias — requires T035); layout adjusted for full-screen standalone mode

**Checkpoint**: PWA installs from `localhost`, opens in standalone mode, loads offline after first visit. Chrome DevTools → Lighthouse → PWA audit shows installability pass.

---

## Phase 4: User Story 2 — Receive Reminders With the Browser Closed (Priority: P1)

**Goal**: After installation, background notifications fire at the configured interval even when no browser window is open (Chrome/Edge desktop via Periodic Background Sync catch-up).

**Independent Test**: Install PWA, grant notification permission, set interval, close all browser windows, use DevTools → Application → Background Sync → trigger manually → verify OS notification appears.

- [x] T015 [US2] Implement foreground scheduling in `src/pwa/App.vue` — on mount: call `scheduleStore.initSchedule()`, compute ms until `nextFireAt`, start `setTimeout`; on fire: call SW's `showNotification` via `navigator.serviceWorker.ready`, call `scheduleStore.recordFired()`, restart timer
- [x] T016 [US2] Detect Periodic Background Sync support in `src/pwa/App.vue` — on mount, check `'periodicSync' in (await navigator.serviceWorker.ready)` and store the boolean in a reactive ref; pass it to `BackgroundSyncNotice.vue` (T021) to drive the fallback notice; do NOT call `registration.periodicSync.register()` here — registration happens exclusively in T022 after notification permission is confirmed (H3 fix)
- [x] T017 [US2] Implement `periodicsync` event handler in `src/pwa/service-worker.ts` — on tag `'eyesaver-reminder'`: read `settings` and `state` from IndexedDB; apply read contract from `contracts/storage-schema.md` (check `enabled`, `snoozedUntil`, `nextFireAt`); fire notification if overdue; write updated state in a single transaction
- [x] T018 [US2] Implement `activate` event handler in `src/pwa/service-worker.ts` — on SW activation, run the same overdue-notification check as T017 (catches "browser was fully closed" case)
- [x] T019 [P] [US2] Implement `showReminder(exerciseIndex: number)` helper in `src/pwa/service-worker.ts` — calls `self.registration.showNotification()` with exercise name/body from shared exercises array, `actions: [{action:'snooze',title:'Snooze'},{action:'dismiss',title:'Dismiss'}]`, and `data: { exerciseIndex }` (per R-004)

**Checkpoint**: Background sync test (DevTools trigger) fires a desktop notification with exercise content. Foreground timer fires at configured interval while the app tab is open.

---

## Phase 5: User Story 3 — Grant Notification Permissions (Priority: P2)

**Goal**: On first open, the app requests notification permission with an explanation. Denial shows a persistent guidance banner.

**Independent Test**: Clear site data, open PWA fresh, observe permission prompt with explanation text. Deny → verify "Reminders blocked" banner with browser settings link. Re-allow → verify banner clears on next open.

- [x] T020 [US3] Create `src/pwa/components/NotificationPermissionBanner.vue` — shows when `Notification.permission === 'denied'` or `=== 'default'` (not yet asked); "denied" state shows guidance text + link to browser settings; "default" state shows "Enable reminders" button that triggers `Notification.requestPermission()`
- [x] T021 [US3] Create `src/pwa/components/BackgroundSyncNotice.vue` — shows when `periodicSync` is not supported in the browser; message: "Background reminders are not supported in this browser — keep a tab open for reminders"; non-blocking info banner
- [x] T022 [US3] Integrate `NotificationPermissionBanner` and `BackgroundSyncNotice` into `src/pwa/App.vue` — rendered above main content; permission banner takes precedence; on permission grant: (1) call `scheduleStore.initSchedule()`, (2) call `(await navigator.serviceWorker.ready).periodicSync.register('eyesaver-reminder', { minInterval: settingsStore.intervalMinutes * 60_000 })` in a try/catch for unsupported browsers — this is the ONLY place `periodicSync.register()` is called (H3 fix)
- [x] T023 [P] [US3] Add `notificationCapability` computed to `src/pwa/App.vue` — derives `{ notificationPermission, periodicSyncSupported, isInstalled }` from `Notification.permission`, `'periodicSync' in ServiceWorkerRegistration.prototype`, and `window.matchMedia('(display-mode: standalone)')` (per `data-model.md` Entity 4)

**Checkpoint**: Deny notification permission → "Reminders blocked" banner with clear guidance is shown. Grant permission → banner disappears, schedule initialises. Firefox/Safari → "Background reminders unavailable" notice shown.

---

## Phase 6: User Story 4 — Manage Settings in the Installed App (Priority: P2)

**Goal**: Settings changes persist across app close, browser restart, and device restart; the next background notification respects the new values.

**Independent Test**: Change interval in settings UI, close app, open DevTools → IndexedDB → verify `intervalMinutes` updated and `nextFireAt` recalculated. Relaunch PWA → confirm settings restored.

- [x] T024 [US4] Adapt `src/shared/components/SettingsPanel.vue` usage in PWA — wire the settings panel to `src/pwa/stores/settingsStore` (not the extension's `settingsStore`); on `intervalMinutes` change: call `scheduleStore.recordIntervalChange(newIntervalMs)` which writes new `nextFireAt` to IndexedDB; restart foreground timer
- [x] T025 [P] [US4] Add `recordIntervalChange(newIntervalMs: number)` mutation to `src/pwa/stores/scheduleStore.ts` — writes `nextFireAt = Date.now() + newIntervalMs` to IndexedDB `"state"` store in a single transaction
- [x] T026 [US4] Verify settings restoration on app re-open — ensure `src/pwa/stores/settingsStore.ts` hydrates all three keys from IndexedDB on `init()` before the UI renders (gate on `ready` flag from T007); foreground timer initialised only after `ready` is true
- [x] T036 [P] [US4] Wire enable/disable toggle in PWA — connect the toggle in `src/shared/components/SettingsPanel.vue` to `settingsStore.enabled`; when toggled off: cancel the active foreground `setTimeout` and call `(await navigator.serviceWorker.ready).periodicSync.unregister('eyesaver-reminder')` in a try/catch; when toggled on: call `scheduleStore.initSchedule()` and re-register Periodic Background Sync as in T022 (H2 fix — FR-009)

**Checkpoint**: Change interval → close app → open DevTools → IndexedDB → `intervalMinutes` and `nextFireAt` show updated values. Relaunch → UI shows same values.

---

## Phase 7: User Story 5 — Snooze or Dismiss a Background Notification (Priority: P3)

**Goal**: Snooze and Dismiss actions work directly from the notification without opening the app. Snooze re-fires after the configured duration.

**Independent Test**: Trigger a notification, click Snooze on the OS notification, verify app window is not needed, wait snooze duration, verify notification re-fires. Then test Dismiss: verify timer resets to full interval.

- [x] T027 [US5] Implement `notificationclick` event handler in `src/pwa/service-worker.ts` — handle three cases: (1) `action === 'snooze'`: read `snoozeDurationMinutes` from IndexedDB `"settings"`, write `snoozedUntil` + clear `notificationActive` (write contract from `contracts/storage-schema.md`); (2) `action === 'dismiss'`: write `nextFireAt = now + intervalMs`, clear `snoozedUntil` + `notificationActive`; (3) default click (no action): `clients.openWindow('/?exercise=' + event.notification.data.exerciseIndex)` to focus/open PWA at the relevant exercise (H1 fix — FR-008); add a corresponding mounted-hook in `src/pwa/App.vue` to read the `exercise` query param from `window.location.search` and scroll to or highlight the matching exercise in the list
- [x] T028 [US5] Handle snooze expiry in `periodicsync` and `activate` handlers in `src/pwa/service-worker.ts` — existing read contract (T017, T018) already covers `snoozedUntil <= Date.now()` case; verify path fires notification and clears snooze state correctly
- [x] T029 [P] [US5] Handle foreground snooze expiry in `src/pwa/App.vue` — when app is open and `snoozedUntil` is set: start a `setTimeout` for the remaining snooze duration; on expiry: call `showReminder` + `scheduleStore.recordFired()`

**Checkpoint**: Snooze → notification closes → re-fires after snooze duration (test with DevTools Background Sync trigger or foreground tab). Dismiss → no re-fire until full interval elapses. Notification click → PWA opens/focuses.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Update banner, first-launch state, accessibility, and keyboard navigation.

- [x] T030 Implement "Update available" banner in `src/pwa/App.vue` — use `vite-plugin-pwa`'s virtual module `virtual:pwa-register/vue` (`useRegisterSW` composable); show `VBanner` when `needRefresh` is true with "Reload to update" button that calls `updateServiceWorker(true)` (NFR-006)
- [x] T031 [P] Implement first-launch state in `src/pwa/App.vue` — when `scheduleStore.nextFireAt === null` and `notificationPermission === 'granted'`: show "Your first reminder in X minutes" label in the exercise card area (FR-013); call `scheduleStore.initSchedule()` to write `nextFireAt`
- [x] T032 [P] Accessibility pass on `src/pwa/` components — verify all interactive elements in `NotificationPermissionBanner.vue`, `BackgroundSyncNotice.vue`, and `App.vue` are keyboard-navigable (Tab/Enter); verify minimum 14px font size; verify 4.5:1 colour contrast (NFR-005)
- [x] T034 Smoke test: run `npm run build` (extension) and `npm run build:pwa` (PWA) back-to-back; verify both produce clean output with no TypeScript errors, no shared file conflicts, and confirm `dist-pwa/` is listed in `.gitignore` (L1 fix: T033 merged here)

**Checkpoint**: Update banner visible on second deploy. First-launch label shown before first reminder. Both builds succeed cleanly side-by-side.

---

## Dependencies (Story Completion Order)

```
Phase 1 (Setup)
    └── Phase 2 (Foundation: IDB composable, stores, bootstrap)
            ├── Phase 3 (US1: manifest, precache, App shell)          [can start after Phase 2]
            ├── Phase 4 (US2: scheduling, background sync)            [can start after Phase 2]
            ├── Phase 5 (US3: permission flow)                        [can start after Phase 2]
            ├── Phase 6 (US4: settings persistence)                   [can start after Phase 2]
            └── Phase 7 (US5: snooze/dismiss)     [depends on Phase 4 service worker being in place]
                        └── Phase 8 (Polish)       [can start after Phase 3, 4, 5 are done]
```

Phases 3, 4, 5, 6 can proceed in parallel once Phase 2 is complete.
Phase 7 should start after Phase 4 (the `notificationclick` handler extends the same service worker).

---

## Parallel Execution Examples

**Sprint 1 (after Phase 1 + 2):**
- Dev A: Phase 3 (US1 — manifest, precache, App shell)
- Dev B: Phase 4 (US2 — scheduling, Periodic Background Sync)

**Sprint 2:**
- Dev A: Phase 5 (US3 — permission flow) + Phase 6 (US4 — settings)
- Dev B: Phase 7 (US5 — snooze/dismiss, extending Phase 4 service worker)

**Sprint 3:**
- Both: Phase 8 (Polish, update banner, accessibility, smoke test)

---

## Implementation Strategy

**MVP scope**: Phases 1 + 2 + 3 + 4 (US1 + US2)
- Delivers: installable standalone PWA with background notifications on Chrome/Edge desktop
- Excludes: permission guidance banner (US3), settings UI wiring (US4), snooze from notification (US5)
- These exclusions are all safe to add incrementally — the service worker and IDB schema are already in place

**Incremental delivery order**: US1 → US2 → US3 → US4 → US5 → Polish
