# Contract: IndexedDB Storage Schema

**Feature**: `specs/002-pwa-background-notifications`
**Generated**: 2026-05-28 (Phase 1 — /speckit.plan)

---

## Overview

This document defines the full IndexedDB storage contract for the EyeSaver PWA. Both the Vue app window and the PWA service worker are consumers and producers of this schema. Any change to key names, value shapes, or store names is a **breaking change** requiring a schema version increment.

---

## Database

| Property | Value |
|----------|-------|
| Database name | `"eyesaver-pwa"` |
| Current version | `1` |
| Upgrade strategy | `onupgradeneeded` creates stores on first install; future versions add stores or indices without deleting data |

---

## Object Store: `"settings"`

**keyPath**: `"key"` (string)
**Purpose**: User-configurable preferences. Written by the Vue app on user interaction. Read by the service worker to determine notification timing on each wake-up.

| Record key | Value type | Default value | Valid range / constraint |
|------------|-----------|---------------|--------------------------|
| `"intervalMinutes"` | `number` | `20` | Integer, 15–90 inclusive |
| `"snoozeDurationMinutes"` | `number` | `5` | Integer, 2–15 inclusive |
| `"enabled"` | `boolean` | `true` | — |

**Record shape example**:
```json
{ "key": "intervalMinutes", "value": 20 }
{ "key": "snoozeDurationMinutes", "value": 5 }
{ "key": "enabled", "value": true }
```

**Write contract**:
- Values outside valid range MUST be rejected at input validation time; they MUST NOT be written to IndexedDB.
- A write to `"intervalMinutes"` MUST be followed immediately by a write to `"state"."nextFireAt"` recalculated as `Date.now() + newIntervalMs`.
- A write to `"enabled": false` does NOT clear `"nextFireAt"` — the schedule is paused, not deleted.

---

## Object Store: `"state"`

**keyPath**: `"key"` (string)
**Purpose**: Runtime schedule state. Written by both the Vue app and the service worker. Read by the service worker on every wake-up to decide whether to fire a notification.

| Record key | Value type | Default value | Notes |
|------------|-----------|---------------|-------|
| `"nextFireAt"` | `number \| null` | `null` | Unix ms timestamp; `null` = schedule not yet initialised |
| `"snoozedUntil"` | `number \| null` | `null` | Unix ms timestamp; `null` = no active snooze |
| `"currentExerciseIndex"` | `number` | `0` | 0-based; accessed as `index % exercises.length` |
| `"notificationActive"` | `boolean` | `false` | `true` while a notification is visible in the OS notification tray |

**Record shape example**:
```json
{ "key": "nextFireAt", "value": 1748428800000 }
{ "key": "snoozedUntil", "value": null }
{ "key": "currentExerciseIndex", "value": 2 }
{ "key": "notificationActive", "value": false }
```

**Read contract (service worker)**:
On every SW wake-up event (Periodic Background Sync, `activate`, `notificationclick`):
1. Read all four state keys in a single transaction.
2. If `enabled === false`: do nothing, return.
3. If `snoozedUntil !== null && snoozedUntil > Date.now()`: do nothing, return.
4. If `snoozedUntil !== null && snoozedUntil <= Date.now()`: clear snooze, fire notification for current index, reset schedule.
5. If `nextFireAt !== null && nextFireAt <= Date.now()`: fire notification for current index, increment index, write new `nextFireAt`.
6. If `nextFireAt === null`: write `nextFireAt = Date.now() + intervalMs`, return.

**Write contract (service worker — after firing notification)**:
```
currentExerciseIndex  ← (currentExerciseIndex + 1) % exercises.length
nextFireAt            ← Date.now() + intervalMinutes * 60_000
notificationActive    ← true
snoozedUntil          ← null
```
All four writes MUST be issued in a single IndexedDB transaction.

**Write contract (service worker — snooze action)**:
```
snoozedUntil       ← Date.now() + snoozeDurationMinutes * 60_000
notificationActive ← false
```

**Write contract (service worker — dismiss action)**:
```
nextFireAt         ← Date.now() + intervalMinutes * 60_000
notificationActive ← false
snoozedUntil       ← null
```

**Write contract (Vue app — popup opened while `notificationActive = true`)**:
```
notificationActive ← false
nextFireAt         ← Date.now() + intervalMinutes * 60_000
```
The Vue app MUST also call `registration.getNotifications()` and close any visible notification.

---

## Schema Versioning

| Version | Change |
|---------|--------|
| 1 | Initial schema: `"settings"` and `"state"` object stores |

Future versions increment `version` in the `indexedDB.open('eyesaver-pwa', N)` call and handle migration in `onupgradeneeded`. Existing records are preserved; new keys may be added with defaults.

---

## Isolation from Chrome Extension

The Chrome extension uses `chrome.storage.local` under the extension's own origin. The PWA uses `IndexedDB` under the web app's origin (e.g., `https://yourdomain.com`). These are entirely separate storage namespaces — no sharing, no migration, no conflict.
