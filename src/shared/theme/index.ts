import { ref } from 'vue';
import { THEME_STORAGE_KEY } from '@shared/constants';
import type { ResolvedTheme, ThemePreference } from '@shared/types';
import {
  DARK_QUERY,
  applyTheme,
  readStoredPreference,
  writeStoredPreference,
} from './theme';

export * from './theme';

const preference = ref<ThemePreference>('system');
const resolved = ref<ResolvedTheme>('light');
let initialised = false;

function sync(): void {
  resolved.value = applyTheme(preference.value);
}

/**
 * Reads the stored preference, applies it and starts following OS and
 * cross-tab changes. Safe to call more than once.
 */
function initTheme(): void {
  if (initialised) return;
  initialised = true;

  preference.value = readStoredPreference();
  sync();

  if (typeof window === 'undefined') return;

  if (typeof window.matchMedia === 'function') {
    const mql = window.matchMedia(DARK_QUERY);
    const onChange = (): void => {
      if (preference.value === 'system') sync();
    };
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', onChange);
    } else if (typeof mql.addListener === 'function') {
      mql.addListener(onChange);
    }
  }

  window.addEventListener('storage', (e: StorageEvent) => {
    if (e.key !== THEME_STORAGE_KEY) return;
    preference.value = readStoredPreference();
    sync();
  });
}

function setPreference(pref: ThemePreference): void {
  preference.value = pref;
  writeStoredPreference(pref);
  sync();
}

/** Shared theme state. Named to avoid clashing with Vuetify's `useTheme`. */
export function useAppTheme() {
  return { preference, resolved, setPreference, initTheme };
}
