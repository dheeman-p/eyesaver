import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import NotificationPermissionBanner from '@pwa/components/NotificationPermissionBanner.vue';
import { vuetifyStubs } from '../../../test/vuetifyStubs';

function mountBanner(permission: NotificationPermission) {
  return mount(NotificationPermissionBanner, {
    props: { permission },
    global: { components: vuetifyStubs },
  });
}

describe('NotificationPermissionBanner', () => {
  describe('permission "denied"', () => {
    it('renders a warning alert explaining that reminders are blocked', () => {
      const wrapper = mountBanner('denied');
      const alert = wrapper.find('.permission-banner');
      expect(alert.exists()).toBe(true);
      expect(alert.attributes('data-type')).toBe('warning');
      expect(alert.text()).toContain('Reminders are blocked');
    });

    it('renders no button and emits nothing', () => {
      const wrapper = mountBanner('denied');
      expect(wrapper.find('button').exists()).toBe(false);
      expect(wrapper.emitted('requestPermission')).toBeUndefined();
    });
  });

  describe('permission "default"', () => {
    it('renders an info alert with the prompt text and the enable button', () => {
      const wrapper = mountBanner('default');
      const alert = wrapper.find('.permission-banner');
      expect(alert.attributes('data-type')).toBe('info');
      expect(alert.text()).toContain('Enable notifications to receive eye exercise reminders');
      expect(wrapper.find('button').text()).toBe('Enable reminders');
    });

    it('emits requestPermission with no payload when the button is clicked', async () => {
      const wrapper = mountBanner('default');
      await wrapper.find('button').trigger('click');
      expect(wrapper.emitted('requestPermission')).toHaveLength(1);
      expect(wrapper.emitted('requestPermission')).toEqual([[]]);
    });

    it('emits once per click on repeated clicks', async () => {
      const wrapper = mountBanner('default');
      const button = wrapper.find('button');
      await button.trigger('click');
      await button.trigger('click');
      await button.trigger('click');
      expect(wrapper.emitted('requestPermission')).toHaveLength(3);
    });
  });

  describe('permission "granted"', () => {
    it('renders nothing', () => {
      const wrapper = mountBanner('granted');
      expect(wrapper.find('.permission-banner').exists()).toBe(false);
      expect(wrapper.find('button').exists()).toBe(false);
    });
  });

  describe('prop transitions', () => {
    it('hides the button when permission changes from default to denied', async () => {
      const wrapper = mountBanner('default');
      expect(wrapper.find('button').exists()).toBe(true);

      await wrapper.setProps({ permission: 'denied' });
      expect(wrapper.find('button').exists()).toBe(false);
      expect(wrapper.find('.permission-banner').attributes('data-type')).toBe('warning');
    });

    it('hides the alert when permission changes from denied to granted', async () => {
      const wrapper = mountBanner('denied');
      await wrapper.setProps({ permission: 'granted' });
      expect(wrapper.find('.permission-banner').exists()).toBe(false);
    });
  });
});
