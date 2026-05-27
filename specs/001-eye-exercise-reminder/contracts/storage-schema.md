# Contract: chrome.storage.local Schema

**Feature**: `001-eye-exercise-reminder`
**Date**: 2026-05-27
**Type**: Extension Storage Contract

This document is the authoritative definition of all data stored in `chrome.storage.local`. Both the popup and the service worker MUST read and write ONLY the keys defined here and MUST respect the types and constraints listed.

---

## Storage Keys

### `eyesaver_settings`

**Type**: `UserSettings`
**Written by**: Popup (SettingsPanel component)
**Read by**: Popup (all stores), Service Worker (alarm management)
**Persists across**: Browser restarts ✅, Extension updates ✅

```jsonc
{
  "eyesaver_settings": {
    "intervalMinutes": 20,       // integer, 15–90
    "snoozeDurationMinutes": 5,  // integer, 2–15
    "enabled": true              // boolean
  }
}
```

**Write protocol**:
- Written atomically via `chrome.storage.local.set({ eyesaver_settings: newValue })`
- After writing, the service worker MUST cancel and recreate `"eyesaver-reminder"` if `intervalMinutes` changed, or cancel all alarms if `enabled` became `false`
- Popup reacts to changes via `chrome.storage.onChanged`

---

### `eyesaver_state`

**Type**: `ReminderState`
**Written by**: Service Worker (on alarm fire, snooze, install) + Popup (on notification acknowledgment)
**Read by**: Popup (countdown, exercise display), Service Worker (exercise index advance)
**Persists across**: Browser restarts ✅, Extension updates ✅

```jsonc
{
  "eyesaver_state": {
    "cycleStartedAt": 1748338800000,  // Unix timestamp ms; Date.now() at cycle start
    "currentExerciseIndex": 0,         // integer, 0 to (exerciseCount - 1), wraps around
    "activeNotificationId": null       // string "eyesaver-active" when notifying, null otherwise
  }
}
```

**Write protocol**:
- Service worker writes on alarm fire: advance `currentExerciseIndex` (N → N+1), set `cycleStartedAt = Date.now()`, set `activeNotificationId = "eyesaver-active"`
- Service worker writes on user dismiss (OS swipe/close, `byUser = true`): set `activeNotificationId = null`, reset `cycleStartedAt = Date.now()`; do **NOT** advance `currentExerciseIndex` — T011 pre-advanced it on alarm fire; advancing again would skip exercises *(Analysis F fix)*
- Popup writes on acknowledgment (popup open while `activeNotificationId` is set): set `activeNotificationId = null`, reset `cycleStartedAt = Date.now()`; clear and recreate `"eyesaver-reminder"` alarm with full `intervalMinutes`; advance `currentExerciseIndex` via `exerciseStore.advance()` *(per spec FR-011)*
- Service worker writes on snooze button click: set `activeNotificationId = null` (notification cleared); `cycleStartedAt` unchanged; snooze alarm created separately; do **NOT** advance `currentExerciseIndex` — same exercise re-fires after snooze

---

## Chrome Alarm Names

| Alarm Name | Purpose | Created by | Cleared by |
|---|---|---|---|
| `"eyesaver-reminder"` | Main interval timer | Service Worker (`onInstalled`, settings change) | Service Worker (snooze start, disabled, interval change) |
| `"eyesaver-snooze"` | Snooze countdown | Service Worker (snooze button click) | Service Worker (snooze alarm fires → recreates `eyesaver-reminder`) |

---

## Chrome Notification IDs

| Notification ID | Purpose |
|---|---|
| `"eyesaver-active"` | The single active reminder notification; cleared by popup on open or by service worker on snooze/dismiss |

---

## Manifest Permissions Required

```json
{
  "permissions": ["notifications", "storage", "alarms"],
  "host_permissions": []
}
```

No host permissions are required — the extension is fully offline with no content scripts.

---

## Invariants

1. `eyesaver_state.activeNotificationId` is `null` when no notification is visible; `"eyesaver-active"` when one is.
2. At most one alarm named `"eyesaver-reminder"` OR `"eyesaver-snooze"` is active at any time — never both simultaneously.
3. `eyesaver_state.currentExerciseIndex` is always in range `[0, exerciseCount - 1]`. Overflow wraps: `(index + 1) % exerciseCount`.
4. `eyesaver_settings` MUST exist in storage after `chrome.runtime.onInstalled` fires. Missing keys are initialized to defaults before any alarm is created.
