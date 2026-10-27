import { watch } from 'vue';
import type { createVuetify } from 'vuetify';
import { useAppTheme } from './index';

// Mirrors the CSS palette in src/shared/styles/_theme.scss for Vuetify
// components, which read colours from their own `--v-theme-*` variables.
export const vuetifyThemes = {
  light: {
    dark: false,
    colors: {
      primary: '#00796B',
      'on-primary': '#FFFFFF',
      background: '#FAFAFA',
      surface: '#FFFFFF',
      'on-background': '#1F2933',
      'on-surface': '#1F2933',
      error: '#B3261E',
      warning: '#8A5300',
      info: '#0B6BCB',
      success: '#1B6E3A',
    },
  },
  dark: {
    dark: true,
    colors: {
      primary: '#4DB6AC',
      'on-primary': '#0B1F1C',
      background: '#121816',
      surface: '#1C2421',
      'on-background': '#E6EDF3',
      'on-surface': '#E6EDF3',
      error: '#F2B8B5',
      warning: '#FFB74D',
      info: '#90CAF9',
      success: '#81C995',
    },
  },
};

/** Keeps Vuetify's active theme in step with the resolved EyeSaver theme. */
export function bindVuetifyTheme(vuetify: ReturnType<typeof createVuetify>): void {
  const { resolved } = useAppTheme();
  watch(
    resolved,
    (name) => {
      vuetify.theme.global.name.value = name;
    },
    { immediate: true },
  );
}
