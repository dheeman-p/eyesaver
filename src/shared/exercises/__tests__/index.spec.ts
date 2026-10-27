import { describe, it, expect } from 'vitest';
import { EXERCISES } from '@shared/exercises';
import type { Exercise } from '@shared/types';

const EXPECTED: [string, number][] = [
  ['20-20-20 Rule', 20],
  ['Palming', 60],
  ['Conscious Blinking', 30],
  ['Figure-Eight Tracking', 45],
  ['Near-Far Focus Shift', 40],
  ['Eye Rolling', 30],
];

describe('EXERCISES', () => {
  describe('shape', () => {
    it('is a non-empty array of 6 exercises', () => {
      expect(Array.isArray(EXERCISES)).toBe(true);
      expect(EXERCISES.length).toBeGreaterThan(0);
      expect(EXERCISES).toHaveLength(6);
    });

    it('gives every entry exactly the Exercise keys', () => {
      const keys = ['description', 'durationSeconds', 'index', 'name', 'steps'];
      for (const exercise of EXERCISES) {
        expect(Object.keys(exercise).sort()).toEqual(keys);
      }
    });

    it('conforms to the Exercise type', () => {
      const typed: Exercise[] = EXERCISES;
      expect(typed).toBe(EXERCISES);
    });
  });

  describe('index invariants', () => {
    it('has contiguous, zero-based, unique indexes matching array position', () => {
      EXERCISES.forEach((exercise, i) => {
        expect(exercise.index).toBe(i);
      });
      expect(new Set(EXERCISES.map((e) => e.index)).size).toBe(EXERCISES.length);
    });
  });

  describe.each(EXERCISES.map((e) => [e.name, e] as const))('field validity: %s', (_name, exercise) => {
    it('has a non-empty name', () => {
      expect(typeof exercise.name).toBe('string');
      expect(exercise.name.trim().length).toBeGreaterThan(0);
    });

    it('has a non-empty description', () => {
      expect(typeof exercise.description).toBe('string');
      expect(exercise.description.trim().length).toBeGreaterThan(0);
    });

    it('has a non-empty array of non-empty string steps', () => {
      expect(Array.isArray(exercise.steps)).toBe(true);
      expect(exercise.steps.length).toBeGreaterThan(0);
      for (const step of exercise.steps) {
        expect(typeof step).toBe('string');
        expect(step.trim().length).toBeGreaterThan(0);
      }
    });

    it('has no duplicate steps', () => {
      expect(new Set(exercise.steps).size).toBe(exercise.steps.length);
    });

    it('has a positive, finite, integer durationSeconds', () => {
      expect(Number.isFinite(exercise.durationSeconds)).toBe(true);
      expect(Number.isInteger(exercise.durationSeconds)).toBe(true);
      expect(exercise.durationSeconds).toBeGreaterThan(0);
    });
  });

  describe('uniqueness', () => {
    it('has unique names across exercises', () => {
      const names = EXERCISES.map((e) => e.name);
      expect(new Set(names).size).toBe(names.length);
    });
  });

  describe('specific content', () => {
    it('starts with the 20-20-20 Rule (20 seconds, 3 steps)', () => {
      expect(EXERCISES[0].name).toBe('20-20-20 Rule');
      expect(EXERCISES[0].durationSeconds).toBe(20);
      expect(EXERCISES[0].steps).toHaveLength(3);
    });

    it('matches the expected names and durations in order', () => {
      expect(EXERCISES.map((e) => [e.name, e.durationSeconds])).toEqual(EXPECTED);
    });
  });

  describe('rotation compatibility', () => {
    it('resolves an exercise for any index via modulo', () => {
      for (let i = 0; i <= 2 * EXERCISES.length; i++) {
        expect(EXERCISES[i % EXERCISES.length]).toBeDefined();
      }
    });

    it('returns undefined for out-of-range indexes without modulo', () => {
      expect(EXERCISES[EXERCISES.length]).toBeUndefined();
      expect(EXERCISES[-1]).toBeUndefined();
    });
  });

  describe('module stability', () => {
    it('returns the same reference on repeated import', async () => {
      const mod = await import('@shared/exercises');
      expect(mod.EXERCISES).toBe(EXERCISES);
    });

    it('is plain serialisable data', () => {
      expect(JSON.parse(JSON.stringify(EXERCISES))).toEqual(EXERCISES);
    });
  });
});
