# Feature Specification: PWA with Background Notifications

**Feature Directory**: `specs/002-pwa-background-notifications`
**Created**: 2026-05-28
**Status**: Draft
**Input**: User description: "Now I have everything and the project is up and running but I want this to be a PWA also so a user can install the application and get constant notifications even if the browser is not opened."

---

## Clarifications

### Session 2026-05-28

- Q: Which storage API should the PWA service worker use to read settings when all browser windows are closed? → A: `IndexedDB` — the standard service-worker-accessible async storage API, supported on all target browsers.
- Q: How should PWA updates be applied when a new service worker is available? → A: New SW waits in standby; the app displays a subtle "Update available — reload to apply" banner; update activates on user-initiated reload.
- Q: Should the PWA and Chrome extension share settings when both are installed on the same device? → A: Fully isolated — each product maintains its own independent settings and schedule; no synchronisation between them is required or provided.
- Q: How should the PWA build output coexist with the Chrome extension build? → A: Separate build command (`npm run build:pwa`) outputting to `dist-pwa/`; the existing `npm run build` and `dist/` folder for the extension remain unchanged.
- Q: What name should the PWA display to the OS when installed (taskbar, home screen, desktop shortcut)? → A: `EyeSaver` — identical to the Chrome extension name; no suffix or distinction required.

---

## Overview

Extend EyeSaver into a Progressive Web App (PWA) in addition to the existing Chrome extension, so users on any modern browser can install EyeSaver directly from the web and receive eye exercise reminders in the background — even when all browser windows are closed.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Install EyeSaver as a PWA (Priority: P1)

A developer using Firefox — where Chrome extensions are not available — visits the EyeSaver web app. The browser shows an install prompt. They click "Install" and the app appears as a standalone icon on their desktop. Clicking it opens EyeSaver without any browser address bar, ready to schedule reminders.

**Why this priority**: Installability is the entry point for all other PWA functionality. Without it, background notifications cannot fire and the value proposition cannot be delivered.

**Independent Test**: Visit the hosted web app in Chrome/Edge, trigger the install prompt, install the app, and verify it opens in standalone mode as an independent window.

**Acceptance Scenarios**:

1. **Given** a user visits the EyeSaver web app in a supported browser, **When** the page loads, **Then** the browser's native install prompt is displayed (or can be triggered by the user).
2. **Given** the PWA is installed, **When** the user launches it, **Then** it opens in standalone mode with no browser address bar or navigation UI.
3. **Given** the PWA is installed on desktop, **When** the user launches it from their OS, **Then** the app loads within 3 seconds even without a network connection.

---

### User Story 2 — Receive Reminders With the Browser Closed (Priority: P1)

A student installs EyeSaver PWA on their laptop, configures a 30-minute reminder interval, then closes all browser windows. Thirty minutes later, a system notification appears on their screen with an eye exercise prompt — no browser window was open.

**Why this priority**: This is the central differentiator of the PWA over a bookmarked webpage. Without background notifications, the PWA offers no advantage over visiting the site in a tab.

**Independent Test**: Install the PWA, grant notification permissions, configure an interval, close all browser windows, and verify a notification fires after the interval elapses.

**Acceptance Scenarios**:

1. **Given** the PWA is installed, notifications are granted, and reminders are enabled, **When** the configured interval elapses and no browser window is open, **Then** the OS displays an eye exercise reminder notification.
2. **Given** a background reminder notification appears, **When** the user clicks/taps it, **Then** the PWA opens (or is brought to focus) and displays the relevant exercise details.
3. **Given** the user has not interacted with the app for multiple intervals, **When** each interval elapses, **Then** reminders continue to fire at the configured cadence without requiring the app to be reopened.
4. **Given** background sync is not available in the user's browser, **When** the app is opened, **Then** a clear in-app message explains that background reminders are unavailable and advises the user to keep a browser tab open for foreground-only reminders.

---

### User Story 3 — Grant Notification Permissions (Priority: P2)

A new user installs EyeSaver PWA and opens it for the first time. The app explains why notifications are needed and prompts for permission before scheduling any reminders. If the user denies permission, the app shows a helpful message with guidance to re-enable it from browser settings.

**Why this priority**: Without notification permission, no reminders can be delivered. Users need to understand why they are granting it to avoid reflexive denial.

**Independent Test**: Open a fresh PWA install, observe the permission prompt, deny permission, and verify the in-app fallback message is shown with clear guidance.

**Acceptance Scenarios**:

1. **Given** the PWA is opened for the first time, **When** it loads, **Then** the app explains the purpose of notifications and presents the browser's native permission prompt before scheduling anything.
2. **Given** the user grants notification permission, **When** confirmed, **Then** reminder scheduling begins immediately using the configured or default interval.
3. **Given** the user denies notification permission, **When** confirmed, **Then** the app displays a visible in-app message explaining that reminders are blocked and provides step-by-step guidance to re-enable notifications from browser settings.
4. **Given** notification permission is permanently blocked at the browser/OS level, **When** the app is opened, **Then** it detects this and shows the guidance message; it does NOT silently fail or show a broken state.

---

### User Story 4 — Manage Settings in the Installed App (Priority: P2)

A developer launches EyeSaver from their taskbar, changes the reminder interval from 20 to 45 minutes, and closes the app window. The next background notification fires 45 minutes later — the new interval is respected.

**Why this priority**: Without persistent settings, the PWA cannot personalise the reminder experience across sessions.

**Independent Test**: Open the PWA, change the interval, close the app, and confirm the next reminder fires at the updated interval.

**Acceptance Scenarios**:

1. **Given** the installed PWA is launched, **When** settings are changed, **Then** the change takes effect for the next reminder cycle without requiring the app to be reopened.
2. **Given** settings are saved and the app is closed, **When** the next reminder interval elapses in the background, **Then** the reminder fires using the updated settings.
3. **Given** the app is relaunched after a device restart, **When** it loads, **Then** all previously saved settings are restored.

---

### User Story 5 — Snooze or Dismiss a Background Notification (Priority: P3)

A user receives a background notification mid-task. They tap "Snooze" on the notification. After the configured snooze duration, the reminder re-fires — even though the app window is still closed.

**Why this priority**: Without snooze on background notifications, users will disable reminders entirely rather than miss-time their breaks.

**Independent Test**: Trigger a background notification, click Snooze on the notification itself, verify the app window is not needed, and confirm the re-fire after the snooze duration.

**Acceptance Scenarios**:

1. **Given** a background notification appears, **When** the user selects "Snooze" from the notification, **Then** the notification dismisses and re-fires after the configured snooze duration without the user needing to open the app.
2. **Given** a background notification appears, **When** the user dismisses it without snoozing, **Then** the timer resets to the full configured interval.
3. **Given** a snooze is active and the snooze duration elapses with no app window open, **Then** the reminder re-fires as a new background notification.

---

### Edge Cases

- **Notification permission revoked after granting**: The app detects blocked permission on next launch and shows the guidance message; pending alarms are paused.
- **PWA uninstalled by the user**: All locally stored settings and schedules are cleared; no residual background processes remain.
- **Device in Do Not Disturb / Focus mode**: Notifications are queued or suppressed by the OS following standard system behaviour; the app does not attempt to override system-level DND.
- **Both Chrome extension and PWA installed simultaneously**: Each product is fully isolated — independent settings, independent schedules, independent storage APIs (`chrome.storage.local` for the extension; `IndexedDB` for the PWA). No synchronisation or cross-product conflict resolution is required or provided. A user changing the interval in one product will not affect the other.
- **Background sync throttled by the OS**: Reminders may be delayed by up to several minutes due to OS-level throttling; this is expected and documented in the UI ("Reminders fire within ~5 minutes of the scheduled time").
- **App is opened by clicking a notification**: The app scrolls to or highlights the exercise referenced in the notification rather than showing a generic home screen.
- **Device offline at notification time**: Because all content is bundled, notifications and exercise details are shown fully offline; no network error occurs.
- **User has never opened the app after installing**: No reminders fire until the app is opened at least once and notification permission is granted (required by platform constraints).
- **New service worker waiting while app is open**: The app shows a persistent "Update available — reload to apply" banner; existing reminders and settings are unaffected until the user reloads.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The web app MUST meet all PWA installability criteria: a valid web app manifest, a registered service worker, and delivery over HTTPS.
- **FR-002**: The installed PWA MUST launch in standalone mode (no browser address bar, navigation, or tab UI visible to the user).
- **FR-003**: The PWA MUST request notification permission from the user before scheduling any reminders; reminders MUST NOT be scheduled if permission is denied.
- **FR-004**: If notification permission is denied or revoked, the PWA MUST display a clear in-app message that explains reminders are blocked and guides the user to re-enable them from browser/OS settings.
- **FR-005**: The PWA MUST deliver eye exercise reminders in the background — when all browser windows are closed — on platforms that support background notification scheduling without a push server.
- **FR-006**: On platforms where background notification scheduling is not supported, the PWA MUST fall back gracefully: reminders fire while the app is open or a browser tab is running, and the UI MUST communicate this limitation clearly.
- **FR-007**: Background notifications MUST include at minimum a "Snooze" action and a "Dismiss" action, operable directly from the notification without opening the app.
- **FR-008**: Tapping or clicking a reminder notification MUST open (or focus) the PWA and display the exercise referenced in that notification.
- **FR-009**: The PWA MUST preserve full feature parity with the Chrome extension: configurable reminder interval (15–90 min), snooze duration (2–15 min), enable/disable toggle, and sequential exercise rotation.
- **FR-010**: All settings MUST persist locally on the device using `IndexedDB` (accessible by both the app and the service worker without a browser window open) across app close, browser restart, and device restart; no account or server-side storage is required.
- **FR-011**: The PWA MUST function fully offline after the first visit: all exercises, settings UI, and scheduling logic are embedded; no network request is needed during normal operation.
- **FR-012**: The PWA shell and all exercise content MUST be served from the browser's cache on repeat visits, even without a network connection.
- **FR-013**: On first launch (before any reminder has fired), the PWA MUST display exercise #1 and indicate when the first reminder is scheduled; no distinct onboarding screen is required.

### Non-Functional Requirements

- **NFR-001**: The installed PWA MUST load its core interface within 3 seconds on a modern device without a network connection (cache-first strategy).
- **NFR-002**: Background reminders MUST fire within 5 minutes of the scheduled time on platforms that support background notification scheduling (subject to OS-level throttling, which is outside the app's control).
- **NFR-003**: The PWA MUST be served exclusively over HTTPS; HTTP access is not supported.
- **NFR-004**: Notification permission MUST be requested using only standard browser permission APIs; no dark patterns, re-prompting after denial, or workarounds to bypass permission decisions are permitted.
- **NFR-005**: All interactive elements in the PWA MUST be keyboard-navigable (Tab to focus, Enter/Space to activate); body text MUST use a minimum font size of 14px; foreground-to-background colour contrast MUST meet a minimum ratio of 4.5:1.
- **NFR-006**: When a new version of the PWA is available, the app MUST display a non-blocking "Update available" banner; the update MUST activate only on a user-initiated reload. The app MUST NOT force-reload mid-session or discard unsaved settings state without user confirmation.

---

## Key Entities

- **Web App Manifest**: A JSON descriptor declaring the app name as `EyeSaver`, icons, display mode (`standalone`), theme colour, and start URL — required for PWA installability.
- **PWA Service Worker**: A background script that intercepts network requests (for offline caching), handles incoming notification events, and registers for background sync tasks to trigger scheduled reminders.
- **Background Sync Schedule**: The stored reminder interval, next-fire timestamp, snooze state, and exercise index — persisted in `IndexedDB` so the service worker can reconstruct the schedule on wake-up without a browser window open.
- **Exercise** (unchanged): A named eye practice with ordered steps, estimated duration, and a fixed rotation index.
- **User Settings**: Reminder interval, snooze duration, and enabled flag — persisted in `IndexedDB`, readable by both the app window and the service worker; no cross-device sync.

---

## Success Criteria *(mandatory)*

- **SC-001**: A user on a non-Chrome browser (e.g., Firefox, Edge) can install EyeSaver as a PWA and receive their first reminder within the configured interval, without installing any browser extension.
- **SC-002**: On Chrome/Edge desktop with the PWA installed, at least 9 out of 10 scheduled reminders fire within 5 minutes of their target time while the browser is closed.
- **SC-003**: A new user completes the full install-and-setup flow (visit page → install → grant permission → first reminder scheduled) in under 2 minutes.
- **SC-004**: Users who install the PWA receive at least as many reminders per active day as Chrome extension users (reminder rate parity between the two delivery methods on supported platforms).
- **SC-005**: When notification permission is blocked, 100% of users see the in-app guidance message — no silent failure or broken state.
- **SC-006**: The PWA loads all core functionality within 3 seconds on a device with no network connection after the initial installation.

---

## Scope

### In Scope
- Web app manifest (distinct from the Chrome extension's `manifest.json`)
- Service worker for offline caching and background notification scheduling
- "Add to Home Screen" / install prompt flow
- Notification permission request and denial fallback
- Background reminder delivery (browser closed) on platforms supporting it without a server
- Foreground-only fallback with in-app communication of the limitation
- Snooze and dismiss actions directly from the notification
- Offline-first functionality (cache-first for all app assets)
- Full feature parity with the Chrome extension (settings, exercises, rotation, snooze, dismiss)
- Separate `npm run build:pwa` command outputting to `dist-pwa/` (deployed to static host); extension build (`npm run build` → `dist/`) is unchanged

### Out of Scope
- Server-side push notification infrastructure (all scheduling is client-side)
- Cross-device settings synchronisation
- iOS background notifications (iOS does not support background notification scheduling for PWAs without a push server; iOS users receive foreground-only reminders)
- Any changes to Chrome extension behaviour or source code
- User accounts or authentication
- Analytics or usage telemetry
- Chrome extension to PWA migration wizard

---

## Assumptions

1. The PWA will be hosted on a static HTTPS host (e.g., GitHub Pages, Netlify, or Vercel); no backend server is required or planned.
2. Background notifications without a server are implemented using the **Periodic Background Sync API** where available (Chrome 80+ on desktop and Android); unsupported browsers fall back to foreground-only notifications.
3. iOS Safari background notification support is out of scope due to platform limitations (iOS does not support Periodic Background Sync without Apple Push Notification Service and a server).
4. The existing Vite + Vue 3 build pipeline will be extended to add a separate `npm run build:pwa` command that outputs the PWA build to `dist-pwa/`. The existing `npm run build` command and `dist/` output for the Chrome extension are not modified.
5. Service worker lifecycle is managed automatically by the PWA plugin; manual cache-busting and update flows follow standard PWA conventions.
6. The user must open the PWA at least once and grant notification permission for background reminders to activate — this is a platform constraint, not a product decision.
7. No changes to the Chrome extension's `manifest.json`, service worker, or storage logic are required; the PWA and extension share exercise definitions and settings constants (source-level) but run as fully independent builds with isolated runtime state — settings changed in one product have no effect on the other.
8. The background sync interval accuracy is subject to OS-level throttling (typically ±5 minutes); this is documented to users in the UI.
9. The PWA app name is `EyeSaver` — identical to the Chrome extension. No suffix (e.g., "Web" or "PWA") is used; users are not expected to differentiate between the two products by name.

---

## Dependencies

- Existing EyeSaver codebase (Vue 3, Vite, TypeScript, Pinia, Vuetify)
- Static HTTPS hosting environment
- Browser support: Chrome 80+, Edge 80+ (full background support); Firefox, Safari (foreground-only fallback)
- PWA build tooling compatible with existing Vite setup
