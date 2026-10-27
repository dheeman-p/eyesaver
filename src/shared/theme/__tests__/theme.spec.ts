/// <reference types="node" />
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { THEME_STORAGE_KEY } from '@shared/constants';
import {
  applyTheme,
  readStoredPreference,
  resolveTheme,
  writeStoredPreference,
} from '../theme';

function memoryStorage(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return {
    getItem: (k: string) => (k in data ? data[k] : null),
    setItem: (k: string, v: string) => {
      data[k] = v;
    },
    data,
  };
}

type Listener = () => void;

function stubMatchMedia(initialDark: boolean) {
  const listeners = new Set<Listener>();
  const mql = {
    matches: initialDark,
    addEventListener: (_: string, cb: Listener) => listeners.add(cb),
    removeEventListener: (_: string, cb: Listener) => listeners.delete(cb),
  };
  vi.stubGlobal('matchMedia', vi.fn(() => mql));
  return {
    setDark(v: boolean) {
      mql.matches = v;
      listeners.forEach((cb) => cb());
    },
  };
}

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('readStoredPreference (default)', () => {
  it('returns system with empty storage', () => {
    expect(readStoredPreference(memoryStorage())).toBe('system');
  });

  it('returns system for an invalid stored value', () => {
    expect(
      readStoredPreference(memoryStorage({ [THEME_STORAGE_KEY]: 'purple' })),
    ).toBe('system');
  });

  it('returns system when getItem throws', () => {
    const storage = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => undefined,
    };
    expect(readStoredPreference(storage)).toBe('system');
  });

  it('returns system when storage is unavailable', () => {
    expect(readStoredPreference(undefined)).toBe('system');
  });
});

describe('writeStoredPreference (persistence)', () => {
  it('uses the shared eyesaver-theme key', () => {
    expect(THEME_STORAGE_KEY).toBe('eyesaver-theme');
  });

  it('saves and reads back the preference', () => {
    const storage = memoryStorage();
    writeStoredPreference('dark', storage);
    expect(storage.data['eyesaver-theme']).toBe('dark');
    expect(readStoredPreference(storage)).toBe('dark');
  });

  it('persists to real localStorage by default', () => {
    writeStoredPreference('light');
    expect(localStorage.getItem('eyesaver-theme')).toBe('light');
    expect(readStoredPreference()).toBe('light');
  });

  it('does not throw when setItem throws', () => {
    const storage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota');
      },
    };
    expect(() => writeStoredPreference('dark', storage)).not.toThrow();
  });
});

describe('System mode', () => {
  it('resolves system from the OS flag', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
  });

  it('explicit choices ignore the OS flag', () => {
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });

  it('applyTheme(system) follows matchMedia', () => {
    stubMatchMedia(true);
    expect(applyTheme('system')).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('applyTheme(system) falls back to light without matchMedia', () => {
    vi.stubGlobal('matchMedia', undefined);
    expect(applyTheme('system')).toBe('light');
  });

  it('applyTheme with explicit values ignores the OS', () => {
    stubMatchMedia(true);
    expect(applyTheme('light')).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
    stubMatchMedia(false);
    expect(applyTheme('dark')).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });
});

describe('useAppTheme', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  async function load() {
    const mod = await import('../index');
    return mod.useAppTheme();
  }

  it('initTheme with nothing stored follows the OS', async () => {
    stubMatchMedia(true);
    const t = await load();
    t.initTheme();
    expect(t.preference.value).toBe('system');
    expect(t.resolved.value).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('initTheme restores the stored preference', async () => {
    stubMatchMedia(false);
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    const t = await load();
    t.initTheme();
    expect(t.preference.value).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('setPreference persists, applies and updates refs', async () => {
    stubMatchMedia(false);
    const t = await load();
    t.initTheme();
    t.setPreference('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(t.preference.value).toBe('dark');
    expect(t.resolved.value).toBe('dark');
  });

  it('re-applies on OS change only while preference is system', async () => {
    const mm = stubMatchMedia(false);
    const t = await load();
    t.initTheme();
    expect(t.resolved.value).toBe('light');

    mm.setDark(true);
    expect(t.resolved.value).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');

    t.setPreference('light');
    mm.setDark(true);
    expect(t.resolved.value).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('initTheme is idempotent', async () => {
    const mm = stubMatchMedia(false);
    const t = await load();
    t.initTheme();
    t.initTheme();
    expect(window.matchMedia).toHaveBeenCalledTimes(2); // 1 for apply, 1 for listener
    mm.setDark(true);
    expect(t.resolved.value).toBe('dark');
  });

  it('follows storage events from another tab', async () => {
    stubMatchMedia(false);
    const t = await load();
    t.initTheme();
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    window.dispatchEvent(new StorageEvent('storage', { key: THEME_STORAGE_KEY }));
    expect(t.preference.value).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });
});

describe('palette parity', () => {
  it('defines the same tokens in the light and dark maps', () => {
    const scss = readFileSync(
      resolve(process.cwd(), 'src/shared/styles/_theme.scss'),
      'utf-8',
    );
    const keys = (name: string) => {
      const m = scss.match(new RegExp(`\\$${name}: \\(([\\s\\S]*?)\\n\\);`));
      expect(m).not.toBeNull();
      return [...m![1].matchAll(/^\s*'([\w-]+)':/gm)].map((x) => x[1]).sort();
    };
    const light = keys('light');
    expect(light.length).toBeGreaterThan(10);
    expect(keys('dark')).toEqual(light);
  });
});
