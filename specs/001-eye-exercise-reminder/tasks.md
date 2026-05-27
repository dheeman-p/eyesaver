---
description: "Task list for Eye Exercise Reminder Chrome Extension"
---

# Tasks: Eye Exercise Reminder Chrome Extension

**Input**: Design documents from `/specs/001-eye-exercise-reminder/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/storage-schema.md ✅, quickstart.md ✅

**Tests**: None — constitution Principle IV prohibits automated testing. Validation via manual QA against spec acceptance scenarios (see quickstart.md).

**Organization**: Tasks grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US3; US4 is fully covered within Phase 3)
- Exact file paths in every description

## Path Conventions

- All paths relative to repository root
- Single Chrome Extension project: `src/` at repository root
- Two runtime contexts: `src/popup/` (Vue 3 UI) and `src/background/` (service worker)
- Shared types and content: `src/shared/`

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Scaffold the project structure, install all dependencies, and configure the build pipeline. No feature logic — just a compiling, loadable Chrome extension skeleton.

- [X] T001 Create `package.json` at repository root with all dependencies: `vue@^3.5`, `pinia@^2.2`, `vuetify@^3.6`, `@mdi/js@^7.4`; devDependencies: `typescript@^5.4`, `vite@^5.2`, `vite-plugin-web-extension@^4.1`, `sass@^1.75`, `@types/chrome@^0.0.268`; scripts: `dev`, `build`
- [X] T002 Create `src/manifest.json` — Chrome Manifest V3: popup entry pointing to `src/popup/main.ts`, background service worker pointing to `src/background/service-worker.ts`, permissions `["notifications", "storage", "alarms"]`, no host_permissions
- [X] T003 Create `vite.config.ts` — configure `vite-plugin-web-extension` with multi-entry build: popup (`src/popup/main.ts`) and service worker (`src/background/service-worker.ts`); TypeScript paths aliased for `@shared/` → `src/shared/`
- [X] T004 [P] Create `src/popup/styles/_variables.scss` (design tokens: brand colour, spacing scale, border-radius, base font-size 16px) and `src/popup/styles/main.scss` (global reset, Vuetify SCSS variable overrides via `$vuetify-*` prefix)

**Checkpoint**: Run `npm run build` — `dist/` produced with no errors. Load unpacked in Chrome — toolbar icon visible.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared types, constants, exercise content, and the storage bridge composable. All user story phases depend on these. Complete entirely before starting any user story.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T005 Create `src/shared/types/index.ts` — export TypeScript interfaces: `Exercise`, `UserSettings`, `ReminderState`, `StorageSchema` exactly as defined in `data-model.md`
- [X] T006 [P] Create `src/shared/constants/index.ts` — export: `ALARM_NAME = 'eyesaver-reminder'`, `SNOOZE_ALARM_NAME = 'eyesaver-snooze'`, `NOTIFICATION_ID = 'eyesaver-active'`, `DEFAULT_SETTINGS: UserSettings` (intervalMinutes: 20, snoozeDurationMinutes: 5, enabled: true), `DEFAULT_STATE: ReminderState` (cycleStartedAt: Date.now(), currentExerciseIndex: 0, activeNotificationId: null)
- [X] T007 [P] Create `src/shared/exercises/index.ts` — export `EXERCISES: Exercise[]` array of 6 objects: index 0 "20-20-20 Rule" (look 20ft away for 20s, 3 steps, 20s), index 1 "Palming" (cup warm palms over closed eyes, 4 steps, 60s), index 2 "Conscious Blinking" (deliberate slow blinks, 3 steps, 30s), index 3 "Figure-Eight Tracking" (trace a figure-8 with eyes, 3 steps, 45s), index 4 "Near-Far Focus Shift" (alternate focus near/far object, 4 steps, 40s), index 5 "Eye Rolling" (slow circular eye rotation, 3 steps, 30s); each with full specialist-recommended step text
- [X] T008 Create `src/popup/composables/useStorage.ts` — export `useStorage<T>(key: string, defaultValue: T): { value: Ref<T>, set: (v: T) => Promise<void> }` composable; reads from `chrome.storage.local.get` on init; subscribes to `chrome.storage.onChanged` to keep `value` ref reactive; writes via `chrome.storage.local.set`
- [X] T009 Create `src/popup/main.ts` (bootstrap: `createApp(App)` + `createPinia()` + `createVuetify({ components: { VApp, VAlert, VBtn, VSwitch, VCard, VCardText, VCardTitle, VTextField, VProgressLinear, VDivider, VList, VListItem }, directives: { Ripple } })`) and `src/popup/App.vue` (VApp shell with `<router-view>`-less view slot; conditionally renders idle view or settings panel; width 380px)

**Checkpoint**: TypeScript compiles with no errors across `src/shared/` and `src/popup/main.ts`.

---

## Phase 3: User Story 1 — Receive Timely Eye Exercise Reminder (Priority: P1) 🎯 MVP

**Goal**: Background service worker fires OS-level notifications at the configured interval with exercise name and Snooze button. Full alarm lifecycle including snooze and dismiss is implemented here.

**Independent Test**: Load extension, wait for first alarm (set `intervalMinutes` to 1 in storage for dev), verify OS notification appears with exercise name and Snooze button. Click Snooze — notification re-fires after snooze duration. Dismiss notification — new alarm cycle starts.

*Note: User Story 4 (Snooze/Dismiss) is fully implemented in this phase via the service worker.*

- [X] T010 [US1] Create `src/background/service-worker.ts` — implement `chrome.runtime.onInstalled` listener: read `eyesaver_settings` from `chrome.storage.local`; if missing, write `DEFAULT_SETTINGS`; read `eyesaver_state`; if missing, write `DEFAULT_STATE`; if `enabled`, call `chrome.alarms.create(ALARM_NAME, { delayInMinutes: intervalMinutes })`
- [X] T011 [US1] Implement `chrome.alarms.onAlarm` handler in `src/background/service-worker.ts` for `alarm.name === ALARM_NAME` — read `eyesaver_state` and `eyesaver_settings` from storage; resolve `exercise = EXERCISES[currentExerciseIndex]` (show **current** index, not next); compute `nextIndex = (currentExerciseIndex + 1) % EXERCISES.length`; write updated state (`cycleStartedAt: Date.now()`, `currentExerciseIndex: nextIndex`, `activeNotificationId: NOTIFICATION_ID`); call `chrome.notifications.create(NOTIFICATION_ID, { type: 'basic', title: exercise.name, message: exercise.description, buttons: [{ title: 'Snooze' }], requireInteraction: false })`; recreate `ALARM_NAME` alarm with `delayInMinutes: intervalMinutes` *(Analysis F2 fix: display current index before advancing so exercise #1 appears in the first notification)*
- [X] T012 [US1] Implement `chrome.notifications.onButtonClicked` listener in `src/background/service-worker.ts` — on button index 0 (Snooze): read `snoozeDurationMinutes` from `eyesaver_settings`; call `chrome.alarms.clear(ALARM_NAME)`; call `chrome.alarms.create(SNOOZE_ALARM_NAME, { delayInMinutes: snoozeDurationMinutes })`; call `chrome.notifications.clear(NOTIFICATION_ID)`; write `{ activeNotificationId: null }` merged into `eyesaver_state` in storage
- [X] T013 [US1] Implement `chrome.notifications.onClosed` listener in `src/background/service-worker.ts` — if `byUser === true` (user dismissed, not programmatic close): read `eyesaver_settings`; write `{ activeNotificationId: null, cycleStartedAt: Date.now() }` to `eyesaver_state` (do **NOT** advance `currentExerciseIndex` — T011 already advanced it from N to N+1 on alarm fire; advancing again here would double-skip, violating FR-007); call `chrome.alarms.clear(ALARM_NAME)`; call `chrome.alarms.create(ALARM_NAME, { delayInMinutes: intervalMinutes })` to restart full cycle *(Analysis F fix: removed double-advance; T011 pre-advance is the only rotation step needed)*
- [X] T014 [US1] Implement `chrome.alarms.onAlarm` handler for `alarm.name === SNOOZE_ALARM_NAME` in `src/background/service-worker.ts` — read current `eyesaver_state` (do NOT advance index — same exercise re-fires on snooze); read `intervalMinutes` from settings; recreate `ALARM_NAME` alarm with `delayInMinutes: intervalMinutes`; write `activeNotificationId: NOTIFICATION_ID` to state; call `chrome.notifications.create` with same exercise as current index

**Checkpoint**: MVP complete. Service worker fully functional with alarm, notification, snooze, and dismiss flows verified against spec acceptance scenarios US1 + US4.

---

## Phase 4: User Story 2 — View Exercise Instructions in Popup (Priority: P2)

**Goal**: Clicking the extension icon shows the current exercise with step-by-step instructions and a live countdown to the next reminder. Opening the popup while a notification is active clears it automatically.

**Independent Test**: Open the popup — exercise #1 displayed with steps and countdown label. On first install (no prior state), "Your first reminder in X minutes" label visible. Open popup while notification is active — notification clears automatically and timer resets.

- [X] T015 [P] [US2] Create `src/popup/stores/exerciseStore.ts` — Pinia store: `exercises = EXERCISES`, load `currentExerciseIndex` from `chrome.storage.local` via `useStorage`; computed `currentExercise`; action `advance()` increments index mod length and writes to storage; subscribes to `chrome.storage.onChanged` on `eyesaver_state` to keep index in sync with service worker writes
- [X] T016 [P] [US2] Create `src/popup/stores/scheduleStore.ts` — Pinia store: load `cycleStartedAt`, `activeNotificationId` from `eyesaver_state` and `intervalMinutes` from `eyesaver_settings` all via separate `useStorage` calls (do **not** import settingsStore — load `intervalMinutes` directly to keep Phase 4 independent of Phase 5); computed `nextReminderAt = cycleStartedAt + (intervalMinutes * 60000)`; computed `secondsRemaining` updated by a `setInterval` every second; subscribes to `chrome.storage.onChanged` to update when service worker writes new state *(Analysis E fix: direct storage read eliminates cross-phase dependency on settingsStore)*
- [X] T017 [P] [US2] Create `src/popup/components/ExerciseCard.vue` — `<VCard>` accepting `exercise: Exercise` prop; displays `VCardTitle` with exercise name, subtitle with description, `VList` with `VListItem` for each step prefixed with step number; `<style lang="scss" scoped>` using `_variables.scss` tokens
- [X] T018 [P] [US2] Create `src/popup/components/CountdownTimer.vue` — `<div>` with `VProgressLinear` (determinate, value = percentage of interval elapsed) and a formatted time label (e.g., "Next reminder in 14m 32s"); reads `scheduleStore.secondsRemaining` and `scheduleStore.intervalMinutes` (both available in scheduleStore per T016 — no settingsStore import needed); shows "Your first reminder in X minutes" when `Date.now() < cycleStartedAt + intervalMinutes * 60000` and no alarm has fired yet — this naturally covers first-install state without separate detection logic *(Analysis F4: T020 removed; first-install state is handled here by this fallback; Analysis E fix: reads intervalMinutes from scheduleStore, not settingsStore)*
- [X] T019 [US2] Implement popup acknowledgment in `src/popup/App.vue` — in `onMounted`: read `activeNotificationId` from `scheduleStore`; if non-null: (1) call `chrome.notifications.clear(NOTIFICATION_ID)`; (2) call `chrome.alarms.clear(ALARM_NAME)` then `chrome.alarms.create(ALARM_NAME, { delayInMinutes: intervalMinutes })` to reset timer to full interval; (3) write `{ activeNotificationId: null, cycleStartedAt: Date.now() }` atomically to `eyesaver_state`; (4) call `exerciseStore.advance()` *(Analysis F1 fix: timer reset added; F5 fix: cycleStartedAt updated to keep countdown display accurate)*
- [X] T021 [US2] Wire `ExerciseCard` + `CountdownTimer` into `src/popup/App.vue` idle view — compose popup idle layout: `VCard` wrapper containing `ExerciseCard` (bound to `exerciseStore.currentExercise`) and `CountdownTimer` stacked vertically with 8px gap; settings toggle `VBtn` with gear `mdiCog` icon in top-right toolbar

**Checkpoint**: Popup fully functional. Exercise display, countdown, first-install label, and popup-open acknowledgment all working independently of settings UI.

---

## Phase 5: User Story 3 — Customize Reminder Interval (Priority: P3)

**Goal**: Users can change the reminder interval (15–90 min) and snooze duration (2–15 min) via the popup, and toggle reminders on/off. Changes take effect immediately without a browser restart.

**Independent Test**: Open settings panel, change interval to 45 minutes, verify countdown updates. Change snooze to 3 minutes, verify next snooze re-fires after 3 minutes. Toggle off — no more notifications. Toggle on — reminders resume.

- [X] T022 [P] [US3] Create `src/popup/stores/settingsStore.ts` — Pinia store: `intervalMinutes`, `snoozeDurationMinutes`, `enabled` all loaded from `eyesaver_settings` via `useStorage`; action `saveSettings(partial: Partial<UserSettings>)` merges and writes to `chrome.storage.local.set({ eyesaver_settings: merged })`; input validation: clamp interval to 15–90, snooze to 2–15
- [X] T023 [P] [US3] Create `src/popup/components/SettingsPanel.vue` — `VCard` with `VCardTitle` "Settings"; `VTextField` for interval (type=number, min=15, max=90, label="Reminder every (minutes)", `:rules` for range validation); `VTextField` for snooze (type=number, min=2, max=15, label="Snooze for (minutes)", `:rules`); `VSwitch` for enabled toggle (label="Reminders enabled"); `VBtn` "Save" — calls `settingsStore.saveSettings()`; shows inline validation errors via Vuetify `rules` prop (no external error handling)
- [X] T024 [US3] Implement `chrome.storage.onChanged` side effects in `src/background/service-worker.ts` — add listener for `eyesaver_settings` key changes: if `enabled` changed to `false`, call `chrome.alarms.clearAll()`; if `enabled` changed to `true`, recreate `ALARM_NAME` with new `intervalMinutes`; if only `intervalMinutes` changed while enabled, call `chrome.alarms.clear(ALARM_NAME)` then `chrome.alarms.create(ALARM_NAME, { delayInMinutes: newInterval })`
- [X] T025 [US3] Wire `SettingsPanel` into `src/popup/App.vue` — add reactive boolean `showSettings`; toggle via the gear `VBtn` already present in T021 toolbar; conditionally render `SettingsPanel` instead of idle view when `showSettings` is true; `SettingsPanel` emits `'close'` event on Save to return to idle view

**Checkpoint**: Settings fully functional. Interval and snooze changes propagate to service worker via storage change events; no browser restart needed.

---

## Final Phase: Polish & Cross-Cutting Concerns

**Purpose**: Apply consistent visual design across all components and verify accessibility requirements from spec SC-006.

- [X] T026 [P] Apply Vuetify material theme and SCSS design tokens to all popup components — set primary brand colour in `_variables.scss` (recommended: teal `#00897B` for eye-health connotation); verify all body text is minimum 16px (base) with 14px floor for labels; confirm `VProgressLinear` colour matches brand; consistent `VCard` padding (16px) and component spacing throughout `ExerciseCard`, `CountdownTimer`, `SettingsPanel`
- [X] T027 [P] Verify and fix keyboard navigation across all popup UI — Tab through all interactive elements (`VBtn`, `VSwitch`, `VTextField`) in order: toolbar gear button → ExerciseCard (read-only) → CountdownTimer (read-only) → SettingsPanel inputs; confirm Enter/Space activates `VBtn` and `VSwitch`; verify foreground-to-background text contrast ratio ≥ 4.5:1 for all visible text using browser DevTools accessibility panel
- [X] T028 [P] Implement notification-permission-denied UX in `src/popup/App.vue` — on `onMounted`, call `chrome.notifications.getPermissionLevel(callback)`; if result is `'denied'`, set a reactive `permissionDenied` ref to `true`; render a `VAlert` (type `'warning'`, variant `'tonal'`) above the exercise card with message "Reminders are blocked — enable Chrome notifications in your OS settings to receive eye break reminders"; hide `CountdownTimer` when `permissionDenied` is true *(Analysis F3 fix: covers spec assumption — popup warns user when OS notification permission is denied)*

---

## Dependencies (User Story Completion Order)

```
Phase 1 (Setup)
    └── Phase 2 (Foundational)
            ├── Phase 3 (US1 + US4) ← MVP: can deliver independently ✅
            ├── Phase 4 (US2)       ← requires Phase 2; can partially parallel Phase 3
            ├── Phase 5 (US3)       ← requires Phase 2; T024 requires Phase 3 service worker
            └── Final Phase         ← requires all phases complete
```

**Parallel opportunities per phase**:

- Phase 2: T006 ∥ T007 (constants and exercises are independent files)
- Phase 3: T012 ∥ T013 ∥ T014 (separate event listeners, same file — sequential preferred to avoid merge conflicts; implement in order T011 → T012 → T013 → T014)
- Phase 4: T015 ∥ T016 ∥ T017 ∥ T018 (four independent files)
- Phase 5: T022 ∥ T023 (store and component are independent files)
- Final: T026 ∥ T027 (styling and accessibility are independent concerns)

---

## Implementation Strategy

**MVP Scope** (Phase 1 + 2 + 3 only — T001–T014):
Complete the service worker first. By T014, the extension fires notifications on a schedule, supports snooze via notification button, handles dismissal, and persists all state. The popup does not need to exist for the core value proposition to work. This is a shippable MVP.

**Incremental delivery order**:
1. T001–T009: Build compiles, extension loads in Chrome ← first milestone
2. T010–T014: MVP — alarms and notifications work end-to-end ← demo milestone
3. T015–T021: Popup shows exercises and countdown ← user-visible milestone
4. T022–T025: Settings configurable from popup ← feature-complete milestone
5. T026–T027: Polished, accessible UI ← release-ready milestone

---

## Summary

| Metric | Value |
|---|---|
| Total tasks | 27 — T020 removed, T028 added; net unchanged |
| Phase 1 (Setup) | 4 tasks (T001–T004) |
| Phase 2 (Foundational) | 5 tasks (T005–T009) |
| Phase 3 (US1 + US4 MVP) | 5 tasks (T010–T014) |
| Phase 4 (US2 Popup) | 6 tasks (T015–T019, T021) — T020 removed (F4) |
| Phase 5 (US3 Settings) | 4 tasks (T022–T025) |
| Final Phase (Polish) | 3 tasks (T026–T028) — T028 added (F3) |
| Parallelizable tasks [P] | 12 tasks |
| User story coverage | US1 ✅ US2 ✅ US3 ✅ US4 ✅ (within Phase 3) |
| Analysis findings applied | Prior session: F1 ✅ F2 ✅ F3 ✅ F4 ✅ F5 ✅ F6 (spec) ✅ F7 (no action) · Session 2 (analyze): A ✅ B ✅ C ✅ D ✅ · Session 3 (analyze): E ✅ F ✅ |
| Test tasks | 0 (constitution Principle IV) |
| MVP scope | T001–T014 (Phases 1–3) |
