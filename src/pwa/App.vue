<script setup lang="ts">
import { computed, onMounted, ref, onUnmounted, watch } from 'vue';
import { useRegisterSW } from 'virtual:pwa-register/vue';
import ExerciseCard from '@shared/components/ExerciseCard.vue';
import NotificationPermissionBanner from '@pwa/components/NotificationPermissionBanner.vue';
import BackgroundSyncNotice from '@pwa/components/BackgroundSyncNotice.vue';
import { usePwaSettingsStore } from '@pwa/stores/settingsStore';
import { usePwaScheduleStore } from '@pwa/stores/scheduleStore';
import { EXERCISES } from '@shared/exercises';
import {
  INTERVAL_MIN_MINUTES,
  INTERVAL_MAX_MINUTES,
  SNOOZE_MIN_MINUTES,
  SNOOZE_MAX_MINUTES,
} from '@shared/constants';

const settingsStore = usePwaSettingsStore();
const scheduleStore = usePwaScheduleStore();

const storesReady = ref(false);
const notificationPermission = ref<NotificationPermission>('default');
const periodicSyncSupported = ref(false);
const isInstalled = ref(false);
const showSettings = ref(false);
const localInterval = ref(20);
const localSnooze = ref(5);
const localEnabled = ref(true);

let foregroundTimer: ReturnType<typeof setTimeout> | null = null;
let snoozeTimer: ReturnType<typeof setTimeout> | null = null;

// T030: Service worker update registration
const { needRefresh, updateServiceWorker } = useRegisterSW();

async function onReloadUpdate() {
  await updateServiceWorker(true);
  window.location.reload();
}

const currentExercise = computed(() => {
  return EXERCISES[scheduleStore.currentExerciseIndex % EXERCISES.length];
});

const remainingMs = ref(0);
let tickTimer: ReturnType<typeof setInterval> | null = null;

const nextReminderLabel = computed(() => {
  const mins = Math.ceil(remainingMs.value / 60_000);
  if (mins <= 0) return 'Reminder due now';
  return `Next reminder in ${mins} min`;
});

const progressPercent = computed(() => {
  if (!scheduleStore.nextFireAt || !settingsStore.intervalMinutes) return 0;
  const totalMs = settingsStore.intervalMinutes * 60_000;
  const elapsed = totalMs - remainingMs.value;
  return Math.min(100, Math.max(0, (elapsed / totalMs) * 100));
});

function startTickTimer() {
  if (tickTimer) clearInterval(tickTimer);
  tickTimer = setInterval(() => {
    if (scheduleStore.nextFireAt) {
      remainingMs.value = Math.max(0, scheduleStore.nextFireAt - Date.now());
    }
  }, 1000);
}

function startForegroundTimer() {
  if (foregroundTimer) clearTimeout(foregroundTimer);
  if (!scheduleStore.nextFireAt || !settingsStore.enabled) return;

  remainingMs.value = Math.max(0, scheduleStore.nextFireAt - Date.now());
  startTickTimer();

  const delay = Math.max(0, scheduleStore.nextFireAt - Date.now());
  foregroundTimer = setTimeout(async () => {
    await fireReminder();
  }, delay);
}

function startSnoozeTimer() {
  if (snoozeTimer) clearTimeout(snoozeTimer);
  if (!scheduleStore.snoozedUntil) return;

  const delay = Math.max(0, scheduleStore.snoozedUntil - Date.now());
  snoozeTimer = setTimeout(async () => {
    await fireReminder();
  }, delay);
}

async function fireReminder() {
  const sw = await navigator.serviceWorker.ready;
  const exercise =
    EXERCISES[scheduleStore.currentExerciseIndex % EXERCISES.length];
  await sw.showNotification(exercise.name, {
    body: exercise.steps[0],
    icon: '/icons/icon-192.png',
    actions: [
      { action: 'snooze', title: 'Snooze' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
    data: { exerciseIndex: scheduleStore.currentExerciseIndex },
  });
  await scheduleStore.recordFired();
  const intervalMs = settingsStore.intervalMinutes * 60_000;
  await scheduleStore.initSchedule(intervalMs);
  startForegroundTimer();
}

async function initApp() {
  await settingsStore.init();
  await scheduleStore.init();
  storesReady.value = true;

  // Populate local settings refs for settings panel
  localInterval.value = settingsStore.intervalMinutes;
  localSnooze.value = settingsStore.snoozeDurationMinutes;
  localEnabled.value = settingsStore.enabled;

  // Detect capabilities
  notificationPermission.value = Notification.permission;
  isInstalled.value = window.matchMedia('(display-mode: standalone)').matches;

  if ('serviceWorker' in navigator) {
    const reg = await navigator.serviceWorker.ready;
    periodicSyncSupported.value = 'periodicSync' in reg;
  }

  // Handle ?exercise= query param from notification click (H1 fix)
  const params = new URLSearchParams(window.location.search);
  const exerciseParam = params.get('exercise');
  if (exerciseParam !== null) {
    const idx = parseInt(exerciseParam, 10);
    if (!isNaN(idx)) {
      scheduleStore.currentExerciseIndex = idx % EXERCISES.length;
    }
  }

  // If permission granted and schedule not initialized, start it
  if (notificationPermission.value === 'granted') {
    const intervalMs = settingsStore.intervalMinutes * 60_000;
    await scheduleStore.initSchedule(intervalMs);
    startForegroundTimer();

    // Register periodic background sync if supported
    if (periodicSyncSupported.value) {
      try {
        const reg = await navigator.serviceWorker.ready;
        await (reg as any).periodicSync.register('eyesaver-reminder', {
          minInterval: intervalMs,
        });
      } catch {
        // Periodic sync not available or permission denied
      }
    }
  }

  // Handle snooze timer on app open
  if (scheduleStore.snoozedUntil && scheduleStore.snoozedUntil > Date.now()) {
    startSnoozeTimer();
  }

  // Handle overdue notification on app open
  if (
    scheduleStore.nextFireAt &&
    scheduleStore.nextFireAt <= Date.now() &&
    settingsStore.enabled &&
    notificationPermission.value === 'granted'
  ) {
    await fireReminder();
  }

  // Handle active notification on popup open
  if (scheduleStore.notificationActive) {
    const intervalMs = settingsStore.intervalMinutes * 60_000;
    await scheduleStore.recordPopupOpen(intervalMs);
    startForegroundTimer();
  }
}

async function requestPermission() {
  const result = await Notification.requestPermission();
  notificationPermission.value = result;
  if (result === 'granted') {
    const intervalMs = settingsStore.intervalMinutes * 60_000;
    await scheduleStore.initSchedule(intervalMs);
    startForegroundTimer();

    if (periodicSyncSupported.value) {
      try {
        const reg = await navigator.serviceWorker.ready;
        await (reg as any).periodicSync.register('eyesaver-reminder', {
          minInterval: intervalMs,
        });
      } catch {
        // Not available
      }
    }
  }
}

// T024/T026: Settings save handler for PWA
async function onSettingsSave(settings: {
  intervalMinutes: number;
  snoozeDurationMinutes: number;
  enabled: boolean;
}) {
  await settingsStore.setIntervalMinutes(settings.intervalMinutes);
  await settingsStore.setSnoozeDurationMinutes(settings.snoozeDurationMinutes);
  await settingsStore.setEnabled(settings.enabled);

  // Recalculate schedule on interval change
  const intervalMs = settings.intervalMinutes * 60_000;
  await scheduleStore.recordIntervalChange(intervalMs);
  startForegroundTimer();

  // Re-register periodic sync with new interval
  if (periodicSyncSupported.value && notificationPermission.value === 'granted' && settings.enabled) {
    try {
      const reg = await navigator.serviceWorker.ready;
      await (reg as any).periodicSync.register('eyesaver-reminder', {
        minInterval: intervalMs,
      });
    } catch {
      // ignore
    }
  }

  showSettings.value = false;
}

// Watch for enabled toggle
watch(
  () => settingsStore.enabled,
  async (val) => {
    if (!storesReady.value) return;
    if (!val) {
      if (foregroundTimer) clearTimeout(foregroundTimer);
      foregroundTimer = null;
      if (periodicSyncSupported.value) {
        try {
          const reg = await navigator.serviceWorker.ready;
          await (reg as any).periodicSync.unregister('eyesaver-reminder');
        } catch {
          // ignore
        }
      }
    } else {
      const intervalMs = settingsStore.intervalMinutes * 60_000;
      await scheduleStore.initSchedule(intervalMs);
      startForegroundTimer();
      if (
        periodicSyncSupported.value &&
        notificationPermission.value === 'granted'
      ) {
        try {
          const reg = await navigator.serviceWorker.ready;
          await (reg as any).periodicSync.register('eyesaver-reminder', {
            minInterval: intervalMs,
          });
        } catch {
          // ignore
        }
      }
    }
  },
);

onMounted(() => {
  initApp();
});

onUnmounted(() => {
  if (foregroundTimer) clearTimeout(foregroundTimer);
  if (snoozeTimer) clearTimeout(snoozeTimer);
  if (tickTimer) clearInterval(tickTimer);
});
</script>

<template>
  <v-app>
    <div class="pwa-root">
      <header class="pwa-toolbar">
        <span class="pwa-title">EyeSaver</span>
        <v-btn
          icon
          variant="text"
          size="small"
          :aria-label="showSettings ? 'Close settings' : 'Open settings'"
          @click="showSettings = !showSettings"
        >
          <span aria-hidden="true">⚙️</span>
        </v-btn>
      </header>

      <!-- Update banner (T030) -->
      <v-alert
        v-if="needRefresh"
        type="info"
        variant="tonal"
        density="comfortable"
        class="pwa-update-banner"
        closable
        @click:close="needRefresh = false"
      >
        <template #text>
          <div class="pwa-update-banner__content">
            <span>A new version is available.</span>
            <v-btn
              variant="flat"
              color="primary"
              size="small"
              @click="onReloadUpdate"
            >
              Update now
            </v-btn>
          </div>
        </template>
      </v-alert>

      <!-- Permission banners (T020, T021, T022) -->
      <NotificationPermissionBanner
        v-if="storesReady"
        :permission="notificationPermission"
        @request-permission="requestPermission"
      />

      <BackgroundSyncNotice
        v-if="storesReady"
        :show="!periodicSyncSupported && notificationPermission === 'granted'"
      />

      <!-- Progress indicator (T031) -->
      <div
        v-if="
          storesReady &&
          scheduleStore.nextFireAt &&
          notificationPermission === 'granted' &&
          settingsStore.enabled
        "
        class="pwa-progress"
      >
        <span class="pwa-progress__label">{{ nextReminderLabel }}</span>
        <v-progress-linear
          :model-value="progressPercent"
          color="teal"
          height="8"
          rounded
        />
      </div>

      <!-- Main content -->
      <main v-if="storesReady" class="pwa-body">
        <template v-if="showSettings">
          <v-card class="settings-panel" elevation="1">
            <v-card-title class="settings-panel__title">Settings</v-card-title>
            <v-card-text class="settings-panel__body">
              <v-text-field
                v-model.number="localInterval"
                type="number"
                :min="INTERVAL_MIN_MINUTES"
                :max="INTERVAL_MAX_MINUTES"
                label="Reminder every (minutes)"
                density="comfortable"
                variant="outlined"
              />
              <v-text-field
                v-model.number="localSnooze"
                type="number"
                :min="SNOOZE_MIN_MINUTES"
                :max="SNOOZE_MAX_MINUTES"
                label="Snooze for (minutes)"
                density="comfortable"
                variant="outlined"
              />
              <v-switch
                v-model="localEnabled"
                label="Reminders enabled"
                color="primary"
                density="comfortable"
                hide-details
              />
              <div class="settings-panel__actions">
                <v-btn variant="text" @click="showSettings = false">Cancel</v-btn>
                <v-btn
                  color="primary"
                  variant="flat"
                  @click="onSettingsSave({ intervalMinutes: localInterval, snoozeDurationMinutes: localSnooze, enabled: localEnabled })"
                >
                  Save
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
        </template>
        <template v-else>
          <ExerciseCard :exercise="currentExercise" />
        </template>
      </main>
    </div>
  </v-app>
</template>

<style scoped>
.pwa-root {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 100vh;
  box-sizing: border-box;
}

.pwa-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px;
}

.pwa-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #00897b;
}

.pwa-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
}

.pwa-progress {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.pwa-progress__label {
  font-size: 13px;
  font-weight: 500;
  color: #00897b;
}

.pwa-update-banner__content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.settings-panel__title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #00897b;
  padding: 12px 12px 8px;
}

.settings-panel__body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 12px 12px;
}

.settings-panel__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 8px;
}

/* Responsive: tablet and up */
@media (min-width: 600px) {
  .pwa-root {
    max-width: 720px;
    padding: 32px 40px;
    gap: 20px;
  }

  .pwa-title {
    font-size: 1.5rem;
  }

  .pwa-progress__label {
    font-size: 14px;
  }
}

/* Responsive: desktop */
@media (min-width: 960px) {
  .pwa-root {
    max-width: 800px;
    padding: 40px 60px;
  }
}
</style>
