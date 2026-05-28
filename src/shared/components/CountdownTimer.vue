<script setup lang="ts">
import { computed } from 'vue';
import { useScheduleStore } from '@popup/stores/scheduleStore';

const scheduleStore = useScheduleStore();

const formattedRemaining = computed(() => {
  const total = scheduleStore.secondsRemaining;
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
});

// First-install / pre-first-alarm fallback label. Since cycleStartedAt is
// set on install AND on every alarm fire, comparing `now` to the implied
// next-fire still produces an accurate countdown for the very first cycle.
const label = computed(() => {
  if (scheduleStore.secondsRemaining <= 0) {
    return 'Reminder due now';
  }
  return `Next reminder in ${formattedRemaining.value}`;
});
</script>

<template>
  <div class="countdown" role="status" aria-live="polite">
    <v-progress-linear
      :model-value="scheduleStore.progressPercent"
      color="primary"
      height="6"
      rounded
    />
    <span class="countdown__label">{{ label }}</span>
  </div>
</template>

<style lang="scss" scoped>
@use '../styles/variables' as v;

.countdown {
  display: flex;
  flex-direction: column;
  gap: v.$space-1;
  padding: v.$space-2 v.$space-3;
}

.countdown__label {
  font-size: v.$font-label;
  color: rgba(0, 0, 0, 0.7);
}
</style>
