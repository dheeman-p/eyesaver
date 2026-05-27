# Implementation Plan: Eye Exercise Reminder Chrome Extension

**Branch**: `001-eye-exercise-reminder` | **Date**: 2026-05-27 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-eye-exercise-reminder/spec.md`

## Summary

EyeSaver is a Chrome Extension (Manifest V3) that fires OS-level notifications at user-defined intervals (default 20 min, range 15–90 min) prompting screen-heavy users to perform one of 6 sequentially rotating, specialist-recommended eye exercises. The popup is built with Vue 3 + Pinia + TypeScript + Vuetify 3 (tree-shaken material controls) on a Vite build stack using `vite-plugin-web-extension`. The background service worker uses `chrome.alarms` for reliable timer management and `chrome.notifications` for delivery, including a one-click Snooze action button. All state is persisted in `chrome.storage.local`; no network calls are made.

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: Vue 3.5.x, Pinia 2.x, Vuetify 3.x (tree-shaken), SCSS (Sass 1.x), Vite 5.x, vite-plugin-web-extension 4.x, @mdi/js, @types/chrome
**Storage**: `chrome.storage.local` — device-scoped, persists across browser restarts; no cross-device sync
**Testing**: Manual QA only — no automated tests (constitution Principle IV)
**Target Platform**: Chrome Browser (Manifest V3), Desktop (Windows / macOS / Linux); mobile Chrome out of scope
**Project Type**: Chrome Browser Extension
**Performance Goals**: Popup loads < 200ms; alarm delivery within 30s of scheduled time; unpacked extension size < 5MB
**Constraints**: Fully offline; MV3 ephemeral service worker (no `setTimeout`/`setInterval` — `chrome.alarms` only); no test libraries; no SSR; no `chrome.storage.sync`
**Scale/Scope**: Single user, 6 bundled exercises, 4 logical popup states (idle / active-reminder / settings / first-install)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Keep It Simple (KISS) | ✅ PASS | Vue 3 + Pinia justified by reactive multi-state popup; Vuetify justified by material UI requirement with tree-shaking keeping bundle lean; `useStorage` composable replaces heavy third-party persistence plugin |
| II. Modular Architecture | ✅ PASS | `popup/`, `background/`, `shared/` are isolated contexts; state flows exclusively via `chrome.storage.local`; each component and store has a single responsibility |
| III. Frontend-First | ✅ PASS | Pure browser extension; no backend; no SSR; no host permissions |
| IV. No Automated Testing | ✅ PASS | No test files, no test libraries, no test runner configuration present |
| Technology Standards | ✅ PASS | TypeScript baseline; Vuetify 3 justified; `@mdi/js` chosen over `@mdi/font` for bundle size; SCSS with scoped Vue SFC `<style lang="scss">` blocks for consistent naming |

**POST-DESIGN RE-CHECK (post-analysis)**: All principles continue to hold. Analysis findings F1–F7 corrected without introducing complexity violations.

**GATE: ALL PASS**

## Project Structure

### Documentation (this feature)

```text
specs/001-eye-exercise-reminder/
├── plan.md                    # This file
├── research.md                # Phase 0 output
├── data-model.md              # Phase 1 output
├── quickstart.md              # Phase 1 output
├── contracts/
│   └── storage-schema.md      # Phase 1 output
└── tasks.md                   # Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code (repository root)

```text
src/
├── background/
│   └── service-worker.ts      # chrome.alarms handler, chrome.notifications, snooze logic
├── popup/
│   ├── App.vue                # Root Vue component — Vuetify VApp shell, view routing
│   ├── main.ts                # Bootstrap: createApp + createPinia + createVuetify
│   ├── components/
│   │   ├── ExerciseCard.vue   # Exercise name, description, numbered steps (VCard)
│   │   ├── CountdownTimer.vue # Live countdown to next reminder (VProgressLinear + label)
│   │   └── SettingsPanel.vue  # Interval + snooze inputs (VTextField), enable toggle (VSwitch)
│   ├── stores/
│   │   ├── exerciseStore.ts   # Exercise array, currentIndex, advance(); reads shared/exercises
│   │   ├── scheduleStore.ts   # Active-notification flag, cycleStartedAt, countdown display value
│   │   └── settingsStore.ts   # intervalMinutes, snoozeDurationMinutes, enabled; persists via useStorage
│   ├── composables/
│   │   └── useStorage.ts      # chrome.storage.local get/set/watch — reactive Vue ref bridge (~30 lines)
│   └── styles/
│       ├── _variables.scss    # Design tokens: colours, spacing, border-radius, typography
│       └── main.scss          # Global resets + Vuetify SCSS variable overrides
├── shared/
│   ├── types/
│   │   └── index.ts           # Exercise, UserSettings, ReminderState, StorageSchema interfaces
│   ├── exercises/
│   │   └── index.ts           # Static array of 6 Exercise objects (bundled content)
│   └── constants/
│       └── index.ts           # ALARM_NAME, SNOOZE_ALARM_NAME, NOTIFICATION_ID, DEFAULT_SETTINGS, DEFAULT_STATE
├── manifest.json              # Chrome MV3 manifest — permissions: notifications, storage, alarms
└── vite.config.ts             # vite-plugin-web-extension multi-entry build config
```

**Structure Decision**: Single-project Chrome extension layout. Two runtime contexts (`popup/` for the Vue 3 UI and `background/` for the MV3 service worker) are kept strictly isolated with no direct imports between them. All cross-context communication flows exclusively through `chrome.storage.local`. Shared TypeScript types and static exercise content live in `shared/` and are imported at build time by both contexts. No `tests/` directory — constitution Principle IV.

## Complexity Tracking

> No constitution violations — this section is not applicable.
