import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ExerciseCard from '@shared/components/ExerciseCard.vue';
import { EXERCISES } from '@shared/exercises';
import type { Exercise } from '@shared/types';
import { vuetifyStubs } from '../../../test/vuetifyStubs';

function mountCard(exercise: Exercise) {
  return mount(ExerciseCard, {
    props: { exercise },
    global: { components: vuetifyStubs },
  });
}

function customExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    index: 0,
    name: 'Custom Exercise',
    description: 'A custom description',
    steps: ['First custom step', 'Second custom step'],
    durationSeconds: 42,
    ...overrides,
  };
}

const iconSvg = (w: ReturnType<typeof mountCard>) => w.find('.exercise-card__icon-wrap svg');
const animationSvg = (w: ReturnType<typeof mountCard>) => w.find('.exercise-card__animation svg');

describe('ExerciseCard', () => {
  describe('default render', () => {
    const exercise = EXERCISES[1];

    it('shows the name, description and duration', () => {
      const wrapper = mountCard(exercise);
      expect(wrapper.find('.exercise-card__title').text()).toBe(exercise.name);
      expect(wrapper.find('.exercise-card__tagline').text()).toBe(exercise.description);
      expect(wrapper.find('.exercise-card__badge').text()).toContain(String(exercise.durationSeconds));
    });

    it('renders one numbered list item per step', () => {
      const wrapper = mountCard(exercise);
      const items = wrapper.findAll('ol[aria-label="Steps"] li');
      expect(items).toHaveLength(exercise.steps.length);

      const numbers = wrapper.findAll('.exercise-card__step-number').map((n) => n.text());
      expect(numbers).toEqual(exercise.steps.map((_, i) => String(i + 1)));

      const texts = wrapper.findAll('.exercise-card__step-text').map((t) => t.text());
      expect(texts).toEqual(exercise.steps);
    });

    it('renders the divider', () => {
      expect(mountCard(exercise).find('hr').exists()).toBe(true);
    });
  });

  describe('props', () => {
    it('reflects a different exercise in the output', () => {
      const wrapper = mountCard(customExercise());
      expect(wrapper.find('.exercise-card__title').text()).toBe('Custom Exercise');
      expect(wrapper.find('.exercise-card__tagline').text()).toBe('A custom description');
      expect(wrapper.find('.exercise-card__badge').text()).toContain('42');
      expect(wrapper.findAll('.exercise-card__step-text').map((t) => t.text())).toEqual([
        'First custom step',
        'Second custom step',
      ]);
    });

    it('renders no list items when steps is empty', () => {
      const wrapper = mountCard(customExercise({ steps: [] }));
      expect(wrapper.find('ol[aria-label="Steps"]').exists()).toBe(true);
      expect(wrapper.findAll('li')).toHaveLength(0);
    });

    it('updates when the exercise prop changes', async () => {
      const wrapper = mountCard(customExercise());
      await wrapper.setProps({ exercise: customExercise({ name: 'Renamed', steps: ['Only step'] }) });
      expect(wrapper.find('.exercise-card__title').text()).toBe('Renamed');
      expect(wrapper.findAll('li')).toHaveLength(1);
    });
  });

  describe('icon and animation selection', () => {
    it.each([0, 1, 2, 3, 4, 5])('renders icon and animation markup for index %i', (index) => {
      const wrapper = mountCard(customExercise({ index }));
      expect(iconSvg(wrapper).element.innerHTML.trim()).not.toBe('');
      expect(animationSvg(wrapper).element.innerHTML.trim()).not.toBe('');
    });

    it('renders different markup for different indexes', () => {
      const first = mountCard(customExercise({ index: 0 }));
      const second = mountCard(customExercise({ index: 1 }));
      expect(iconSvg(first).element.innerHTML).not.toBe(iconSvg(second).element.innerHTML);
      expect(animationSvg(first).element.innerHTML).not.toBe(animationSvg(second).element.innerHTML);
    });

    it('falls back to a default icon and animation for an unknown index', () => {
      const unknown = mountCard(customExercise({ index: 99 }));
      const other = mountCard(customExercise({ index: 98 }));
      expect(iconSvg(unknown).find('circle[r="4"]').exists()).toBe(true);
      expect(animationSvg(unknown).element.innerHTML.trim()).not.toBe('');
      expect(animationSvg(unknown).element.innerHTML).toBe(animationSvg(other).element.innerHTML);
      for (let i = 0; i <= 5; i++) {
        const known = mountCard(customExercise({ index: i }));
        expect(animationSvg(unknown).element.innerHTML).not.toBe(animationSvg(known).element.innerHTML);
      }
    });
  });

  describe('accessibility', () => {
    it('hides the decorative icon and animation from assistive tech', () => {
      const wrapper = mountCard(EXERCISES[0]);
      expect(wrapper.find('.exercise-card__icon-wrap').attributes('aria-hidden')).toBe('true');
      expect(wrapper.find('.exercise-card__animation').attributes('aria-hidden')).toBe('true');
    });

    it('labels the duration badge and steps list', () => {
      const wrapper = mountCard(EXERCISES[0]);
      expect(wrapper.find('.exercise-card__badge').attributes('aria-label')).toBe('Duration');
      expect(wrapper.find('ol').attributes('aria-label')).toBe('Steps');
    });
  });

  describe('every bundled exercise', () => {
    it.each(EXERCISES)('mounts and renders "$name"', (exercise) => {
      const wrapper = mountCard(exercise);
      expect(wrapper.find('.exercise-card__title').text()).toBe(exercise.name);
      expect(wrapper.findAll('li')).toHaveLength(exercise.steps.length);
    });
  });
});
