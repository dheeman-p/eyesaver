import { THEME_STORAGE_KEY } from '@shared/constants';
import type { ResolvedTheme, ThemePreference } from '@shared/types';

export const THEME_PREFERENCES: readonly ThemePreference[] = [
  'system',
  'light',
  'dark',
];

const DARK_QUERY = '(prefers-color-scheme: dark)';

type ThemeStorage = Pick<Storage, 'getItem' | 'setItem'>;

function isThemePreference(value: unknown): value is ThemePreference {
  return (
    typeof value === 'string' &&
    (THEME_PREFERENCES as readonly string[]).includes(value)
  );
}

function defaultStorage(): ThemeStorage | undefined {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage;
  } catch {
    // Accessing localStorage can throw when storage is blocked.
    return undefined;
  }
}

/** Returns the saved preference, or 'system' when missing, invalid or unreadable. */
export function readStoredPreference(
  storage: ThemeStorage | undefined = defaultStorage(),
): ThemePreference {
  try {
    const value = storage?.getItem(THEME_STORAGE_KEY);
    return isThemePreference(value) ? value : 'system';
  } catch {
    return 'system';
  }
}

/** Saves the preference. Failures (blocked storage, quota) are ignored. */
export function writeStoredPreference(
  pref: ThemePreference,
  storage: ThemeStorage | undefined = defaultStorage(),
): void {
  try {
    storage?.setItem(THEME_STORAGE_KEY, pref);
  } catch {
    // Theme still applies for this session; it just will not persist.
  }
}

export function systemPrefersDark(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia(DARK_QUERY).matches;
}

export function resolveTheme(
  pref: ThemePreference,
  prefersDark: boolean,
): ResolvedTheme {
  if (pref === 'system') return prefersDark ? 'dark' : 'light';
  return pref;
}

/** Sets `data-theme` on the root element and returns the resolved theme. */
export function applyTheme(
  pref: ThemePreference,
  root: HTMLElement = document.documentElement,
): ResolvedTheme {
  const resolved = resolveTheme(pref, systemPrefersDark());
  root.dataset.theme = resolved;
  return resolved;
}

export { DARK_QUERY };
