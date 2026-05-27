import { computed } from 'vue';
import { defineStore } from 'pinia';
import { useStorage } from '@popup/composables/useStorage';
import {
  DEFAULT_SETTINGS,
  INTERVAL_MAX_MINUTES,
  INTERVAL_MIN_MINUTES,
  SNOOZE_MAX_MINUTES,
  SNOOZE_MIN_MINUTES,
  STORAGE_KEY_SETTINGS,
} from '@shared/constants';
import type { UserSettings } from '@shared/types';

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export const useSettingsStore = defineStore('settings', () => {
  const { value: settings, set, ready } = useStorage<UserSettings>(
    STORAGE_KEY_SETTINGS,
    DEFAULT_SETTINGS,
  );

  const intervalMinutes = computed(() => settings.value.intervalMinutes);
  const snoozeDurationMinutes = computed(
    () => settings.value.snoozeDurationMinutes,
  );
  const enabled = computed(() => settings.value.enabled);

  async function saveSettings(partial: Partial<UserSettings>): Promise<void> {
    const merged: UserSettings = {
      ...settings.value,
      ...partial,
    };
    merged.intervalMinutes = clamp(
      merged.intervalMinutes,
      INTERVAL_MIN_MINUTES,
      INTERVAL_MAX_MINUTES,
    );
    merged.snoozeDurationMinutes = clamp(
      merged.snoozeDurationMinutes,
      SNOOZE_MIN_MINUTES,
      SNOOZE_MAX_MINUTES,
    );
    merged.enabled = Boolean(merged.enabled);
    await set(merged);
  }

  return {
    intervalMinutes,
    snoozeDurationMinutes,
    enabled,
    saveSettings,
    ready,
  };
});
