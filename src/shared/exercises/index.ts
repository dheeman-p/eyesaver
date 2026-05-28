import type { Exercise } from '@shared/types';

export const EXERCISES: Exercise[] = [
  {
    index: 0,
    name: '20-20-20 Rule',
    description: 'Look 20 feet away for 20 seconds',
    steps: [
      'Find an object at least 20 feet away',
      'Gaze at it steadily for 20 seconds',
      'Blink softly before returning to screen',
    ],
    durationSeconds: 20,
  },
  {
    index: 1,
    name: 'Palming',
    description: 'Warm palms over closed eyes to relax',
    steps: [
      'Rub palms together for 10 seconds',
      'Cup warm hands gently over closed eyes',
      'Rest in darkness, breathe slowly',
      'Lower hands, open eyes gradually',
    ],
    durationSeconds: 60,
  },
  {
    index: 2,
    name: 'Conscious Blinking',
    description: '15 slow, full blinks to refresh tear film',
    steps: [
      'Sit upright, relax your shoulders',
      'Blink fully and slowly 15 times',
      'Take 3 deep deliberate blinks to finish',
    ],
    durationSeconds: 30,
  },
  {
    index: 3,
    name: 'Figure-Eight Tracking',
    description: 'Trace a sideways 8 to mobilise eye muscles',
    steps: [
      'Imagine a large sideways 8, 2 m away',
      'Trace it slowly with eyes, head still — 15 s',
      'Reverse direction, trace for 15 s',
    ],
    durationSeconds: 45,
  },
  {
    index: 4,
    name: 'Near-Far Focus Shift',
    description: 'Alternate near and far focus to flex ciliary muscles',
    steps: [
      'Hold thumb 25 cm from your face',
      'Focus on thumb for 5 seconds',
      'Shift focus to far object for 5 seconds',
      'Repeat near-far shift 4 more times',
    ],
    durationSeconds: 40,
  },
  {
    index: 5,
    name: 'Eye Rolling',
    description: 'Slow circles to stretch eye muscles',
    steps: [
      'Sit comfortably, close eyes lightly',
      'Roll eyes clockwise in full circles — 5 times',
      'Roll counter-clockwise 5 times, then blink',
    ],
    durationSeconds: 30,
  },
];
