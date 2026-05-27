import type { Exercise } from '@shared/types';

/**
 * Bundled exercise content. Static; never fetched from network.
 * Source: specs/001-eye-exercise-reminder/data-model.md
 */
export const EXERCISES: Exercise[] = [
  {
    index: 0,
    name: '20-20-20 Rule',
    description:
      'Every 20 minutes, look at something 20 feet (about 6 metres) away for 20 seconds to relax the focusing muscles.',
    steps: [
      'Find an object at least 20 feet (6 metres) away — a window view or a wall across the room works well.',
      'Look steadily at that distant object for a full 20 seconds without staring.',
      'Blink softly a few times before returning your gaze to the screen.',
    ],
    durationSeconds: 20,
  },
  {
    index: 1,
    name: 'Palming',
    description:
      'Cup your warm palms gently over closed eyes to block light and let the eye muscles release tension.',
    steps: [
      'Rub your palms together briskly for about 10 seconds until they feel warm.',
      'Close your eyes and cup your palms over them without pressing on the eyeballs.',
      'Breathe slowly and rest in the soothing darkness for 30 to 45 seconds.',
      'Slowly lower your hands and open your eyes, letting them adjust gradually to the light.',
    ],
    durationSeconds: 60,
  },
  {
    index: 2,
    name: 'Conscious Blinking',
    description:
      'A short burst of deliberate, slow blinks to re-coat the eye surface with tear film after screen-time underblinking.',
    steps: [
      'Sit upright and relax your shoulders.',
      'Blink slowly and fully — closing the eyelid all the way — 15 times in a row.',
      'Pause, then take three more deep, deliberate blinks before resuming work.',
    ],
    durationSeconds: 30,
  },
  {
    index: 3,
    name: 'Figure-Eight Tracking',
    description:
      'Trace a horizontal figure-8 with your eyes to mobilise the extraocular muscles in every direction.',
    steps: [
      'Imagine a large figure-8 lying on its side about 2 metres in front of you.',
      'Trace its outline slowly with your eyes only, keeping your head still, for 15 seconds.',
      'Reverse the direction and trace it for another 15 seconds.',
    ],
    durationSeconds: 45,
  },
  {
    index: 4,
    name: 'Near-Far Focus Shift',
    description:
      'Alternate focus between a near and far target to flex the ciliary muscles that control accommodation.',
    steps: [
      'Hold a thumb or pen about 25 cm in front of your face.',
      'Focus on it for 5 seconds, noticing the detail.',
      'Shift focus to an object across the room for 5 seconds.',
      'Repeat the near-far shift four more times.',
    ],
    durationSeconds: 40,
  },
  {
    index: 5,
    name: 'Eye Rolling',
    description:
      'Slow circular eye rotations to stretch and relax the muscles surrounding the eyeball.',
    steps: [
      'Sit comfortably and close your eyes lightly.',
      'Roll your eyes slowly in a full clockwise circle five times.',
      'Reverse and roll them anti-clockwise five times, then open your eyes and blink softly.',
    ],
    durationSeconds: 30,
  },
];
