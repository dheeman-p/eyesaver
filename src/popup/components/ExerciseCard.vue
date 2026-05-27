<script setup lang="ts">
import type { Exercise } from '@shared/types';

defineProps<{ exercise: Exercise }>();

const EXERCISE_ICONS: Record<number, string> = {
  // 20-20-20 Rule — clock face
  0: `<circle cx="12" cy="12" r="9.5" stroke="currentColor" stroke-width="1.5" fill="none"/>
      <line x1="12" y1="3.5" x2="12" y2="5.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="12" y1="12" x2="16.2" y2="16.2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="12" y1="12" x2="12" y2="7.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <circle cx="12" cy="12" r="1" fill="currentColor"/>`,

  // Palming — cupped hands with warmth lines
  1: `<path d="M4 14 C4 10 7 8 10 9 L10 16 C8 17 6 17 4 14Z" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linejoin="round"/>
      <path d="M20 14 C20 10 17 8 14 9 L14 16 C16 17 18 17 20 14Z" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linejoin="round"/>
      <path d="M9 6.5 Q10 5 11 6.5" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linecap="round"/>
      <path d="M12 5.5 Q13 4 14 5.5" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linecap="round"/>`,

  // Conscious Blinking — eye with upward motion lines
  2: `<path d="M2 12 C5 7 19 7 22 12 C19 17 5 17 2 12Z" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linejoin="round"/>
      <circle cx="12" cy="12" r="2.8" stroke="currentColor" stroke-width="1.5" fill="none"/>
      <circle cx="12" cy="12" r="1" fill="currentColor"/>
      <line x1="9" y1="8.5" x2="9" y2="7" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
      <line x1="12" y1="7.8" x2="12" y2="6.3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
      <line x1="15" y1="8.5" x2="15" y2="7" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>`,

  // Figure-Eight Tracking — horizontal infinity loop
  3: `<path d="M5 12 C5 8.5 8 7 10 9 C11 10 12 12 12 12 C12 12 13 14 14 15 C16 17 19 15.5 19 12 C19 8.5 16 7 14 9 C13 10 12 12 12 12 C12 12 11 14 10 15 C8 17 5 15.5 5 12Z" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linejoin="round"/>`,

  // Near-Far Focus Shift — small circle + arrow + distant mountain
  4: `<circle cx="7" cy="14" r="2.5" stroke="currentColor" stroke-width="1.5" fill="none"/>
      <line x1="10.5" y1="14" x2="13.5" y2="14" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
      <polyline points="12.5,13 13.5,14 12.5,15" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linejoin="round" stroke-linecap="round"/>
      <polyline points="15,17 18.5,10 22,17" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linejoin="round" stroke-linecap="round"/>
      <line x1="14" y1="17" x2="23" y2="17" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>`,

  // Eye Rolling — eye with circular arrow
  5: `<path d="M5 12 C7.5 8.5 16.5 8.5 19 12 C16.5 15.5 7.5 15.5 5 12Z" stroke="currentColor" stroke-width="1.5" fill="none"/>
      <circle cx="12" cy="12" r="2" stroke="currentColor" stroke-width="1.5" fill="none"/>
      <path d="M12 4 A8 8 0 1 1 4.5 9" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <polyline points="3,7.5 4.5,9 6,7.8" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`,
};

const FALLBACK_ICON = `<circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.5" fill="none"/>
  <path d="M2 12 C5 7 19 7 22 12 C19 17 5 17 2 12Z" stroke="currentColor" stroke-width="1.5" fill="none"/>`;
</script>

<template>
  <v-card class="exercise-card" elevation="1">
    <v-card-text class="exercise-card__header">
      <div class="exercise-card__icon-wrap" aria-hidden="true">
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          v-html="EXERCISE_ICONS[exercise.index] ?? FALLBACK_ICON"
        />
      </div>
      <h2 class="exercise-card__title">{{ exercise.name }}</h2>
      <span class="exercise-card__badge" aria-label="Duration">
        {{ exercise.durationSeconds }}&thinsp;s
      </span>
    </v-card-text>

    <div class="exercise-card__tagline">{{ exercise.description }}</div>

    <v-divider class="exercise-card__divider" />

    <ol class="exercise-card__steps" aria-label="Steps">
      <li
        v-for="(step, idx) in exercise.steps"
        :key="idx"
        class="exercise-card__step"
      >
        <span class="exercise-card__step-number" aria-hidden="true">{{ idx + 1 }}</span>
        <span class="exercise-card__step-text">{{ step }}</span>
      </li>
    </ol>
  </v-card>
</template>

<style lang="scss" scoped>
@use '../styles/variables' as v;

.exercise-card {
  border-radius: v.$radius-md;
  overflow: hidden;
  padding: 0;
}

.exercise-card__header {
  display: flex;
  align-items: center;
  gap: v.$space-2;
  padding: v.$space-3 v.$space-3 v.$space-2 !important;
}

.exercise-card__icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: rgba(0, 137, 123, 0.12);
  color: v.$brand-primary;
  flex-shrink: 0;
}

.exercise-card__title {
  flex: 1;
  margin: 0;
  font-size: v.$font-title;
  font-weight: 600;
  color: v.$brand-primary;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.exercise-card__badge {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  padding: 2px v.$space-2;
  border-radius: v.$radius-sm;
  background-color: rgba(0, 137, 123, 0.10);
  color: v.$brand-primary;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  line-height: 1.5;
}

.exercise-card__tagline {
  padding: 0 v.$space-3 v.$space-2;
  font-size: v.$font-label;
  color: rgba(0, 0, 0, 0.55);
  line-height: 1.35;
}

.exercise-card__divider {
  margin: 0 v.$space-3 v.$space-2;
}

.exercise-card__steps {
  list-style: none;
  margin: 0;
  padding: 0 v.$space-3 v.$space-3;
  display: flex;
  flex-direction: column;
  gap: v.$space-2;
}

.exercise-card__step {
  display: flex;
  align-items: baseline;
  gap: v.$space-2;
}

.exercise-card__step-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background-color: v.$brand-primary;
  color: v.$brand-on-primary;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  flex-shrink: 0;
  position: relative;
  top: -1px;
}

.exercise-card__step-text {
  font-size: v.$font-label;
  line-height: 1.35;
  color: rgba(0, 0, 0, 0.80);
}
</style>
