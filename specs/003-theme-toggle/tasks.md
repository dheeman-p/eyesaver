# Tasks: Light/Dark Theme Toggle

- [x] T001 Add `THEME_STORAGE_KEY`, `ThemePreference`, `ResolvedTheme` to `src/shared`
- [x] T002 Create `src/shared/styles/_theme.scss` (light/dark palettes) and import it from both `main.scss` files
- [x] T003 Create `src/shared/theme/` (`theme.ts`, `index.ts`, `init.ts`, `vuetifyTheme.ts`)
- [x] T004 Create `ThemeSwitcher.vue` and add it to `SettingsPanel.vue` and `src/pwa/App.vue`
- [x] T005 Wire `init`, `initTheme`, `bindVuetifyTheme` in both `main.ts`; add `color-scheme` meta to both `index.html`
- [x] T006 Replace hard-coded colours in shared components and popup/PWA styles; class-based SVG colours in `ExerciseCard.vue`
- [x] T007 Unit tests for theme logic and `ThemeSwitcher`
- [x] T008 Document theming in `CLAUDE.md` and `README.md`
- [ ] T009 Manual QA: Light/Dark/System with OS set each way, persistence after reload/reopen, no flash
