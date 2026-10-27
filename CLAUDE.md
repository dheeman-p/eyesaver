# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start

**Build:** `npm run build` — compiles Vue 3 + TypeScript to browser extension in `dist/`

**Dev:** `npm run dev` — runs Vite dev server for hot-reload popup development

**Type Check:** `npm run build` includes `vue-tsc --noEmit` as the first step

## Architecture

EyeSaver is a Chrome extension (MV3) that delivers periodic eye-exercise reminders via notifications. It has three distinct layers:

### 1. Popup UI (`src/popup/`)
The extension's user-facing popup panel. Built with **Vue 3**, **Vuetify** (Material Design), and **Pinia** (state management).

- **App.vue** — root component; renders the settings panel + exercise list
- **SettingsPanel.vue** — toggle enable, adjust interval/snooze sliders
- **ExerciseCard.vue** — display current or list exercise details (name, steps, duration)
- **CountdownTimer.vue** — visual timer during an active reminder
- **stores/** — Pinia stores manage local state:
  - `settingsStore` — reads/writes user settings to `chrome.storage.local`, exposes `enabled`, `intervalMinutes`, `snoozeDurationMinutes`
  - `scheduleStore` — tracks alarm state and cycle progress
  - `exerciseStore` — current exercise display state
- **composables/useStorage.ts** — wrapper around `chrome.storage.local` with reactive Vue bindings
- **styles/main.scss** — custom CSS; `_variables.scss` defines Vuetify theme overrides

### 2. Background Service Worker (`src/background/service-worker.ts`)
Runs continuously (MV3 style, no persistent background page). Orchestrates the full reminder lifecycle:

- **On install** — seed `chrome.storage.local` with default settings and state, schedule the first alarm
- **Main alarm (`ALARM_NAME`)** — show exercise notification, pre-advance the exercise index, reschedule next alarm
- **Snooze button** — pause main alarm, start snooze countdown, clear notification
- **Snooze elapsed** — re-show the same exercise, restart main alarm interval
- **User dismiss** — clear state, restart main interval (without advancing — already done by alarm)
- **Settings change** — listen to `chrome.storage.onChanged` and react to enable/interval updates

**Key contract:** The alarm handler **pre-advances** the stored `currentExerciseIndex` before showing the notification. This ensures the value is always "the next index to show."

### 3. Shared Data (`src/shared/`)
Constants, types, and exercise definitions used by both popup and service worker:

- **types/index.ts** — `Exercise`, `UserSettings`, `ReminderState`, `StorageSchema` interfaces
- **constants/index.ts** — alarm/notification IDs, storage keys, default values, validation bounds
- **exercises/index.ts** — static array of eye-exercise objects (name, steps, duration)

## Storage Schema

All state lives in `chrome.storage.local` under two keys:

```
eyesaver_settings: {
  intervalMinutes: 15–90 (default: 20),
  snoozeDurationMinutes: 2–15 (default: 5),
  enabled: boolean
}

eyesaver_state: {
  cycleStartedAt: number (unix ms),
  currentExerciseIndex: number (0 to EXERCISES.length – 1),
  activeNotificationId: string | null
}
```

## Manifest & Permissions

**manifest.json** declares:
- Action popup: `src/popup/index.html`
- Service worker: `src/background/service-worker.ts`
- Required permissions: `notifications`, `storage`, `alarms`
- Icons: 16px, 48px, 128px (bundled in `dist/icons/`)

## Build Pipeline

**Vite + TypeScript + Vue plugins:**
- `@vitejs/plugin-vue` — single-file components
- `vite-plugin-vuetify` — auto-import Vuetify components
- `vite-plugin-web-extension` — web extension bundling (reads manifest, outputs to `dist/`)
- `vue-tsc` — type checking (no-emit mode in dev, flagged errors on build)

Imports use path aliases:
- `@shared` → `src/shared/`
- `@popup` → `src/popup/`

## Key Implementation Details

### Settings Persistence
Popup reads/writes to `chrome.storage.local` via `useStorage()` composable. Pinia stores expose `ready` flag to gate UI rendering until storage is hydrated. Service worker listens to `storage.onChanged` to react to user changes.

### Alarm Lifecycle
- Main alarm fires → show current exercise → pre-advance index → reschedule
- Snooze button → clear main alarm → schedule snooze alarm → clear notification
- Snooze alarm → show snoozed exercise (recalculate index via modulo) → restart main alarm
- Dismiss notification → reset cycle start time → restart main alarm (no advance)

### Icon Handling
Service worker converts the bundled PNG icon to a data URL on first access and caches it. This avoids Chrome MV3 service-worker lifecycle issues with `chrome-extension://` URLs.

## File Map

```
src/
├── background/service-worker.ts    (alarm, notification, storage lifecycle)
├── popup/
│   ├── App.vue                     (root layout)
│   ├── main.ts                     (Vue app init, Vuetify setup)
│   ├── index.html                  (DOM mount point)
│   ├── components/
│   │   ├── ExerciseCard.vue
│   │   ├── SettingsPanel.vue
│   │   └── CountdownTimer.vue
│   ├── composables/useStorage.ts   (reactive storage wrapper)
│   ├── stores/
│   │   ├── settingsStore.ts
│   │   ├── scheduleStore.ts
│   │   └── exerciseStore.ts
│   └── styles/
│       ├── main.scss
│       └── _variables.scss
├── shared/
│   ├── constants/index.ts
│   ├── types/index.ts
│   ├── theme/                  (light/dark theme logic)
│   ├── styles/_theme.scss      (colour palettes)
│   └── exercises/index.ts
└── manifest.json

dist/                               (built output; .gitignore'd)
```

## Theming

- The light/dark palettes are defined once, as `--es-*` CSS custom properties, in `src/shared/styles/_theme.scss`. The active palette is chosen by `data-theme="light|dark"` on `<html>`; with no attribute, `prefers-color-scheme` decides.
- Theme logic (read, write, apply) lives in `src/shared/theme/` (`useAppTheme()`); `src/shared/theme/init.ts` is imported first in each `main.ts` to apply the stored theme before first paint. `src/shared/theme/vuetifyTheme.ts` keeps Vuetify's theme in step.
- The choice (`system` | `light` | `dark`) is stored in `localStorage` under `eyesaver-theme` (`THEME_STORAGE_KEY`); each origin (extension popup, PWA) keeps its own. The control is `src/shared/components/ThemeSwitcher.vue`, shown at the top of Settings.
- To add a colour: add the same key to both the `$light` and `$dark` maps in `_theme.scss` (and to `vuetifyThemes` if Vuetify needs it), then use `var(--es-<key>)`. Never hard-code colours in components.

## Testing and Validation

Unit tests (`npm test`, vitest + jsdom) cover the theme logic and `CountdownTimer`. Manual validation:
1. Install extension locally: `npm run build`, then load `dist/` in Chrome DevTools
2. Open popup, toggle enable, adjust sliders — verify `chrome.storage.local` updates
3. Wait for (or manually trigger) alarm via Chrome DevTools > Alarms tab
4. Verify notification fires, snooze works, dismiss clears state

---

**Specification:** See `specs/001-eye-exercise-reminder/` for the full feature spec, data model, and requirements checklists.
