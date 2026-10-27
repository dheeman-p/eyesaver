import { describe, it, expect, vi, beforeEach } from 'vitest';
import { nextTick, reactive } from 'vue';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import SettingsPanel from '@shared/components/SettingsPanel.vue';
import {
  INTERVAL_MAX_MINUTES,
  INTERVAL_MIN_MINUTES,
  SNOOZE_MAX_MINUTES,
  SNOOZE_MIN_MINUTES,
} from '@shared/constants';
import { vuetifyStubs } from '../../../test/vuetifyStubs';

const mockStore = reactive({
  intervalMinutes: 20,
  snoozeDurationMinutes: 5,
  enabled: true,
  ready: Promise.resolve() as Promise<void>,
  saveSettings: vi.fn(),
});

vi.mock('@popup/stores/settingsStore', () => ({
  useSettingsStore: () => mockStore,
}));

// Mounts and lets the component's one-off `settingsStore.ready.then(...)` sync
// run, so it cannot overwrite values a test types in afterwards.
async function mountPanel() {
  const wrapper = mount(SettingsPanel, { global: { components: vuetifyStubs } });
  await flushPromises();
  return wrapper;
}

function fields(wrapper: VueWrapper) {
  const [interval, snooze] = wrapper.findAll('[data-stub="VTextField"]');
  return { interval, snooze };
}

function buttonByText(wrapper: VueWrapper, text: string) {
  const button = wrapper.findAll('button').find((b) => b.text() === text);
  if (!button) throw new Error(`Button "${text}" not found`);
  return button;
}

describe('SettingsPanel', () => {
  beforeEach(() => {
    mockStore.intervalMinutes = 20;
    mockStore.snoozeDurationMinutes = 5;
    mockStore.enabled = true;
    mockStore.ready = Promise.resolve();
    mockStore.saveSettings = vi.fn().mockResolvedValue(undefined);
  });

  describe('defaults', () => {
    it('renders the title', async () => {
      const wrapper = await mountPanel();
      expect(wrapper.find('.settings-panel__title').text()).toBe('Settings');
    });

    it('shows store values and labels in the fields', async () => {
      const wrapper = await mountPanel();
      const { interval, snooze } = fields(wrapper);
      expect(interval.find('label').text()).toBe('Reminder every (minutes)');
      expect(snooze.find('label').text()).toBe('Snooze for (minutes)');
      expect((interval.find('input').element as HTMLInputElement).value).toBe('20');
      expect((snooze.find('input').element as HTMLInputElement).value).toBe('5');
    });

    it('passes number type and min/max constants to the fields', async () => {
      const wrapper = await mountPanel();
      const { interval, snooze } = fields(wrapper);
      expect(interval.find('input').attributes('data-input-type')).toBe('number');
      expect(interval.find('input').attributes('min')).toBe(String(INTERVAL_MIN_MINUTES));
      expect(interval.find('input').attributes('max')).toBe(String(INTERVAL_MAX_MINUTES));
      expect(snooze.find('input').attributes('min')).toBe(String(SNOOZE_MIN_MINUTES));
      expect(snooze.find('input').attributes('max')).toBe(String(SNOOZE_MAX_MINUTES));
    });

    it('renders the enabled switch checked with its label', async () => {
      const wrapper = await mountPanel();
      const sw = wrapper.find('[data-stub="VSwitch"]');
      expect(sw.text()).toBe('Reminders enabled');
      expect((sw.find('input').element as HTMLInputElement).checked).toBe(true);
    });

    it('renders unchecked switch when the store has reminders disabled', async () => {
      mockStore.enabled = false;
      const wrapper = await mountPanel();
      expect((wrapper.find('input[type="checkbox"]').element as HTMLInputElement).checked).toBe(false);
    });

    it('renders Cancel and Save buttons', async () => {
      const wrapper = await mountPanel();
      expect(wrapper.findAll('button').map((b) => b.text())).toEqual(['Cancel', 'Save']);
    });
  });

  describe('store sync', () => {
    it('updates the inputs when the store values change', async () => {
      const wrapper = await mountPanel();
      mockStore.intervalMinutes = 45;
      mockStore.snoozeDurationMinutes = 10;
      mockStore.enabled = false;
      await nextTick();

      const { interval, snooze } = fields(wrapper);
      expect((interval.find('input').element as HTMLInputElement).value).toBe('45');
      expect((snooze.find('input').element as HTMLInputElement).value).toBe('10');
      expect((wrapper.find('input[type="checkbox"]').element as HTMLInputElement).checked).toBe(false);
    });

    it('picks up the loaded values once the store is ready', async () => {
      let resolveReady!: () => void;
      mockStore.ready = new Promise<void>((resolve) => {
        resolveReady = resolve;
      });
      const wrapper = await mountPanel();

      // Simulate storage load finishing: values change non-reactively-visible
      // to the watcher first, then ready resolves.
      mockStore.intervalMinutes = 30;
      resolveReady();
      await flushPromises();

      expect((fields(wrapper).interval.find('input').element as HTMLInputElement).value).toBe('30');
    });
  });

  describe('interval validation', () => {
    async function errorFor(value: string): Promise<string> {
      const wrapper = await mountPanel();
      await fields(wrapper).interval.find('input').setValue(value);
      return fields(wrapper).interval.find('.error').text();
    }

    it('shows no error for the default value', async () => {
      const wrapper = await mountPanel();
      expect(fields(wrapper).interval.find('.error').text()).toBe('');
    });

    it.each(['15', '90', '45'])('accepts %s', async (value) => {
      expect(await errorFor(value)).toBe('');
    });

    it.each(['14', '91', '0', '-5'])('rejects %s as out of range', async (value) => {
      expect(await errorFor(value)).toBe('Must be between 15 and 90');
    });

    it('rejects non-numeric input', async () => {
      expect(await errorFor('abc')).toBe('Enter a number');
    });
  });

  describe('snooze validation', () => {
    async function errorFor(value: string): Promise<string> {
      const wrapper = await mountPanel();
      await fields(wrapper).snooze.find('input').setValue(value);
      return fields(wrapper).snooze.find('.error').text();
    }

    it('shows no error for the default value', async () => {
      const wrapper = await mountPanel();
      expect(fields(wrapper).snooze.find('.error').text()).toBe('');
    });

    it.each(['2', '15', '8'])('accepts %s', async (value) => {
      expect(await errorFor(value)).toBe('');
    });

    it.each(['1', '16', '0'])('rejects %s as out of range', async (value) => {
      expect(await errorFor(value)).toBe('Must be between 2 and 15');
    });

    it('rejects non-numeric input', async () => {
      expect(await errorFor('abc')).toBe('Enter a number');
    });
  });

  describe('save', () => {
    it('saves the edited values as numbers and then emits close', async () => {
      const wrapper = await mountPanel();
      const { interval, snooze } = fields(wrapper);
      await interval.find('input').setValue('30');
      await snooze.find('input').setValue('10');
      await wrapper.find('input[type="checkbox"]').setValue(false);

      await buttonByText(wrapper, 'Save').trigger('click');
      await flushPromises();

      expect(mockStore.saveSettings).toHaveBeenCalledTimes(1);
      expect(mockStore.saveSettings).toHaveBeenCalledWith({
        intervalMinutes: 30,
        snoozeDurationMinutes: 10,
        enabled: false,
      });
      expect(wrapper.emitted('close')).toHaveLength(1);
    });

    it('saves the unchanged store values when nothing was edited', async () => {
      const wrapper = await mountPanel();
      await buttonByText(wrapper, 'Save').trigger('click');
      await flushPromises();
      expect(mockStore.saveSettings).toHaveBeenCalledWith({
        intervalMinutes: 20,
        snoozeDurationMinutes: 5,
        enabled: true,
      });
    });

    it('emits close only after saveSettings resolves', async () => {
      let resolveSave!: () => void;
      mockStore.saveSettings = vi.fn().mockReturnValue(
        new Promise<void>((resolve) => {
          resolveSave = resolve;
        }),
      );
      const wrapper = await mountPanel();

      await buttonByText(wrapper, 'Save').trigger('click');
      await flushPromises();
      expect(mockStore.saveSettings).toHaveBeenCalledTimes(1);
      expect(wrapper.emitted('close')).toBeUndefined();

      resolveSave();
      await flushPromises();
      expect(wrapper.emitted('close')).toHaveLength(1);
    });
  });

  describe('cancel', () => {
    it('emits close without saving', async () => {
      const wrapper = await mountPanel();
      await buttonByText(wrapper, 'Cancel').trigger('click');
      expect(wrapper.emitted('close')).toHaveLength(1);
      expect(mockStore.saveSettings).not.toHaveBeenCalled();
    });
  });
});
