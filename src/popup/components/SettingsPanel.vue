<script setup lang="ts">
import { ref, watch } from 'vue';
import { useSettingsStore } from '@popup/stores/settingsStore';
import {
  INTERVAL_MAX_MINUTES,
  INTERVAL_MIN_MINUTES,
  SNOOZE_MAX_MINUTES,
  SNOOZE_MIN_MINUTES,
} from '@shared/constants';

const emit = defineEmits<{ close: [] }>();

const settingsStore = useSettingsStore();

const intervalInput = ref<number>(settingsStore.intervalMinutes);
const snoozeInput = ref<number>(settingsStore.snoozeDurationMinutes);
const enabledInput = ref<boolean>(settingsStore.enabled);

// Keep local refs in sync once async storage load completes.
settingsStore.ready.then(() => {
  intervalInput.value = settingsStore.intervalMinutes;
  snoozeInput.value = settingsStore.snoozeDurationMinutes;
  enabledInput.value = settingsStore.enabled;
});

watch(
  () => [
    settingsStore.intervalMinutes,
    settingsStore.snoozeDurationMinutes,
    settingsStore.enabled,
  ],
  ([i, s, e]) => {
    intervalInput.value = i as number;
    snoozeInput.value = s as number;
    enabledInput.value = e as boolean;
  },
);

const intervalRules = [
  (v: unknown) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return 'Enter a number';
    if (n < INTERVAL_MIN_MINUTES || n > INTERVAL_MAX_MINUTES) {
      return `Must be between ${INTERVAL_MIN_MINUTES} and ${INTERVAL_MAX_MINUTES}`;
    }
    return true;
  },
];

const snoozeRules = [
  (v: unknown) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return 'Enter a number';
    if (n < SNOOZE_MIN_MINUTES || n > SNOOZE_MAX_MINUTES) {
      return `Must be between ${SNOOZE_MIN_MINUTES} and ${SNOOZE_MAX_MINUTES}`;
    }
    return true;
  },
];

async function onSave(): Promise<void> {
  await settingsStore.saveSettings({
    intervalMinutes: Number(intervalInput.value),
    snoozeDurationMinutes: Number(snoozeInput.value),
    enabled: Boolean(enabledInput.value),
  });
  emit('close');
}
</script>

<template>
  <v-card class="settings-panel" elevation="1">
    <v-card-title class="settings-panel__title">Settings</v-card-title>
    <v-card-text class="settings-panel__body">
      <v-text-field
        v-model.number="intervalInput"
        type="number"
        :min="INTERVAL_MIN_MINUTES"
        :max="INTERVAL_MAX_MINUTES"
        label="Reminder every (minutes)"
        density="comfortable"
        variant="outlined"
        :rules="intervalRules"
      />
      <v-text-field
        v-model.number="snoozeInput"
        type="number"
        :min="SNOOZE_MIN_MINUTES"
        :max="SNOOZE_MAX_MINUTES"
        label="Snooze for (minutes)"
        density="comfortable"
        variant="outlined"
        :rules="snoozeRules"
      />
      <v-switch
        v-model="enabledInput"
        label="Reminders enabled"
        color="primary"
        density="comfortable"
        hide-details
      />
      <div class="settings-panel__actions">
        <v-btn variant="text" @click="emit('close')">Cancel</v-btn>
        <v-btn color="primary" variant="flat" @click="onSave">Save</v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<style lang="scss" scoped>
@use '../styles/variables' as v;

.settings-panel {
  border-radius: v.$radius-md;
}

.settings-panel__title {
  font-size: v.$font-title;
  font-weight: 600;
  color: v.$brand-primary;
  padding: v.$space-3 v.$space-3 v.$space-2;
}

.settings-panel__body {
  display: flex;
  flex-direction: column;
  gap: v.$space-2;
  padding: v.$space-2 v.$space-3 v.$space-3;
}

.settings-panel__actions {
  display: flex;
  justify-content: flex-end;
  gap: v.$space-2;
  padding-top: v.$space-2;
}
</style>
