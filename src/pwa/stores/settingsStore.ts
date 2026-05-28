import { defineStore } from 'pinia';
import { ref } from 'vue';
import { getItem, setItem } from '@pwa/composables/useIDBStorage';
import {
  INTERVAL_MIN_MINUTES,
  INTERVAL_MAX_MINUTES,
  SNOOZE_MIN_MINUTES,
  SNOOZE_MAX_MINUTES,
} from '@shared/constants';

export const usePwaSettingsStore = defineStore('pwa-settings', () => {
  const intervalMinutes = ref(20);
  const snoozeDurationMinutes = ref(5);
  const enabled = ref(true);
  const ready = ref(false);

  async function init() {
    const interval = await getItem<number>('settings', 'intervalMinutes');
    if (interval !== undefined) intervalMinutes.value = interval;

    const snooze = await getItem<number>('settings', 'snoozeDurationMinutes');
    if (snooze !== undefined) snoozeDurationMinutes.value = snooze;

    const en = await getItem<boolean>('settings', 'enabled');
    if (en !== undefined) enabled.value = en;

    ready.value = true;
  }

  async function setIntervalMinutes(value: number) {
    if (value < INTERVAL_MIN_MINUTES || value > INTERVAL_MAX_MINUTES) return;
    intervalMinutes.value = value;
    await setItem('settings', 'intervalMinutes', value);
  }

  async function setSnoozeDurationMinutes(value: number) {
    if (value < SNOOZE_MIN_MINUTES || value > SNOOZE_MAX_MINUTES) return;
    snoozeDurationMinutes.value = value;
    await setItem('settings', 'snoozeDurationMinutes', value);
  }

  async function setEnabled(value: boolean) {
    enabled.value = value;
    await setItem('settings', 'enabled', value);
  }

  return {
    intervalMinutes,
    snoozeDurationMinutes,
    enabled,
    ready,
    init,
    setIntervalMinutes,
    setSnoozeDurationMinutes,
    setEnabled,
  };
});
