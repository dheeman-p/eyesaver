# Development guide

This page describes how the code is organised for development: conventions, testing,
contribution workflow, and common tasks.

## Coding conventions

### TypeScript

`tsconfig.json` enables strict checks:

- `strict: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noFallthroughCasesInSwitch: true`

Other relevant settings: `target: ES2022`, `moduleResolution: Bundler`, DOM libs,
`resolveJsonModule`, `isolatedModules`, and `types: ["chrome", "vite/client"]`.

Because both `build` scripts run `vue-tsc --noEmit`, unused locals/parameters and
switch fallthroughs fail the build. Keep the compiler clean.

### Vue components

- Use Vue 3 Single-File Components with `<script setup lang="ts">`.
- Shared components live in `src/shared/components/`; target-specific components live
  under `src/popup/` or `src/pwa/`.
- Use SCSS (`<style lang="scss" scoped>`) and the shared design tokens via
  `@use '../styles/variables' as v;` (from components) or the equivalent relative path.
- Icons in the popup use `@mdi/js` path data; the PWA toolbar uses a text glyph.

### Pinia stores

- Use setup-style stores (`defineStore('name', () => { ... })`).
- Extension stores are in `src/popup/stores/` and read/write through
  `useStorage`.
- PWA stores are in `src/pwa/stores/` and read/write through
  `useIDBStorage`.
- Both targets gate UI on a `ready` flag/promise so storage has hydrated before
  rendering dependent state.

### Path aliases

Registered in `tsconfig.json`, both Vite configs, and `vitest.config.ts`:

| Alias | Path | Used by |
|-------|------|---------|
| `@shared/*` | `src/shared/*` | both targets |
| `@popup/*` | `src/popup/*` | extension popup (and shared components that depend on popup stores) |
| `@pwa/*` | `src/pwa/*` | PWA window |

Keep aliases in sync if you add a new one.

### Styling and Vuetify

- Vuetify components are auto-imported by `vite-plugin-vuetify` (both Vite configs).
- Each `main.ts` also registers the exact Vuetify components it uses (and the `Ripple`
  directive), plus a light theme with `primary: '#00897B'`.
- SCSS design tokens are in `src/shared/styles/_variables.scss`. There is also a
  copy in `src/popup/styles/_variables.scss` — the two currently match; prefer the
  shared file for new shared components.
- Popup styles intentionally fix `body` width to `380px`; PWA styles are responsive.

## Testing approach

### Tooling

- Test runner: Vitest (`vitest.config.ts`).
- Environment: `jsdom`, `globals: true`.
- Component testing: `@vue/test-utils` `mount`.
- Aliases: `@shared` and `@popup` are configured for tests.

### Existing spec

`src/popup/components/__tests__/CountdownTimer.spec.ts`:

- Mounts the shared `CountdownTimer.vue` component.
- Mocks `@popup/stores/scheduleStore` with a `vi.mock` factory returning a fixed
  `useScheduleStore` object (`secondsRemaining`, `progressPercent`).
- Stubs `v-progress-linear`.
- Asserts the countdown label for zero/negative/seconds/minutes values, the progress
  `model-value`, and the `role="status"` / `aria-live="polite"` accessibility
  attributes.

This is the only automated test in the repository.

### What is still manual

There are no automated tests for:

- the extension service worker (`src/background/service-worker.ts`),
- the PWA service worker and IndexedDB logic,
- the PWA `App.vue` foreground/settings flows,
- the Pinia stores and storage composables.

For manual verification steps, see `specs/001-eye-exercise-reminder/quickstart.md` and
`specs/002-pwa-background-notifications/quickstart.md`, but note those quickstarts
contain some outdated file paths.

## Branching and contribution workflow

- Work on **feature branches off `main`**, then open a pull request.
- There is no `lint` script configured; code review and `vue-tsc` type checking are the
  main gates.
- Run `npm test` and both builds before requesting review:
  `npm run build` and `npm run build:pwa`.
- Pushes to `main` (or manual workflow dispatch) trigger the GitHub Pages deploy
  workflow in `.github/workflows/deploy.yml`. Note that workflow does **not** run
  `npm test`; it runs `npm ci` and `npm run build:pwa`.

## Common tasks

### Add or edit an exercise

1. Edit `src/shared/exercises/index.ts` (the `EXERCISES` array). Keep `index` values
   sequential and 0-based.
2. If adding an icon/animation, update the `EXERCISE_ICONS` and
   `EXERCISE_ANIMATIONS` maps in `src/shared/components/ExerciseCard.vue`. Fallbacks
   exist for missing indexes.
3. Update any notification text if needed. Exercise title/description/steps are read
   from the shared array in:
   - `src/background/service-worker.ts` (`showExerciseNotification`),
   - `src/pwa/App.vue` (`fireReminder`),
   - `src/pwa/service-worker.ts` (`showReminder`).

### Change settings bounds or defaults

1. Update the shared defaults and bounds in `src/shared/constants/index.ts`
   (`DEFAULT_SETTINGS`, `INTERVAL_MIN/MAX_MINUTES`, `SNOOZE_MIN/MAX_MINUTES`).
2. Update the PWA store literal defaults in `src/pwa/stores/settingsStore.ts`
   (initial refs: `20`, `5`, `true`).
3. Update the PWA service worker fallback values in `src/pwa/service-worker.ts`
   (`?? 20` for interval and `?? 5` for snooze duration).
4. Check validation rules in `src/shared/components/SettingsPanel.vue` and the PWA
   settings form in `src/pwa/App.vue` (they read the shared bounds).

### Add a new setting field

1. Add the field to `UserSettings` in `src/shared/types/index.ts`.
2. Add its default and any bounds to `src/shared/constants/index.ts`.
3. Add a control in `src/shared/components/SettingsPanel.vue` and wire it into
   `src/popup/stores/settingsStore.ts`.
4. Add the equivalent PWA state in `src/pwa/stores/settingsStore.ts`, the inline form
   in `src/pwa/App.vue`, and any service worker fallback in
   `src/pwa/service-worker.ts`.
5. Consider scheduler implications: the extension worker and the PWA worker/`App.vue`
   may need to read the new field.

### Change the PWA IndexedDB schema

The schema is duplicated by design:

- `src/pwa/composables/useIDBStorage.ts` (window helpers), and
- `src/pwa/service-worker.ts` lines 13–56 (worker helpers).

Update **both** copies, keep `DB_NAME`/`DB_VERSION`/store names in sync, and bump
`DB_VERSION` when a migration is required.

### Move or reuse shared components in the PWA

`CountdownTimer.vue` and `SettingsPanel.vue` import stores through `@popup`
(`@popup/stores/scheduleStore` and `@popup/stores/settingsStore` respectively), so they
only work in the extension popup today. The PWA currently uses only `ExerciseCard.vue`
and implements its own countdown/settings inline. Before mounting those two components
in the PWA, decouple them from the popup stores or provide equivalent PWA stores.
