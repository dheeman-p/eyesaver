/**
 * Minimal Vuetify stand-ins for unit tests. The Vitest config does not load the
 * Vuetify plugin, so tags like <v-card> would otherwise be unresolved. Pass as
 * `global.components` when mounting.
 */
import { computed, defineComponent, h, type PropType } from 'vue';

type Rule = (value: unknown) => true | string;

const slotDiv = (name: string) =>
  defineComponent({
    name,
    setup(_, { slots }) {
      return () => h('div', { 'data-stub': name }, slots.default?.());
    },
  });

const VCard = slotDiv('VCard');
const VCardTitle = slotDiv('VCardTitle');
const VCardText = slotDiv('VCardText');

const VDivider = defineComponent({
  name: 'VDivider',
  setup() {
    return () => h('hr');
  },
});

const VBtn = defineComponent({
  name: 'VBtn',
  setup(_, { slots }) {
    // Native attrs (class, onClick, ...) fall through to the root <button>.
    return () => h('button', { type: 'button' }, slots.default?.());
  },
});

const VAlert = defineComponent({
  name: 'VAlert',
  props: { type: String },
  setup(props, { slots }) {
    return () => h('div', { role: 'alert', 'data-type': props.type }, slots.default?.());
  },
});

const VProgressLinear = defineComponent({
  name: 'VProgressLinear',
  props: {
    modelValue: Number,
    color: String,
    height: [Number, String],
  },
  setup(props) {
    return () =>
      h('div', {
        'data-stub': 'VProgressLinear',
        'data-value': String(props.modelValue),
        'data-color': props.color,
        'data-height': props.height === undefined ? undefined : String(props.height),
      });
  },
});

const VTextField = defineComponent({
  name: 'VTextField',
  props: {
    modelValue: [Number, String],
    label: String,
    rules: { type: Array as PropType<Rule[]>, default: () => [] },
    type: String,
    min: [Number, String],
    max: [Number, String],
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const error = computed(() => {
      for (const rule of props.rules) {
        const result = rule(props.modelValue);
        if (result !== true) return result;
      }
      return '';
    });
    return () =>
      h('div', { 'data-stub': 'VTextField' }, [
        h('label', props.label),
        // Rendered as a text input (jsdom sanitises non-numeric values on
        // type="number"); the requested type is exposed as data-input-type.
        h('input', {
          type: 'text',
          'data-input-type': props.type,
          min: props.min,
          max: props.max,
          value: props.modelValue,
          onInput: (e: Event) => emit('update:modelValue', (e.target as HTMLInputElement).value),
        }),
        h('span', { class: 'error' }, error.value),
      ]);
  },
});

const VSwitch = defineComponent({
  name: 'VSwitch',
  props: { modelValue: Boolean, label: String },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () =>
      h('label', { 'data-stub': 'VSwitch' }, [
        h('input', {
          type: 'checkbox',
          checked: props.modelValue,
          onChange: (e: Event) => emit('update:modelValue', (e.target as HTMLInputElement).checked),
        }),
        h('span', props.label),
      ]);
  },
});

export const vuetifyStubs = {
  VCard,
  VCardTitle,
  VCardText,
  VDivider,
  VBtn,
  VAlert,
  VProgressLinear,
  VTextField,
  VSwitch,
};
