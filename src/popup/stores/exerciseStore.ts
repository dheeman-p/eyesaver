import { computed } from 'vue';
import { defineStore } from 'pinia';
import { useStorage } from '@popup/composables/useStorage';
import { DEFAULT_STATE, STORAGE_KEY_STATE } from '@shared/constants';
import { EXERCISES } from '@shared/exercises';
import type { ReminderState } from '@shared/types';

/**
 * Reactive view of the current exercise rotation index.
 * Reads / writes the shared `eyesaver_state` key, keeping the popup in sync
 * with index advances written by the service worker.
 */
export const useExerciseStore = defineStore('exercise', () => {
  const { value: state, set: setState, ready } = useStorage<ReminderState>(
    STORAGE_KEY_STATE,
    DEFAULT_STATE,
  );

  const exercises = EXERCISES;

  const currentExerciseIndex = computed(
    () => state.value.currentExerciseIndex % EXERCISES.length,
  );

  const currentExercise = computed(
    () => EXERCISES[currentExerciseIndex.value] ?? EXERCISES[0],
  );

  async function advance(): Promise<void> {
    const nextIndex = (state.value.currentExerciseIndex + 1) % EXERCISES.length;
    await setState({
      ...state.value,
      currentExerciseIndex: nextIndex,
    });
  }

  return {
    exercises,
    currentExerciseIndex,
    currentExercise,
    advance,
    ready,
  };
});
