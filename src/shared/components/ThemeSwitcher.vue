<script setup lang="ts">
import { useAppTheme } from '@shared/theme';
import type { ThemePreference } from '@shared/types';

const { preference, setPreference } = useAppTheme();

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];
</script>

<template>
  <div class="theme-switcher">
    <span class="theme-switcher__label" aria-hidden="true">Theme</span>
    <div class="theme-switcher__group" role="radiogroup" aria-label="Theme">
      <button
        v-for="opt in OPTIONS"
        :key="opt.value"
        type="button"
        role="radio"
        class="theme-switcher__option"
        :class="{ 'theme-switcher__option--active': preference === opt.value }"
        :aria-checked="preference === opt.value"
        @click="setPreference(opt.value)"
      >
        {{ opt.label }}
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../styles/variables' as v;

.theme-switcher {
  display: flex;
  flex-direction: column;
  gap: v.$space-1;
}

.theme-switcher__label {
  font-size: v.$font-label;
  color: var(--es-text-secondary);
}

.theme-switcher__group {
  display: flex;
  border: 1px solid var(--es-border);
  border-radius: v.$radius-md;
  overflow: hidden;
}

.theme-switcher__option {
  flex: 1;
  padding: v.$space-2 v.$space-3;
  border: 0;
  border-left: 1px solid var(--es-border);
  background: transparent;
  color: var(--es-text);
  font: inherit;
  font-size: v.$font-label;
  cursor: pointer;

  &:first-child {
    border-left: 0;
  }

  &:hover {
    background: var(--es-primary-tint-strong);
  }

  &:focus-visible {
    outline: 2px solid var(--es-primary);
    outline-offset: -2px;
  }
}

.theme-switcher__option--active {
  background: var(--es-primary);
  color: var(--es-on-primary);
  font-weight: 600;

  &:hover {
    background: var(--es-primary);
  }
}
</style>
