<script setup lang="ts">
import type { Exercise } from '@shared/types';

defineProps<{ exercise: Exercise }>();

const EXERCISE_ICONS: Record<number, string> = {
  // 20-20-20 Rule — clock face
  0: `<circle cx="12" cy="12" r="9.5" stroke="currentColor" stroke-width="1.5" fill="none"/>
      <line x1="12" y1="3.5" x2="12" y2="5.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="12" y1="12" x2="16.2" y2="16.2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="12" y1="12" x2="12" y2="7.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <circle cx="12" cy="12" r="1" fill="currentColor"/>`,

  // Palming — cupped hands with warmth lines
  1: `<path d="M4 14 C4 10 7 8 10 9 L10 16 C8 17 6 17 4 14Z" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linejoin="round"/>
      <path d="M20 14 C20 10 17 8 14 9 L14 16 C16 17 18 17 20 14Z" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linejoin="round"/>
      <path d="M9 6.5 Q10 5 11 6.5" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linecap="round"/>
      <path d="M12 5.5 Q13 4 14 5.5" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linecap="round"/>`,

  // Conscious Blinking — eye with upward motion lines
  2: `<path d="M2 12 C5 7 19 7 22 12 C19 17 5 17 2 12Z" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linejoin="round"/>
      <circle cx="12" cy="12" r="2.8" stroke="currentColor" stroke-width="1.5" fill="none"/>
      <circle cx="12" cy="12" r="1" fill="currentColor"/>
      <line x1="9" y1="8.5" x2="9" y2="7" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
      <line x1="12" y1="7.8" x2="12" y2="6.3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
      <line x1="15" y1="8.5" x2="15" y2="7" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>`,

  // Figure-Eight Tracking — horizontal infinity loop
  3: `<path d="M5 12 C5 8.5 8 7 10 9 C11 10 12 12 12 12 C12 12 13 14 14 15 C16 17 19 15.5 19 12 C19 8.5 16 7 14 9 C13 10 12 12 12 12 C12 12 11 14 10 15 C8 17 5 15.5 5 12Z" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linejoin="round"/>`,

  // Near-Far Focus Shift — small circle + arrow + distant mountain
  4: `<circle cx="7" cy="14" r="2.5" stroke="currentColor" stroke-width="1.5" fill="none"/>
      <line x1="10.5" y1="14" x2="13.5" y2="14" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
      <polyline points="12.5,13 13.5,14 12.5,15" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linejoin="round" stroke-linecap="round"/>
      <polyline points="15,17 18.5,10 22,17" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linejoin="round" stroke-linecap="round"/>
      <line x1="14" y1="17" x2="23" y2="17" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>`,

  // Eye Rolling — eye with circular arrow
  5: `<path d="M5 12 C7.5 8.5 16.5 8.5 19 12 C16.5 15.5 7.5 15.5 5 12Z" stroke="currentColor" stroke-width="1.5" fill="none"/>
      <circle cx="12" cy="12" r="2" stroke="currentColor" stroke-width="1.5" fill="none"/>
      <path d="M12 4 A8 8 0 1 1 4.5 9" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <polyline points="3,7.5 4.5,9 6,7.8" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`,
};

const FALLBACK_ICON = `<circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.5" fill="none"/>
  <path d="M2 12 C5 7 19 7 22 12 C19 17 5 17 2 12Z" stroke="currentColor" stroke-width="1.5" fill="none"/>`;

// Animated SVG illustrations — inner markup injected via v-html into a 200×115 viewBox SVG.
// All animations use SMIL (animate / animateTransform / animateMotion) so they are self-contained
// and unaffected by Vue's scoped-style attribute. Eye centre: (100, 52).
const EXERCISE_ANIMATIONS: Record<number, string> = {
  // 20-20-20 Rule: iris shifts right (looking far away) then returns
  0: `<path d="M15 52 C55 20 145 20 185 52 C145 84 55 84 15 52Z" fill="#e0f2f1" stroke="#00897b" stroke-width="2.5"/>
<g>
  <animateTransform attributeName="transform" type="translate"
    values="0,0; 0,0; 22,0; 22,0; 0,0"
    keyTimes="0; 0.15; 0.42; 0.72; 1"
    dur="3.5s" repeatCount="indefinite"
    calcMode="spline"
    keySplines="0 0 0 0; 0.42 0 0.58 1; 0 0 0 0; 0.42 0 0.58 1"/>
  <circle cx="100" cy="52" r="20" fill="#4db6ac" stroke="#00697b" stroke-width="1.5"/>
  <circle cx="100" cy="52" r="10" fill="#0d1b2a"/>
  <circle cx="106" cy="46" r="3" fill="white" opacity="0.75"/>
</g>
<g>
  <animate attributeName="opacity" values="1; 1; 0.15; 0.15; 1" keyTimes="0; 0.15; 0.42; 0.72; 1" dur="3.5s" repeatCount="indefinite"/>
  <rect x="10" y="88" width="22" height="14" rx="2" fill="none" stroke="#546e7a" stroke-width="1.5"/>
  <line x1="16" y1="102" x2="26" y2="107" stroke="#546e7a" stroke-width="1.5"/>
  <rect x="14" y="107" width="14" height="2" rx="0.5" fill="#546e7a"/>
</g>
<g>
  <animate attributeName="opacity" values="0.15; 0.15; 1; 1; 0.15" keyTimes="0; 0.15; 0.42; 0.72; 1" dur="3.5s" repeatCount="indefinite"/>
  <line x1="158" y1="108" x2="195" y2="108" stroke="#546e7a" stroke-width="1.5" stroke-linecap="round"/>
  <polyline points="160,108 172,90 184,108" fill="none" stroke="#546e7a" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
</g>`,

  // Palming: eyelid closes, warm palms descend to cover
  1: `<path d="M15 52 C55 84 145 84 185 52Z" fill="#e0f2f1" stroke="#00897b" stroke-width="2.5"/>
<path fill="#f5f5f5" stroke="#00897b" stroke-width="2.5">
  <animate attributeName="d"
    values="M15 52 C55 20 145 20 185 52;M15 52 C55 20 145 20 185 52;M15 52 C55 51 145 51 185 52;M15 52 C55 51 145 51 185 52;M15 52 C55 20 145 20 185 52"
    keyTimes="0; 0.12; 0.38; 0.70; 1"
    dur="4s" repeatCount="indefinite"
    calcMode="spline"
    keySplines="0 0 0 0; 0.42 0 0.58 1; 0 0 0 0; 0.42 0 0.58 1"/>
</path>
<circle cx="100" cy="52" r="20" fill="#4db6ac" stroke="#00697b" stroke-width="1.5">
  <animate attributeName="opacity" values="1;1;0;0;1" keyTimes="0;0.12;0.38;0.70;1" dur="4s" repeatCount="indefinite"/>
</circle>
<circle cx="100" cy="52" r="10" fill="#0d1b2a">
  <animate attributeName="opacity" values="1;1;0;0;1" keyTimes="0;0.12;0.38;0.70;1" dur="4s" repeatCount="indefinite"/>
</circle>
<circle cx="106" cy="46" r="3" fill="white" opacity="0.75">
  <animate attributeName="opacity" values="0.75;0.75;0;0;0.75" keyTimes="0;0.12;0.38;0.70;1" dur="4s" repeatCount="indefinite"/>
</circle>
<g>
  <animateTransform attributeName="transform" type="translate"
    values="0,-85; 0,-85; 0,0; 0,0; 0,-85"
    keyTimes="0; 0.08; 0.35; 0.70; 1"
    dur="4s" repeatCount="indefinite"
    calcMode="spline"
    keySplines="0 0 0 0; 0.42 0 0.58 1; 0 0 0 0; 0.42 0 0.58 1"/>
  <ellipse cx="60" cy="45" rx="40" ry="22" fill="#ffccbc" stroke="#a1887f" stroke-width="1.5"/>
  <path d="M30 34 Q36 24 44 32 Q50 22 58 30 Q64 22 72 30 Q78 24 85 34" fill="none" stroke="#a1887f" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</g>
<g>
  <animateTransform attributeName="transform" type="translate"
    values="0,-85; 0,-85; 0,0; 0,0; 0,-85"
    keyTimes="0; 0.08; 0.35; 0.70; 1"
    dur="4s" repeatCount="indefinite"
    calcMode="spline"
    keySplines="0 0 0 0; 0.42 0 0.58 1; 0 0 0 0; 0.42 0 0.58 1"/>
  <ellipse cx="140" cy="45" rx="40" ry="22" fill="#ffccbc" stroke="#a1887f" stroke-width="1.5"/>
  <path d="M115 34 Q121 24 129 32 Q135 22 143 30 Q149 22 157 30 Q163 24 170 34" fill="none" stroke="#a1887f" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</g>`,

  // Conscious Blinking: 3 slow deliberate blinks over 7s
  2: `<path d="M15 52 C55 84 145 84 185 52Z" fill="#e0f2f1" stroke="#00897b" stroke-width="2.5"/>
<path fill="#f5f5f5" stroke="#00897b" stroke-width="2.5">
  <animate attributeName="d"
    values="M15 52 C55 20 145 20 185 52;M15 52 C55 20 145 20 185 52;M15 52 C55 51 145 51 185 52;M15 52 C55 20 145 20 185 52;M15 52 C55 20 145 20 185 52;M15 52 C55 51 145 51 185 52;M15 52 C55 20 145 20 185 52;M15 52 C55 20 145 20 185 52;M15 52 C55 51 145 51 185 52;M15 52 C55 20 145 20 185 52;M15 52 C55 20 145 20 185 52"
    keyTimes="0;0.10;0.157;0.20;0.30;0.357;0.40;0.50;0.557;0.60;1"
    dur="7s" repeatCount="indefinite"
    calcMode="spline"
    keySplines="0 0 0 0;0.42 0 0.58 1;0.42 0 0.58 1;0 0 0 0;0.42 0 0.58 1;0.42 0 0.58 1;0 0 0 0;0.42 0 0.58 1;0.42 0 0.58 1;0 0 0 0"/>
</path>
<circle cx="100" cy="52" r="20" fill="#4db6ac" stroke="#00697b" stroke-width="1.5">
  <animate attributeName="opacity" values="1;1;0;1;1;0;1;1;0;1;1"
    keyTimes="0;0.10;0.157;0.20;0.30;0.357;0.40;0.50;0.557;0.60;1" dur="7s" repeatCount="indefinite"/>
</circle>
<circle cx="100" cy="52" r="10" fill="#0d1b2a">
  <animate attributeName="opacity" values="1;1;0;1;1;0;1;1;0;1;1"
    keyTimes="0;0.10;0.157;0.20;0.30;0.357;0.40;0.50;0.557;0.60;1" dur="7s" repeatCount="indefinite"/>
</circle>
<circle cx="106" cy="46" r="3" fill="white" opacity="0.75">
  <animate attributeName="opacity" values="0.75;0.75;0;0.75;0.75;0;0.75;0.75;0;0.75;0.75"
    keyTimes="0;0.10;0.157;0.20;0.30;0.357;0.40;0.50;0.557;0.60;1" dur="7s" repeatCount="indefinite"/>
</circle>`,

  // Figure-Eight Tracking: iris traces horizontal ∞ path continuously
  3: `<path d="M15 52 C55 20 145 20 185 52 C145 84 55 84 15 52Z" fill="#e0f2f1" stroke="#00897b" stroke-width="2.5"/>
<path d="M125 52 C125 38 100 38 100 52 C100 38 75 38 75 52 C75 66 100 66 100 52 C100 66 125 66 125 52"
      fill="none" stroke="#80cbc4" stroke-width="1.2" stroke-dasharray="3,4" opacity="0.65"/>
<g>
  <animateMotion dur="4s" repeatCount="indefinite"
    path="M 25,0 C 25,-14 0,-14 0,0 C 0,-14 -25,-14 -25,0 C -25,14 0,14 0,0 C 0,14 25,14 25,0"/>
  <circle cx="100" cy="52" r="20" fill="#4db6ac" stroke="#00697b" stroke-width="1.5"/>
  <circle cx="100" cy="52" r="10" fill="#0d1b2a"/>
  <circle cx="106" cy="46" r="3" fill="white" opacity="0.75"/>
</g>`,

  // Near-Far Focus Shift: gaze alternates near (lower-left) and far (upper-right)
  4: `<path d="M15 52 C55 20 145 20 185 52 C145 84 55 84 15 52Z" fill="#e0f2f1" stroke="#00897b" stroke-width="2.5"/>
<g>
  <animateTransform attributeName="transform" type="translate"
    values="-12,6; -12,6; 12,-6; 12,-6; -12,6"
    keyTimes="0; 0.28; 0.52; 0.78; 1"
    dur="4s" repeatCount="indefinite"
    calcMode="spline"
    keySplines="0 0 0 0; 0.42 0 0.58 1; 0 0 0 0; 0.42 0 0.58 1"/>
  <circle cx="100" cy="52" r="20" fill="#4db6ac" stroke="#00697b" stroke-width="1.5"/>
  <circle cx="100" cy="52" r="10" fill="#0d1b2a"/>
  <circle cx="106" cy="46" r="3" fill="white" opacity="0.75"/>
</g>
<g>
  <animate attributeName="opacity" values="1;1;0.15;0.15;1" keyTimes="0;0.28;0.52;0.78;1" dur="4s" repeatCount="indefinite"/>
  <ellipse cx="26" cy="96" rx="10" ry="13" fill="#ffccbc" stroke="#a1887f" stroke-width="1.5"/>
  <path d="M20 86 Q26 80 32 86" fill="none" stroke="#a1887f" stroke-width="1.5" stroke-linecap="round"/>
</g>
<g>
  <animate attributeName="opacity" values="0.15;0.15;1;1;0.15" keyTimes="0;0.28;0.52;0.78;1" dur="4s" repeatCount="indefinite"/>
  <line x1="157" y1="108" x2="194" y2="108" stroke="#546e7a" stroke-width="1.5" stroke-linecap="round"/>
  <polyline points="159,108 171,90 183,108" fill="none" stroke="#546e7a" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
</g>`,

  // Eye Rolling: iris orbits clockwise ×2 then counter-clockwise ×2
  5: `<defs>
  <clipPath id="ec5clip">
    <path d="M15 52 C55 20 145 20 185 52 C145 84 55 84 15 52Z"/>
  </clipPath>
</defs>
<path d="M15 52 C55 20 145 20 185 52 C145 84 55 84 15 52Z" fill="#e0f2f1" stroke="#00897b" stroke-width="2.5"/>
<circle cx="100" cy="52" r="20" fill="none" stroke="#b2dfdb" stroke-width="1" stroke-dasharray="3,4" opacity="0.5"/>
<g clip-path="url(#ec5clip)">
  <g>
    <animateTransform attributeName="transform" type="rotate"
      values="0 100 52; 720 100 52; 720 100 52; 0 100 52; 0 100 52"
      keyTimes="0; 0.42; 0.50; 0.92; 1"
      dur="8s" repeatCount="indefinite"
      calcMode="spline"
      keySplines="0.4 0 0.6 1; 0 0 0 0; 0.4 0 0.6 1; 0 0 0 0"/>
    <circle cx="120" cy="52" r="20" fill="#4db6ac" stroke="#00697b" stroke-width="1.5"/>
    <circle cx="120" cy="52" r="10" fill="#0d1b2a"/>
    <circle cx="126" cy="46" r="3" fill="white" opacity="0.75"/>
  </g>
</g>`,
};

const FALLBACK_ANIMATION = `<path d="M15 52 C55 84 145 84 185 52Z" fill="#e0f2f1" stroke="#00897b" stroke-width="2.5"/>
<path fill="#f5f5f5" stroke="#00897b" stroke-width="2.5">
  <animate attributeName="d"
    values="M15 52 C55 20 145 20 185 52;M15 52 C55 51 145 51 185 52;M15 52 C55 20 145 20 185 52"
    keyTimes="0;0.2;0.5" dur="3s" repeatCount="indefinite" calcMode="spline"
    keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"/>
</path>
<circle cx="100" cy="52" r="20" fill="#4db6ac" stroke="#00697b" stroke-width="1.5">
  <animate attributeName="opacity" values="1;0;1" keyTimes="0;0.2;0.5" dur="3s" repeatCount="indefinite"/>
</circle>
<circle cx="100" cy="52" r="10" fill="#0d1b2a">
  <animate attributeName="opacity" values="1;0;1" keyTimes="0;0.2;0.5" dur="3s" repeatCount="indefinite"/>
</circle>`;
</script>

<template>
  <v-card class="exercise-card" elevation="1">
    <v-card-text class="exercise-card__header">
      <div class="exercise-card__icon-wrap" aria-hidden="true">
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          v-html="EXERCISE_ICONS[exercise.index] ?? FALLBACK_ICON"
        />
      </div>
      <h2 class="exercise-card__title">{{ exercise.name }}</h2>
      <span class="exercise-card__badge" aria-label="Duration">
        {{ exercise.durationSeconds }}&thinsp;s
      </span>
    </v-card-text>

    <div class="exercise-card__tagline">{{ exercise.description }}</div>

    <div class="exercise-card__animation" aria-hidden="true">
      <svg
        viewBox="0 0 200 115"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        v-html="EXERCISE_ANIMATIONS[exercise.index] ?? FALLBACK_ANIMATION"
      />
    </div>

    <v-divider class="exercise-card__divider" />

    <ol class="exercise-card__steps" aria-label="Steps">
      <li
        v-for="(step, idx) in exercise.steps"
        :key="idx"
        class="exercise-card__step"
      >
        <span class="exercise-card__step-number" aria-hidden="true">{{ idx + 1 }}</span>
        <span class="exercise-card__step-text">{{ step }}</span>
      </li>
    </ol>
  </v-card>
</template>

<style lang="scss" scoped>
@use '../styles/variables' as v;

.exercise-card {
  border-radius: v.$radius-md;
  overflow: hidden;
  padding: 0;
}

.exercise-card__header {
  display: flex;
  align-items: center;
  gap: v.$space-2;
  padding: v.$space-3 v.$space-3 v.$space-2 !important;
}

.exercise-card__icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: rgba(0, 137, 123, 0.12);
  color: v.$brand-primary;
  flex-shrink: 0;
}

.exercise-card__title {
  flex: 1;
  margin: 0;
  font-size: v.$font-title;
  font-weight: 600;
  color: v.$brand-primary;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.exercise-card__badge {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  padding: 2px v.$space-2;
  border-radius: v.$radius-sm;
  background-color: rgba(0, 137, 123, 0.10);
  color: v.$brand-primary;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  line-height: 1.5;
}

.exercise-card__tagline {
  padding: 0 v.$space-3 v.$space-2;
  font-size: v.$font-label;
  color: rgba(0, 0, 0, 0.55);
  line-height: 1.35;
}

.exercise-card__animation {
  padding: 0 v.$space-3 v.$space-2;

  svg {
    display: block;
    width: 100%;
    height: 110px;
    border-radius: v.$radius-sm;
    background: rgba(0, 137, 123, 0.04);
    border: 1px solid rgba(0, 137, 123, 0.12);
  }
}

.exercise-card__divider {
  margin: 0 v.$space-3 v.$space-2;
}

.exercise-card__steps {
  list-style: none;
  margin: 0;
  padding: 0 v.$space-3 v.$space-3;
  display: flex;
  flex-direction: column;
  gap: v.$space-2;
}

.exercise-card__step {
  display: flex;
  align-items: baseline;
  gap: v.$space-2;
}

.exercise-card__step-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background-color: v.$brand-primary;
  color: v.$brand-on-primary;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  flex-shrink: 0;
  position: relative;
  top: -1px;
}

.exercise-card__step-text {
  font-size: v.$font-label;
  line-height: 1.35;
  color: rgba(0, 0, 0, 0.80);
}
</style>
