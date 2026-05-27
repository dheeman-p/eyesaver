<script setup lang="ts">
import type { Exercise } from '@shared/types';

defineProps<{ exercise: Exercise }>();
</script>

<template>
  <v-card class="exercise-card" elevation="1">
    <v-card-title class="exercise-card__title">
      {{ exercise.name }}
    </v-card-title>

    <v-card-text class="exercise-card__body">
      <p class="exercise-card__description">{{ exercise.description }}</p>

      <v-divider class="exercise-card__divider" />

      <v-list density="compact" class="exercise-card__steps">
        <v-list-item
          v-for="(step, idx) in exercise.steps"
          :key="idx"
          class="exercise-card__step"
        >
          <span class="exercise-card__step-number">{{ idx + 1 }}.</span>
          <span class="exercise-card__step-text">{{ step }}</span>
        </v-list-item>
      </v-list>
    </v-card-text>
  </v-card>
</template>

<style lang="scss" scoped>
@use '../styles/variables' as v;

.exercise-card {
  border-radius: v.$radius-md;
  padding: v.$space-2;
}

.exercise-card__title {
  font-size: v.$font-title;
  font-weight: 600;
  color: v.$brand-primary;
  padding: v.$space-2 v.$space-3;
}

.exercise-card__body {
  padding: v.$space-2 v.$space-3 v.$space-3;
}

.exercise-card__description {
  margin: 0 0 v.$space-2 0;
  font-size: v.$font-base;
  line-height: 1.4;
}

.exercise-card__divider {
  margin: v.$space-2 0;
}

.exercise-card__steps {
  padding: 0;
  background: transparent;
}

.exercise-card__step {
  display: flex;
  align-items: flex-start;
  gap: v.$space-2;
  padding: v.$space-1 0;
  min-height: unset;
}

.exercise-card__step-number {
  font-weight: 600;
  color: v.$brand-primary;
  min-width: 20px;
  font-size: v.$font-base;
}

.exercise-card__step-text {
  font-size: v.$font-base;
  line-height: 1.4;
}
</style>
