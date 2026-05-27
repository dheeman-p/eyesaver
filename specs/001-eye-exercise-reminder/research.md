# Research: Eye Exercise Reminder Chrome Extension

**Feature**: `001-eye-exercise-reminder`
**Date**: 2026-05-27

All `NEEDS CLARIFICATION` items from the Technical Context resolved below.

---

## R-001: Build Toolchain — vite-plugin-web-extension vs CRXJS

**Decision**: `vite-plugin-web-extension` v4.x (by @samrum)

**Rationale**:
- Actively maintained; full Manifest V3 support; framework-agnostic Vite plugin that works cleanly with Vue 3 + TypeScript
- Handles multi-entry builds (popup + service worker) from a single `vite.config.ts` with no additional CLI wrapping
- Provides TypeScript typings for `manifest.json`, reducing manifest authoring errors
- HMR for the popup in dev mode via a standard Vite dev server pointed at the extension

**Alternatives Considered**:
- **CRXJS Vite Plugin**: Less actively maintained since mid-2023; open GitHub issues with MV3 service worker HMR; not recommended for new projects as of 2026
- **Manual Rollup multi-entry config**: Significant boilerplate (separate configs per entry point); violates KISS

---

## R-002: Pinia State Bridge (Popup ↔ Service Worker)

**Decision**: `chrome.storage.local` as the sole shared-state bridge; custom `useStorage` composable for popup reactivity; no third-party persistence plugin

**Rationale**:
- In MV3, popup and service worker run in separate, isolated JS contexts. Pinia stores cannot be shared in memory across contexts.
- `chrome.storage.local` is the only durable, cross-context state store available in a Chrome Extension. It is the canonical source of truth.
- `chrome.storage.onChanged` is an extension event that wakes the service worker — the service worker can react to popup-driven storage writes without a persistent connection.
- The popup reads from `chrome.storage.local` on mount, subscribes to `chrome.storage.onChanged` for live reactive updates, and writes back on user actions.
- A custom `useStorage` composable (~30 lines) wraps the async chrome.storage API into a Vue-reactive ref. This avoids a third-party dependency with MV3 edge cases.
- Pinia stores serve as the in-memory reactive view layer within the popup; `useStorage` is the persistence bridge.

**Pattern**:
```
[Popup Pinia Store] ←→ [useStorage composable] ←→ [chrome.storage.local] ←→ [Service Worker]
```

**Alternatives Considered**:
- **`pinia-plugin-persistedstate`**: Uses `localStorage` by default, which is inaccessible in extension service workers. Requires a custom storage adapter; adds a dependency with MV3-specific edge cases.
- **`chrome.runtime.sendMessage`**: Requires the service worker to be awake to receive the message. Not suitable for the popup-acknowledges-notification flow, where the service worker may be sleeping when the popup opens.

---

## R-003: Vuetify 3 Tree-Shaking in a Chrome Extension

**Decision**: Vuetify 3 with manual component registration + `@mdi/js` individual icon imports

**Rationale**:
- Vuetify 3 fully supports tree-shaking via explicit `createVuetify({ components, directives })` — unused components are excluded at build time by Vite
- Only 12 components needed: `VApp`, `VAlert`, `VBtn`, `VSwitch`, `VCard`, `VCardText`, `VCardTitle`, `VTextField`, `VProgressLinear`, `VDivider`, `VList`, `VListItem` *(VCardText, VCardTitle, VList, VListItem required by ExerciseCard; VAlert required by permission-denied UX T028)*
- `@mdi/js` provides individual SVG icon path strings (imported as JS constants) rather than a full icon webfont (~160KB), keeping the popup bundle lean
- Vuetify 3 SCSS variables integrate directly with the project's `_variables.scss` design tokens via `$vuetify-*` overrides
- Expected popup bundle: ~140–160KB gzipped with selective imports — acceptable for a Chrome extension popup

**Alternatives Considered**:
- **Vue Material**: No stable Vue 3 release as of 2026; not recommended
- **Quasar**: Full opinionated framework with its own CLI; significant overhead beyond what this project needs (violates KISS)
- **Custom SCSS + MDI font**: Building a material system from scratch; higher effort without user-facing quality gain; font loading in a popup context adds latency

---

## R-004: chrome.notifications Action Buttons (Snooze)

**Decision**: `chrome.notifications.create()` with `buttons: [{title: 'Snooze'}]`; handle via `chrome.notifications.onButtonClicked.addListener()` in the service worker

**Rationale**:
- MV3 extensions (unlike web pages) support action buttons on `chrome.notifications` of type `'basic'`
- `onButtonClicked` fires in the service worker context — the service worker wakes to handle the snooze without the popup being open
- Snooze flow: cancel the `"eyesaver-reminder"` alarm → create a `"eyesaver-snooze"` alarm with `delayInMinutes = snoozeDuration` → clear the notification
- `chrome.notifications.onClosed` fires when the user dismisses via the OS notification centre (without snoozing) — treated as a full interval reset
- Notification `notificationId` is a constant (`"eyesaver-active"`) so it can be cleared from either the service worker or the popup

**Alternatives Considered**:
- **Popup-only snooze**: Requires the user to open the popup under time pressure; poor UX for the mid-task developer scenario described in US4

---

## R-005: chrome.alarms API Behaviour (MV3)

**Decision**: Use `chrome.alarms.create()` exclusively for all timer management

**Rationale**:
- `setTimeout`/`setInterval` are unreliable in MV3 service workers: Chrome terminates idle service workers after ~30 seconds, killing any active timers
- `chrome.alarms` alarms persist across browser restarts and service worker lifecycle events — no re-registration required after initial setup
- `chrome.runtime.onInstalled` is the correct hook for one-time alarm creation
- Minimum alarm granularity: 1 minute in published extensions (waived in developer mode for testing with values < 1 min using `chrome.alarms.create` with `periodInMinutes` < 1 using `when` or short `delayInMinutes` in dev)
- Two named alarms: `"eyesaver-reminder"` (main interval) and `"eyesaver-snooze"` (temporary snooze duration)
- The service worker calls `chrome.alarms.clear("eyesaver-reminder")` during snooze and recreates it when the snooze alarm fires

**Alternatives Considered**:
- **`setInterval` in service worker**: Unreliable in MV3; service worker terminates after ~30s of inactivity, resetting any intervals. Not acceptable for a timer-based product.

---

## R-006: Popup-Opens-Acknowledges Notification Flow

**Decision**: Popup calls `chrome.notifications.clear(notificationId)` directly and writes state reset to `chrome.storage.local`; no `chrome.runtime.sendMessage` needed

**Rationale**:
- The popup context has permission to call `chrome.notifications.clear()` directly — it does not need to message the service worker
- After clearing the notification, the popup writes `{ activeNotificationId: null }` to `chrome.storage.local`, signalling acknowledgment
- The existing `"eyesaver-reminder"` alarm continues unaffected; its next fire is the continuation of the reminder cycle
- The popup advances the exercise index and updates `chrome.storage.local` atomically in the same operation
- This eliminates the need for a chrome.runtime messaging layer entirely, keeping the architecture to two components: popup and service worker, communicating only via `chrome.storage.local`

**Alternatives Considered**:
- **`chrome.runtime.sendMessage` from popup to service worker**: Adds a message protocol contract and requires the service worker to be awake; unnecessary complexity since the popup has direct access to `chrome.notifications` and `chrome.storage`
