/**
 * Shared TypeScript interfaces — used by both popup and service worker.
 * Source of truth: specs/001-eye-exercise-reminder/data-model.md
 */

export interface Exercise {
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

export interface UserSettings {
  /** Reminder interval in minutes. Range: 15–90. Default: 20 */
  intervalMinutes: number;
  /** Snooze duration in minutes. Range: 2–15. Default: 5 */
  snoozeDurationMinutes: number;
  /** Whether reminders are enabled globally */
  enabled: boolean;
}

export interface ReminderState {
  /** Unix ms timestamp when the current reminder cycle started. */
  cycleStartedAt: number;
  /**
   * Index (into the exercises array) of the next exercise to be shown.
   * Pre-advanced by alarm handler so that the value is always the index
   * that will be used on the upcoming notification.
   */
  currentExerciseIndex: number;
  /** Notification ID of the active reminder, or null if none visible. */
  activeNotificationId: string | null;
}

export interface StorageSchema {
  eyesaver_settings: UserSettings;
  eyesaver_state: ReminderState;
}
