import type { ReminderState, UserSettings } from '@shared/types';

export const ALARM_NAME = 'eyesaver-reminder' as const;
export const SNOOZE_ALARM_NAME = 'eyesaver-snooze' as const;
export const NOTIFICATION_ID = 'eyesaver-active' as const;

export const STORAGE_KEY_SETTINGS = 'eyesaver_settings' as const;
export const STORAGE_KEY_STATE = 'eyesaver_state' as const;

export const DEFAULT_SETTINGS: UserSettings = {
  intervalMinutes: 20,
  snoozeDurationMinutes: 5,
  enabled: true,
};

export const DEFAULT_STATE: ReminderState = {
  cycleStartedAt: Date.now(),
  currentExerciseIndex: 0,
  activeNotificationId: null,
};

// Validation bounds (per data-model.md)
export const INTERVAL_MIN_MINUTES = 15;
export const INTERVAL_MAX_MINUTES = 90;
export const SNOOZE_MIN_MINUTES = 2;
export const SNOOZE_MAX_MINUTES = 15;
