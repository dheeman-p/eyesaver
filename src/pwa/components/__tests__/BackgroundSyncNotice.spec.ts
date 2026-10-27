import { describe, it, expect } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import BackgroundSyncNotice from '@pwa/components/BackgroundSyncNotice.vue';
import { vuetifyStubs } from '../../../test/vuetifyStubs';

function mountNotice(show: boolean) {
  return mount(BackgroundSyncNotice, {
    props: { show },
    global: { components: vuetifyStubs },
  });
}

describe('BackgroundSyncNotice', () => {
  it('renders an info alert with the notice text when show is true', () => {
    const wrapper = mountNotice(true);
    const alert = wrapper.find('.sync-notice');
    expect(alert.exists()).toBe(true);
    expect(alert.attributes('data-type')).toBe('info');
    expect(alert.text()).toContain('Background reminders are not supported in this browser');
  });

  it('renders nothing when show is false', () => {
    const wrapper = mountNotice(false);
    expect(wrapper.find('.sync-notice').exists()).toBe(false);
  });

  it('toggles visibility when the show prop changes', async () => {
    const wrapper = mountNotice(false);
    await wrapper.setProps({ show: true });
    await nextTick();
    expect(wrapper.find('.sync-notice').exists()).toBe(true);

    await wrapper.setProps({ show: false });
    await nextTick();
    expect(wrapper.find('.sync-notice').exists()).toBe(false);
  });
});
