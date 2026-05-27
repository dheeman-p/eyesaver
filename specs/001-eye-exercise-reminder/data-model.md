# Data Model: Eye Exercise Reminder Chrome Extension

**Feature**: `001-eye-exercise-reminder`
**Date**: 2026-05-27
**Source**: spec.md Key Entities + research.md decisions

---

## Entity: Exercise

Represents a single named eye practice bundled statically into the extension. All exercise content is immutable at runtime (read-only array).

```typescript
interface Exercise {
  /** Zero-based index; determines sequential rotation order */
  index: number;

  /** Short display name shown in notification and popup header */
  name: string;

  /** One-sentence description shown below the name */
  description: string;

  /** Ordered list of step instructions; each step is one sentence */
  steps: string[];

  /** Approximate total duration in seconds for all steps combined */
  durationSeconds: number;
}
```

**Validation rules**:
- `steps` MUST have at least 2 entries
- `durationSeconds` MUST be between 20 and 120 (inclusive)
- `index` MUST be unique across the exercise array and 0-based sequential

**Bundled exercises** (static content, never fetched from network):

| Index | Name | Duration |
|-------|------|----------|
| 0 | 20-20-20 Rule | 20s |
| 1 | Palming | 60s |
| 2 | Conscious Blinking | 30s |
| 3 | Figure-Eight Tracking | 45s |
| 4 | Near-Far Focus Shift | 40s |
| 5 | Eye Rolling | 30s |

---

## Entity: UserSettings

Represents all user-configurable preferences. Stored entirely in `chrome.storage.local` under the key `"eyesaver_settings"`. Loaded on popup mount and on service worker startup via `chrome.storage.local.get`.

```typescript
interface UserSettings {
  /** Reminder interval in minutes. Range: 15–90. Default: 20 */
  intervalMinutes: number;

  /** Snooze duration in minutes. Range: 2–15. Default: 5 */
  snoozeDurationMinutes: number;

  /** Whether reminders are enabled globally */
  enabled: boolean;
}
```

**Default values**:
```typescript
const DEFAULT_SETTINGS: UserSettings = {
  intervalMinutes: 20,
  snoozeDurationMinutes: 5,
  enabled: true,
};
```

**Validation rules**:
- `intervalMinutes`: integer, 15 ≤ value ≤ 90
- `snoozeDurationMinutes`: integer, 2 ≤ value ≤ 15
- `enabled`: boolean, no validation required

---

## Entity: ReminderState

Represents the runtime state of the reminder schedule. Stored in `chrome.storage.local` under the key `"eyesaver_state"`. Written by both the popup and the service worker; each write is atomic per key.

```typescript
interface ReminderState {
  /**
   * Timestamp (ms since epoch) when the current reminder cycle started.
   * Used by the popup to calculate the live countdown.
   * Set by service worker on alarm fire (after acknowledgment) and on install.
   */
  cycleStartedAt: number;

  /**
   * The index (into the exercises array) of the next exercise to be shown
   * in the upcoming notification. Advances by 1 (mod N) after each fire
   * (i.e., the stored value is always the index that will be used next).
   */
  currentExerciseIndex: number;

  /**
   * The chrome.notifications notification ID of the currently active
   * (unacknowledged) reminder notification, or null if no notification
   * is currently displayed.
   */
  activeNotificationId: string | null;
}
```

**State transitions**:

```
[Installed / Enabled]
      │
      ▼
  IDLE (activeNotificationId: null)
      │  chrome.alarms "eyesaver-reminder" fires
      ▼
  NOTIFYING (activeNotificationId: "eyesaver-active")
      │                          │
      │ User clicks Snooze       │ User opens popup OR dismisses notification
      ▼                          ▼
  SNOOZED                    IDLE (cycleStartedAt reset; index is at N+1, pre-advanced
                                   by alarm handler — dismiss does NOT re-advance;
                                   popup-open advances once more to N+2 via advance())
      │
      │ "eyesaver-snooze" alarm fires
      ▼
  NOTIFYING (same exercise, new notification)
```

**Default values** (set on `chrome.runtime.onInstalled`):
```typescript
const DEFAULT_STATE: ReminderState = {
  cycleStartedAt: Date.now(),
  currentExerciseIndex: 0,
  activeNotificationId: null,
};
```

---

## Entity: StorageSchema

Canonical shape of all data in `chrome.storage.local`. Used as the TypeScript type for `chrome.storage.local.get` calls.

```typescript
interface StorageSchema {
  eyesaver_settings: UserSettings;
  eyesaver_state: ReminderState;
}
```

**Storage key registry**:

| Key | Owner | Written By | Read By |
|-----|-------|-----------|---------|
| `eyesaver_settings` | UserSettings | Popup (settings panel) | Popup + Service Worker |
| `eyesaver_state` | ReminderState | Popup (acknowledgment) + Service Worker (alarm/snooze) | Popup (countdown) |

---

## Relationships

```
Exercise[]  ──(index ref)──→  ReminderState.currentExerciseIndex
UserSettings.intervalMinutes  ──→  chrome.alarms "eyesaver-reminder" delayInMinutes
UserSettings.snoozeDurationMinutes  ──→  chrome.alarms "eyesaver-snooze" delayInMinutes
UserSettings.enabled  ──→  alarm creation / cancellation in service worker
ReminderState.activeNotificationId  ──→  chrome.notifications.clear() target
```
