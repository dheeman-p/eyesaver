import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { THEME_STORAGE_KEY } from '@shared/constants';

describe('ThemeSwitcher', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    delete document.documentElement.dataset.theme;
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        matches: false,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  async function mountSwitcher() {
    const { useAppTheme } = await import('@shared/theme');
    useAppTheme().initTheme();
    const { default: ThemeSwitcher } = await import(
      '@shared/components/ThemeSwitcher.vue'
    );
    return mount(ThemeSwitcher);
  }

  it('renders three radios in a labelled radiogroup', async () => {
    const wrapper = await mountSwitcher();
    expect(wrapper.find('[role="radiogroup"]').attributes('aria-label')).toBe(
      'Theme',
    );
    const radios = wrapper.findAll('[role="radio"]');
    expect(radios.map((r) => r.text())).toEqual(['System', 'Light', 'Dark']);
  });

  it('checks System by default', async () => {
    const wrapper = await mountSwitcher();
    const checked = wrapper
      .findAll('[role="radio"]')
      .filter((r) => r.attributes('aria-checked') === 'true');
    expect(checked.map((r) => r.text())).toEqual(['System']);
  });

  it('checks the radio matching the stored preference', async () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
    const wrapper = await mountSwitcher();
    const checked = wrapper
      .findAll('[role="radio"]')
      .filter((r) => r.attributes('aria-checked') === 'true');
    expect(checked.map((r) => r.text())).toEqual(['Light']);
  });

  it('clicking Dark persists and applies the theme', async () => {
    const wrapper = await mountSwitcher();
    const dark = wrapper.findAll('[role="radio"]').find((r) => r.text() === 'Dark')!;
    await dark.trigger('click');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(dark.attributes('aria-checked')).toBe('true');
  });
});
