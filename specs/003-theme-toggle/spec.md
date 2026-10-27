# Feature Specification: Light/Dark Theme Toggle

**Feature Directory**: `specs/003-theme-toggle`
**Status**: Draft
**Input**: "Add a light/dark theme to the extension popup and the PWA, and save the user preference inside localStorage."

## User Scenarios & Testing

### User Story 1 — Choose a theme (Priority: P1)
The user opens Settings (popup or PWA) and picks **System**, **Light** or **Dark**. The change applies immediately.

**Acceptance**
1. Selecting Light or Dark changes every screen (countdown, exercise card, settings, alerts) at once.
2. Selecting System follows the OS `prefers-color-scheme`, including live OS changes.

### User Story 2 — Choice persists (Priority: P1)
**Acceptance**
1. After closing and reopening the popup, or reloading the PWA, the chosen theme is restored.
2. With no saved choice, the app follows the OS setting (System).
3. No flash of the wrong theme on load.

## Requirements

- **FR-001**: Palettes are defined once as `--es-*` CSS custom properties in `src/shared/styles/_theme.scss`, switched by `data-theme` on `<html>`.
- **FR-002**: A System/Light/Dark control is reachable from Settings in both the popup and the PWA.
- **FR-003**: The choice is stored in `localStorage` under `eyesaver-theme`.
- **FR-004**: The stored theme is applied before first paint (side-effect module imported first in each `main.ts`; MV3 forbids inline scripts).
- **FR-005**: Theme logic lives in one shared module, `src/shared/theme/`.
- **FR-006**: Text meets WCAG AA contrast (4.5:1) in both themes.
- **FR-007**: No hard-coded colours remain in shared components or popup/PWA app styles.

## Out of scope
Notification content, the extension icon, syncing the theme between the extension and the PWA, and background service workers.

## Notes
Unlike specs 001 and 002, this feature adds automated unit tests (explicitly requested): theme logic default, persistence and System mode.
