import { computed, onScopeDispose, ref } from 'vue';
import { defineStore } from 'pinia';
import { useStorage } from '@popup/composables/useStorage';
import {
  DEFAULT_SETTINGS,
  DEFAULT_STATE,
  STORAGE_KEY_SETTINGS,
  STORAGE_KEY_STATE,
} from '@shared/constants';
import type { ReminderState, UserSettings } from '@shared/types';

/**
 * Drives the live countdown display in the popup.
 *
 * Reads `eyesaver_state` and `eyesaver_settings.intervalMinutes` directly so
 * the popup can render the countdown without depending on the settings store
 * (keeps Phase 4 deliverable independent of Phase 5 per refactor F-E).
 */
export const useScheduleStore = defineStore('schedule', () => {
  const { value: state, ready: stateReady } = useStorage<ReminderState>(
    STORAGE_KEY_STATE,
    DEFAULT_STATE,
  );
  const { value: settings, ready: settingsReady } = useStorage<UserSettings>(
    STORAGE_KEY_SETTINGS,
    DEFAULT_SETTINGS,
  );

  const ready = Promise.all([stateReady, settingsReady]).then(() => undefined);

  const now = ref(Date.now());
  const tickId = setInterval(() => {
    now.value = Date.now();
  }, 1000);
  onScopeDispose(() => clearInterval(tickId));

  const intervalMinutes = computed(() => settings.value.intervalMinutes);
  const cycleStartedAt = computed(() => state.value.cycleStartedAt);
  const activeNotificationId = computed(() => state.value.activeNotificationId);

  const nextReminderAt = computed(
    () => cycleStartedAt.value + intervalMinutes.value * 60_000,
  );

  const secondsRemaining = computed(() => {
    const ms = nextReminderAt.value - now.value;
    return Math.max(0, Math.ceil(ms / 1000));
  });

  const intervalSeconds = computed(() => intervalMinutes.value * 60);

  const progressPercent = computed(() => {
    const elapsed = intervalSeconds.value - secondsRemaining.value;
    return Math.min(
      100,
      Math.max(0, (elapsed / intervalSeconds.value) * 100),
    );
  });

  return {
    intervalMinutes,
    cycleStartedAt,
    activeNotificationId,
    nextReminderAt,
    secondsRemaining,
    progressPercent,
    ready,
  };
});
