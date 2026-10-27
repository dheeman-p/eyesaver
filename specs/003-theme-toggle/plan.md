# Implementation Plan: Light/Dark Theme Toggle

**Spec**: [spec.md](spec.md)

## Summary
CSS custom properties hold both palettes. A small shared module reads/writes `localStorage['eyesaver-theme']` and sets `data-theme` on `<html>`. Vuetify's active theme is bound to the resolved theme so Vuetify components follow.

## Design
- `src/shared/styles/_theme.scss`: `$light` / `$dark` maps emitted as `--es-*`; `:root[data-theme]` selectors plus a `prefers-color-scheme` fallback when no attribute is set.
- `src/shared/theme/theme.ts`: pure functions (`readStoredPreference`, `writeStoredPreference`, `resolveTheme`, `applyTheme`).
- `src/shared/theme/index.ts`: `useAppTheme()` composable (singleton state, OS-change and cross-tab sync).
- `src/shared/theme/init.ts`: side-effect module applying the stored theme at startup.
- `src/shared/theme/vuetifyTheme.ts`: Vuetify light/dark colour sets and `bindVuetifyTheme`.
- `src/shared/components/ThemeSwitcher.vue`: accessible radiogroup shown at the top of Settings (popup `SettingsPanel`, PWA inline settings card).
- ExerciseCard SVG shapes use semantic classes styled by theme variables instead of inline hex.

## Testing
Vitest + jsdom: `src/shared/theme/__tests__/theme.spec.ts`, `src/shared/components/__tests__/ThemeSwitcher.spec.ts`. Build checks: `npm run build`, `npm run build:pwa`.
