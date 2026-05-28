# Implementation Plan: PWA with Background Notifications

**Branch**: `feature/eyesaverpwa` | **Date**: 2026-05-28 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/002-pwa-background-notifications/spec.md`

## Summary

Extend EyeSaver into a Progressive Web App (PWA) that users can install from any modern browser and receive eye exercise reminders — including when no browser window is open. The PWA reuses the existing Vue 3 + Pinia + Vuetify 3 frontend and shared exercises/types from `src/shared/`, adds a new `src/pwa/` layer with an IndexedDB-backed settings store and a custom service worker (`injectManifest` strategy via `vite-plugin-pwa`), and adds a separate `vite.config.pwa.ts` that outputs to `dist-pwa/` without touching the existing Chrome extension build. Background notifications on desktop Chrome/Edge are delivered via the Periodic Background Sync API (catch-up mechanism) combined with foreground `setTimeout` scheduling; platforms that do not support background sync receive foreground-only reminders with an in-app capability notice.

## Technical Context

**Language/Version**: TypeScript 5.x (existing)
**Primary Dependencies**: Vue 3.5.x, Pinia 2.x, Vuetify 3.x, Vite 5.x (all existing) + `vite-plugin-pwa` (new) + Workbox (peer dep of `vite-plugin-pwa`, auto-managed)
**Storage**: IndexedDB — accessible from both the Vue app and the PWA service worker without a browser window; no `chrome.storage` used by the PWA
**Testing**: Manual QA only — no automated tests (constitution Principle IV)
**Target Platform**: Chrome 80+, Edge 80+ (full background support); Firefox 63+, Safari 16.4+ (foreground-only fallback); desktop primary, Android secondary
**Project Type**: Progressive Web App (installable standalone web application)
**Performance Goals**: PWA shell loads < 3 s offline (cache-first); notifications fired within app's own logic < 1 s of due time (OS throttling outside app control)
**Constraints**: Fully offline after first visit; no backend/push server; HTTPS-only for production; no `chrome.*` APIs; no test libraries; no SSR
**Scale/Scope**: Single user per device; 6 bundled exercises; 3 app states (idle / active-reminder / permission-blocked)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Keep It Simple (KISS) | ✅ PASS | `vite-plugin-pwa` justified — handles SW registration, manifest injection, and Workbox precaching automatically, avoiding ~200 lines of boilerplate. Minimal IndexedDB wrapper (~60 lines) instead of `idb` library. No new UI framework. |
| II. Modular Architecture | ✅ PASS | `src/pwa/` is a new isolated context; service worker is a single file; IndexedDB composable is a pure utility; PWA Pinia stores are independent of Chrome extension stores. `src/shared/` is reused read-only. |
| III. Frontend-First | ✅ PASS | Pure browser PWA; all scheduling runs in the browser/service worker; no backend, no SSR, no network calls. |
| IV. No Automated Testing | ✅ PASS | No test files, no test libraries, no test runner changes. |
| Technology Standards | ✅ PASS | `vite-plugin-pwa` is actively maintained, widely used, < 5KB overhead. Workbox is a Google-maintained peer dependency. No mixed CSS conventions — existing SCSS approach extended. |

**POST-DESIGN RE-CHECK**: All principles hold. `vite-plugin-pwa` with `injectManifest` strategy is the simplest approach that meets the custom service worker requirement. Dual Vite config is the minimal change that keeps the extension build fully untouched.

**GATE: ALL PASS**

## Project Structure

### Documentation (this feature)

```text
specs/002-pwa-background-notifications/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── storage-schema.md  # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code (repository root)

```text
src/
├── background/
│   └── service-worker.ts      # Chrome extension SW — UNCHANGED
├── popup/                     # Chrome extension popup — reusable UI components moved to src/shared/components/ (T035)
├── shared/                    # Shared types, exercises, constants, and UI components — reused by popup and PWA
│   ├── components/
│   │   ├── ExerciseCard.vue   # MOVED from src/popup/components/ (shared by popup and PWA)
│   │   ├── CountdownTimer.vue # MOVED from src/popup/components/
│   │   └── SettingsPanel.vue  # MOVED from src/popup/components/
│   ├── constants/index.ts
│   ├── exercises/index.ts
│   └── types/index.ts
└── pwa/                       # NEW: PWA-specific layer
    ├── App.vue                # PWA root component (reuses src/shared/components/, adds capability notice)
    ├── main.ts                # Vue app init for PWA (no chrome.* imports)
    ├── index.html             # PWA DOM mount point
    ├── service-worker.ts      # Custom PWA SW: Workbox precaching + notification scheduling
    ├── composables/
    │   └── useIDBStorage.ts   # Minimal async IndexedDB wrapper (~60 lines)
    └── stores/
        ├── settingsStore.ts   # IDB-backed: intervalMinutes, snoozeDurationMinutes, enabled
        └── scheduleStore.ts   # IDB-backed: nextFireAt, snoozedUntil, currentExerciseIndex

public/
└── icons/                     # Existing icons reused for PWA manifest

vite.config.ts                 # Chrome extension build — UNCHANGED
vite.config.pwa.ts             # NEW: PWA build config (vite-plugin-pwa, outDir: dist-pwa)
dist/                          # Chrome extension output — UNCHANGED (gitignored)
dist-pwa/                      # NEW: PWA build output — gitignored
```

**Structure Decision**: Additive-only. A new `src/pwa/` context is created alongside `src/popup/` and `src/background/`. All three contexts share `src/shared/` read-only. The PWA context deliberately does not import from `src/popup/` or `src/background/` to maintain full isolation. Reusable UI components (`ExerciseCard.vue`, `CountdownTimer.vue`, `SettingsPanel.vue`) are relocated from `src/popup/components/` to `src/shared/components/` and imported by both `src/popup/` and `src/pwa/` via the `@shared` alias — no sibling cross-imports, isolation fully maintained (C1 fix). The existing `vite.config.ts` is untouched; a new `vite.config.pwa.ts` drives the separate PWA build. No `tests/` directory — constitution Principle IV.

## Complexity Tracking

> No constitution violations — this section is not applicable.
