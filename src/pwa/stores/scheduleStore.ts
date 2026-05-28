import { defineStore } from 'pinia';
import { ref } from 'vue';
import { getItem, setItem } from '@pwa/composables/useIDBStorage';
import { EXERCISES } from '@shared/exercises';

export const usePwaScheduleStore = defineStore('pwa-schedule', () => {
  const nextFireAt = ref<number | null>(null);
  const snoozedUntil = ref<number | null>(null);
  const currentExerciseIndex = ref(0);
  const notificationActive = ref(false);
  const ready = ref(false);

  async function init() {
    const nf = await getItem<number | null>('state', 'nextFireAt');
    if (nf !== undefined) nextFireAt.value = nf;

    const su = await getItem<number | null>('state', 'snoozedUntil');
    if (su !== undefined) snoozedUntil.value = su;

    const idx = await getItem<number>('state', 'currentExerciseIndex');
    if (idx !== undefined) currentExerciseIndex.value = idx;

    const na = await getItem<boolean>('state', 'notificationActive');
    if (na !== undefined) notificationActive.value = na;

    ready.value = true;
  }

  /**
   * Idempotent schedule initialization.
   * No-op if nextFireAt is already set and in the future (M4 fix).
   */
  async function initSchedule(intervalMs: number) {
    if (nextFireAt.value !== null && nextFireAt.value > Date.now()) {
      return;
    }
    nextFireAt.value = Date.now() + intervalMs;
    await setItem('state', 'nextFireAt', nextFireAt.value);
  }

  async function recordFired() {
    currentExerciseIndex.value =
      (currentExerciseIndex.value + 1) % EXERCISES.length;
    notificationActive.value = true;
    snoozedUntil.value = null;

    await setItem('state', 'currentExerciseIndex', currentExerciseIndex.value);
    await setItem('state', 'notificationActive', true);
    await setItem('state', 'snoozedUntil', null);
  }

  async function recordSnooze(snoozeDurationMs: number) {
    snoozedUntil.value = Date.now() + snoozeDurationMs;
    notificationActive.value = false;

    await setItem('state', 'snoozedUntil', snoozedUntil.value);
    await setItem('state', 'notificationActive', false);
  }

  async function recordDismiss(intervalMs: number) {
    nextFireAt.value = Date.now() + intervalMs;
    notificationActive.value = false;
    snoozedUntil.value = null;

    await setItem('state', 'nextFireAt', nextFireAt.value);
    await setItem('state', 'notificationActive', false);
    await setItem('state', 'snoozedUntil', null);
  }

  async function recordPopupOpen(intervalMs: number) {
    notificationActive.value = false;
    nextFireAt.value = Date.now() + intervalMs;

    await setItem('state', 'notificationActive', false);
    await setItem('state', 'nextFireAt', nextFireAt.value);
  }

  async function recordIntervalChange(newIntervalMs: number) {
    nextFireAt.value = Date.now() + newIntervalMs;
    await setItem('state', 'nextFireAt', nextFireAt.value);
  }

  return {
    nextFireAt,
    snoozedUntil,
    currentExerciseIndex,
    notificationActive,
    ready,
    init,
    initSchedule,
    recordFired,
    recordSnooze,
    recordDismiss,
    recordPopupOpen,
    recordIntervalChange,
  };
});
