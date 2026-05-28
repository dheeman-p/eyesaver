import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import CountdownTimer from '@shared/components/CountdownTimer.vue';

const mockStore = {
  secondsRemaining: 0,
  progressPercent: 0,
};

vi.mock('@popup/stores/scheduleStore', () => ({
  useScheduleStore: () => mockStore,
}));

function mountTimer() {
  return mount(CountdownTimer, {
    global: {
      stubs: { 'v-progress-linear': true },
    },
  });
}

describe('CountdownTimer', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockStore.secondsRemaining = 0;
    mockStore.progressPercent = 0;
  });

  describe('label text', () => {
    it('shows "Reminder due now" when secondsRemaining is 0', () => {
      mockStore.secondsRemaining = 0;
      const wrapper = mountTimer();
      expect(wrapper.find('.countdown__label').text()).toBe('Reminder due now');
    });

    it('shows "Reminder due now" when secondsRemaining is negative', () => {
      mockStore.secondsRemaining = -5;
      const wrapper = mountTimer();
      expect(wrapper.find('.countdown__label').text()).toBe('Reminder due now');
    });

    it('shows seconds-only when remaining time is under 60s', () => {
      mockStore.secondsRemaining = 45;
      const wrapper = mountTimer();
      expect(wrapper.find('.countdown__label').text()).toBe('Next reminder in 45s');
    });

    it('shows "1s" for a single second remaining', () => {
      mockStore.secondsRemaining = 1;
      const wrapper = mountTimer();
      expect(wrapper.find('.countdown__label').text()).toBe('Next reminder in 1s');
    });

    it('shows minutes and seconds when remaining time is exactly 60s', () => {
      mockStore.secondsRemaining = 60;
      const wrapper = mountTimer();
      expect(wrapper.find('.countdown__label').text()).toBe('Next reminder in 1m 0s');
    });

    it('shows minutes and seconds when remaining time is over 60s', () => {
      mockStore.secondsRemaining = 125; // 2m 5s
      const wrapper = mountTimer();
      expect(wrapper.find('.countdown__label').text()).toBe('Next reminder in 2m 5s');
    });
  });

  describe('progress bar', () => {
    it('passes progressPercent to the progress bar', () => {
      mockStore.progressPercent = 75;
      const wrapper = mountTimer();
      expect(wrapper.find('v-progress-linear-stub').attributes('model-value')).toBe('75');
    });

    it('passes 0 progress when no time has elapsed', () => {
      mockStore.progressPercent = 0;
      const wrapper = mountTimer();
      expect(wrapper.find('v-progress-linear-stub').attributes('model-value')).toBe('0');
    });
  });

  describe('accessibility', () => {
    it('has role="status" on the container', () => {
      const wrapper = mountTimer();
      expect(wrapper.find('.countdown').attributes('role')).toBe('status');
    });

    it('has aria-live="polite" on the container', () => {
      const wrapper = mountTimer();
      expect(wrapper.find('.countdown').attributes('aria-live')).toBe('polite');
    });
  });
});
