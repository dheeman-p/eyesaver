# Data Model: PWA with Background Notifications

**Feature**: `specs/002-pwa-background-notifications`
**Generated**: 2026-05-28 (Phase 1 — /speckit.plan)

---

## Overview

The PWA uses **IndexedDB** as its single persistent storage layer. Both the Vue application window and the PWA service worker read from and write to the same IndexedDB origin store. There are two logical databases for this feature: **Settings** and **Schedule State**. Exercise content is static (bundled) and not persisted.

---

## IndexedDB Structure

```
Database name: "eyesaver-pwa"
Database version: 1

Object stores:
├── "settings"         keyPath: "key"   (key-value pairs)
└── "state"            keyPath: "key"   (key-value pairs)
```

Both stores use a simple string `key` → any `value` layout, mirroring the flat `chrome.storage.local` pattern from the Chrome extension. No indices or cursors are needed.

---

## Entity 1: UserSettings

Persisted in the `"settings"` store. Written by the Vue app when the user changes settings. Read by both the Vue app (reactive display) and the service worker (to know interval + snooze duration at notification time).

| Key (string) | Value Type | Default | Validation |
|---|---|---|---|
| `intervalMinutes` | `number` | `20` | Integer, 15–90 inclusive |
| `snoozeDurationMinutes` | `number` | `5` | Integer, 2–15 inclusive |
| `enabled` | `boolean` | `true` | — |

**State transitions**:
- `enabled: false` → scheduling paused; any pending `nextFireAt` is ignored by the service worker
- `enabled: true` → if no `nextFireAt` exists, schedule is created immediately on next app open or SW activation
- `intervalMinutes` changed → `nextFireAt` is recalculated as `now + newIntervalMs` and written to the `"state"` store immediately

---

## Entity 2: ScheduleState

Persisted in the `"state"` store. Written by both the Vue app (on settings change, on popup open during active reminder) and the service worker (after firing a notification, after handling snooze/dismiss). Read by the service worker on each wake-up.

| Key (string) | Value Type | Default | Notes |
|---|---|---|---|
| `nextFireAt` | `number` (unix ms) or `null` | `null` | Timestamp of the next scheduled notification; `null` = not yet scheduled |
| `snoozedUntil` | `number` (unix ms) or `null` | `null` | If non-null and in the future, the reminder is snoozed; `nextFireAt` is ignored until this passes |
| `currentExerciseIndex` | `number` | `0` | Index into the shared exercises array; incremented after each notification fires |
| `notificationActive` | `boolean` | `false` | `true` while a notification is visible; cleared when the user dismisses, snoozes, or opens the app |

**State transitions**:

| Trigger | Effect |
|---------|--------|
| App first open, `nextFireAt` is null | Write `nextFireAt = now + intervalMs` |
| Foreground timer fires | SW shows notification → increment `currentExerciseIndex` → write `nextFireAt = now + intervalMs` → set `notificationActive = true` |
| User snoozes notification | Write `snoozedUntil = now + snoozeDurationMs` → set `notificationActive = false` |
| Snooze elapses | Clear `snoozedUntil` → show notification → write `nextFireAt = now + intervalMs` → set `notificationActive = true` |
| User dismisses notification | Clear `snoozedUntil` → set `notificationActive = false` → write `nextFireAt = now + intervalMs` |
| App opened while `notificationActive = true` | Close notification → set `notificationActive = false` → write `nextFireAt = now + intervalMs` |
| App opened, `nextFireAt` is overdue | Fire notification immediately → proceed as "Foreground timer fires" above |

---

## Entity 3: Exercise (shared, read-only)

Defined in `src/shared/exercises/index.ts`. Not persisted — bundled statically. Reused unchanged from the Chrome extension.

| Field | Type | Notes |
|-------|------|-------|
| `name` | `string` | Display name of the exercise |
| `steps` | `string[]` | Ordered step-by-step instructions |
| `duration` | `number` | Estimated duration in seconds |

Exercises are accessed by `currentExerciseIndex % exercises.length` to cycle sequentially.

---

## Entity 4: NotificationCapability (runtime, not persisted)

Computed at runtime by the Vue app on each startup. Not stored in IndexedDB. Used only to drive the in-app capability notice (FR-006, FR-004).

| Field | Type | Notes |
|-------|------|-------|
| `notificationPermission` | `'granted' \| 'denied' \| 'default'` | `Notification.permission` |
| `periodicSyncSupported` | `boolean` | `'periodicSync' in self.registration` |
| `isInstalled` | `boolean` | `window.matchMedia('(display-mode: standalone)').matches` |

Derived UI state from this entity:
- `notificationPermission === 'denied'` → show "Reminders blocked" guidance banner (FR-004)
- `!periodicSyncSupported` → show "Background reminders unavailable on this browser — keep a tab open" notice (FR-006)
- `!isInstalled` → optionally show "Install for better experience" prompt

---

## Scheduling Invariants

1. At most one `nextFireAt` is active at any time.
2. `currentExerciseIndex` is incremented **when the notification fires** (not when it is dismissed), ensuring no exercise repeats even if the user dismisses without viewing.
3. `snoozedUntil` takes precedence over `nextFireAt`: while snooze is active and in the future, no new notification fires.
4. All timestamps are stored as Unix milliseconds (compatible with `Date.now()`).
5. The service worker always writes to IndexedDB before emitting a notification, so if the SW is terminated immediately after `showNotification`, state is consistent on the next wake.
