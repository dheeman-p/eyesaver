<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { mdiCog } from '@mdi/js';
import ExerciseCard from '@shared/components/ExerciseCard.vue';
import CountdownTimer from '@shared/components/CountdownTimer.vue';
import SettingsPanel from '@shared/components/SettingsPanel.vue';
import { useExerciseStore } from './stores/exerciseStore';
import { useScheduleStore } from './stores/scheduleStore';
import {
  ALARM_NAME,
  NOTIFICATION_ID,
  STORAGE_KEY_STATE,
} from '@shared/constants';
import type { ReminderState } from '@shared/types';

const exerciseStore = useExerciseStore();
const scheduleStore = useScheduleStore();

const showSettings = ref(false);
const permissionDenied = ref(false);

onMounted(async () => {
  // Wait for both stores to load from chrome.storage.local before reading.
  await Promise.all([exerciseStore.ready, scheduleStore.ready]);

  // T028: notification-permission-denied UX
  chrome.notifications.getPermissionLevel((level) => {
    permissionDenied.value = level === 'denied';
  });

  // T019: popup acknowledges any active notification (clear + reset timer + advance)
  if (scheduleStore.activeNotificationId !== null) {
    await chrome.notifications.clear(NOTIFICATION_ID);
    await chrome.alarms.clear(ALARM_NAME);
    await chrome.alarms.create(ALARM_NAME, {
      delayInMinutes: scheduleStore.intervalMinutes,
    });

    const nextState: ReminderState = {
      cycleStartedAt: Date.now(),
      currentExerciseIndex: exerciseStore.currentExerciseIndex,
      activeNotificationId: null,
    };
    await chrome.storage.local.set({ [STORAGE_KEY_STATE]: nextState });
    await exerciseStore.advance();
  }
});

const idleView = computed(() => !showSettings.value);
</script>

<template>
  <v-app>
    <div class="popup-root">
      <header class="popup-toolbar">
        <span class="popup-title">EyeSaver</span>
        <v-btn
          icon
          variant="text"
          size="small"
          :aria-label="showSettings ? 'Close settings' : 'Open settings'"
          @click="showSettings = !showSettings"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path :d="mdiCog" fill="currentColor" />
          </svg>
        </v-btn>
      </header>

      <v-alert
        v-if="permissionDenied"
        type="warning"
        variant="tonal"
        class="permission-alert"
      >
        Reminders are blocked — enable Chrome notifications in your OS settings
        to receive eye-break reminders.
      </v-alert>

      <main class="popup-body">
        <template v-if="idleView">
          <ExerciseCard :exercise="exerciseStore.currentExercise" />
          <CountdownTimer v-if="!permissionDenied" />
        </template>
        <SettingsPanel v-else @close="showSettings = false" />
      </main>
    </div>
  </v-app>
</template>

<style lang="scss" scoped>
@use './styles/variables' as v;

.popup-root {
  width: 100%;
  padding: v.$space-3;
  display: flex;
  flex-direction: column;
  gap: v.$space-2;
}

.popup-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 v.$space-1;
}

.popup-title {
  font-size: v.$font-title;
  font-weight: 600;
  color: v.$brand-primary;
}

.permission-alert {
  font-size: v.$font-label;
}

.popup-body {
  display: flex;
  flex-direction: column;
  gap: v.$space-2;
}
</style>
