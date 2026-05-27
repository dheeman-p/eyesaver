# Feature Specification: Eye Exercise Reminder Chrome Extension

**Feature Branch**: `001-eye-exercise-reminder`
**Created**: 2026-05-27
**Status**: Draft
**Input**: User description: "A Chrome extension that reminds screen-heavy users (developers, students) to perform eye exercises recommended by eye specialists, reducing end-of-day eye burning and irritation."

---

## Clarifications

### Session 2026-05-27

- Q: How should reminders be delivered — as a Chrome OS-level notification or an in-browser overlay? → A: Chrome OS-level notification (native) via the `chrome.notifications` API.
- Q: Should user settings sync across devices (chrome.storage.sync) or stay local to this browser only (chrome.storage.local)? → A: Local only — `chrome.storage.local`; no cross-device sync required.
- Q: Should the snooze duration be fixed at 5 minutes or configurable by the user? → A: Configurable — user can set snooze duration (2–15 minutes) alongside the reminder interval in the settings area.
- Q: When the popup is opened during an active reminder, should that count as acknowledging the exercise? → A: Yes — opening the popup during an active reminder automatically acknowledges it and resets the timer to the full configured interval.
- Q: What rotation strategy should the extension use when cycling through exercises? → A: Sequential — fixed order cycling (1→2→3→...→N→1); index persists across reminder cycles.
- Q: Does the OS notification include a "Snooze" action button, or does snooze require opening the popup? → A: The notification includes a "Snooze" action button directly on the card; snooze does not require opening the popup.
- Q: What does the popup display before the first reminder has ever fired (first-install state)? → A: Popup shows exercise #1 with a "Your first reminder in X minutes" label; no special onboarding screen needed.
- Q: What is the minimum accessibility requirement for the extension popup? → A: Basic only — all interactive elements keyboard-navigable (Tab/Enter), minimum font size 14px, sufficient colour contrast for readability; no screen-reader optimisation required.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Receive Timely Eye Exercise Reminder (Priority: P1)

A developer has been heads-down coding for 20 minutes. Without being interrupted mid-flow, a non-intrusive notification appears in the browser reminding them to do a quick eye exercise. They follow the steps shown, spend 30–60 seconds doing the exercise, and dismiss the reminder to return to work.

**Why this priority**: This is the core value proposition. Everything else is secondary if reminders don't fire reliably.

**Independent Test**: Install the extension, wait for the first reminder interval to elapse, and verify a notification appears with exercise instructions. Delivers the MVP without any settings UI.

**Acceptance Scenarios**:

1. **Given** the extension is installed and enabled, **When** the configured reminder interval elapses, **Then** a notification is displayed with the name and description of an eye exercise (full step-by-step instructions are available in the popup). *(Analysis F6 fix)*
2. **Given** a notification is displayed, **When** the user reads the steps, **Then** the steps are clear, ordered, and describe a complete exercise in under 60 seconds.
3. **Given** the extension is installed, **When** the user opens a new browser session, **Then** the reminder timer starts automatically without any manual action.

---

### User Story 2 — View Exercise Instructions in Popup (Priority: P2)

A student wants to check what eye exercises are available or view the one they missed. They click the extension icon in the Chrome toolbar and see the current exercise with step-by-step instructions, along with the countdown to the next reminder.

**Why this priority**: Provides on-demand access to exercises beyond just passive notifications; improves trust and engagement.

**Independent Test**: Open the extension popup and verify exercises and next-reminder countdown are visible without any notification having fired.

**Acceptance Scenarios**:

1. **Given** the extension popup is opened, **When** it loads, **Then** it shows the name and full instructions of the current or next exercise.
2. **Given** the extension popup is opened, **When** it loads, **Then** it shows a countdown or label indicating when the next reminder is scheduled.
3. **Given** multiple exercises exist, **When** the popup is reopened across different reminder cycles, **Then** exercises rotate so different ones appear over time.
4. **Given** a reminder notification is currently active, **When** the user opens the popup, **Then** the notification is dismissed and the timer resets to the full configured interval automatically.
5. **Given** the extension is freshly installed and no reminder has ever fired, **When** the popup is opened, **Then** it displays exercise #1 with a label reading "Your first reminder in X minutes" where X reflects the configured interval.

---

### User Story 3 — Customize Reminder Interval (Priority: P3)

A developer finds 20-minute reminders too frequent during deep-focus sessions. They open the extension settings within the popup and change the reminder interval to 45 minutes. The next reminder fires at the new interval.

**Why this priority**: Different users have different work rhythms; configurability increases adoption.

**Independent Test**: Change the interval in the settings UI, verify the countdown updates accordingly, and confirm the next notification fires at the new interval.

**Acceptance Scenarios**:

1. **Given** the settings area is visible, **When** the user changes the reminder interval, **Then** the change takes effect for the next reminder cycle without requiring a browser restart.
2. **Given** a valid interval is entered (15–90 minutes), **When** saved, **Then** the countdown resets to the new interval.
3. **Given** an invalid value is entered (e.g., 0 or above 90), **When** the user tries to save, **Then** the input is rejected with a clear guidance message.

---

### User Story 4 — Snooze or Dismiss a Reminder (Priority: P4)

A developer is in the middle of solving a critical bug. A reminder fires but they cannot take a break right now. They snooze the reminder for 5 minutes. After 5 minutes, the reminder reappears.

**Why this priority**: Without snooze, users will permanently disable the extension rather than wait. Snooze reduces dismissal churn.

**Independent Test**: Trigger a notification, snooze it, and confirm it re-fires after the snooze duration.

**Acceptance Scenarios**:

1. **Given** a reminder notification is visible, **When** the user clicks the "Snooze" action button on the notification card, **Then** the notification dismisses and re-appears after the user-configured snooze duration (default: 5 minutes) without requiring the popup to be opened.
2. **Given** a reminder notification is visible, **When** the user dismisses it without snoozing, **Then** the timer resets to the full configured interval.
3. **Given** the user snoozes a reminder, **When** the snooze expires during an active browser session, **Then** the reminder re-fires automatically.

---

### Edge Cases

- What happens when the browser is closed during an active reminder countdown and then reopened? (Timer restarts from the full interval.)
- What happens when the user has Chrome notifications disabled at the OS level? (Popup badge or in-popup message indicates the issue.)
- What happens if the user opens the popup while a notification is active and then immediately closes it? (The act of opening the popup is sufficient to acknowledge; the timer resets regardless of how long the popup stays open.)
- What happens if the extension is disabled and re-enabled? (Timer resets to the full configured interval from that moment.)
- What happens when the user has multiple Chrome windows/profiles open? (Each profile instance manages its own timer independently.)
- What happens if the user dismisses the notification via the OS (e.g., swipes it away in the notification centre) without using either the Snooze button or the popup? (Treated identically to a normal dismiss — timer resets to the full configured interval.)
- What happens when the user opens the popup for the very first time immediately after installing the extension? (Popup shows exercise #1 and a countdown label "Your first reminder in X minutes"; no empty or broken state.)

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The extension MUST display a reminder notification at a user-configurable interval (default: 20 minutes).
- **FR-002**: The extension MUST include at least 6 distinct eye exercises drawn from specialist-recommended practices (20-20-20 rule, palming, blinking, figure-eight tracking, near-far focus shift, eye rolling).
- **FR-003**: Each reminder MUST be delivered as a Chrome OS-level notification (via `chrome.notifications` API) displaying the exercise name and a brief prompt to open the popup for full step-by-step instructions. The notification MUST include a "Snooze" action button that triggers the snooze behaviour without requiring the popup to be opened.
- **FR-004**: Users MUST be able to set the reminder interval between 15 and 90 minutes via the extension popup.
- **FR-005**: Users MUST be able to snooze an active reminder for a user-configurable duration (default: 5 minutes; range: 2–15 minutes) set via the extension popup settings.
- **FR-006**: Users MUST be able to enable or disable all reminders via a toggle in the popup.
- **FR-007**: The extension MUST rotate through available exercises in a fixed sequential order (1→2→3→...→N→1) across reminder cycles; the current position in the sequence MUST persist so the same exercise never repeats consecutively, even across browser restarts.
- **FR-008**: The extension popup MUST display a countdown to the next scheduled reminder.
- **FR-009**: Settings (interval, enabled state) MUST persist across browser restarts using `chrome.storage.local`; no cross-device sync is required.
- **FR-010**: The extension MUST function fully offline — no network requests are required or made.
- **FR-011**: When the user opens the extension popup while a reminder notification is active, the notification MUST be dismissed and the timer MUST reset to the full configured interval, treating the popup open as an implicit exercise acknowledgment.
- **FR-012**: On first install (before any reminder has fired), the popup MUST display exercise #1 and a label stating "Your first reminder in X minutes", where X is the configured interval; no distinct onboarding screen is required.

### Key Entities

- **Exercise**: A named eye practice with a short description, ordered steps, estimated duration (in seconds), and a fixed sequence index determining its rotation order.
- **Reminder Schedule**: The configured interval, current countdown state, enabled/disabled flag, snooze state, active-notification flag, and current exercise sequence index (persisted in `chrome.storage.local`). Opening the popup while active-notification is true resets state to idle and restarts the countdown.
- **User Settings**: Reminder interval, snooze duration, and enabled flag, all persisted in `chrome.storage.local` on the current device only.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time user receives their first reminder within the configured interval after installing the extension, without any additional setup.
- **SC-002**: All 6+ exercises are presented with instructions clear enough that a user can complete the exercise without searching externally.
- **SC-003**: Settings changes (interval, toggle) take effect within the current or next reminder cycle — no browser restart required.
- **SC-004**: The snooze feature correctly re-fires reminders within 30 seconds of the snooze expiry at least 95% of the time during a normal browser session.
- **SC-005**: Users report no noticeable browser slowdown or performance impact from the extension during an active work session.
- **SC-006**: All interactive elements in the extension popup are reachable and operable via keyboard (Tab to focus, Enter/Space to activate); body text uses a minimum font size of 14px; foreground-to-background colour contrast meets a minimum ratio of 4.5:1 for all text.

---

## Assumptions

- The extension targets Chrome (Manifest V3) on desktop; mobile Chrome is out of scope for v1.
- User settings are stored in `chrome.storage.local` (device-scoped); no Google account sign-in is required and no cross-device sync is provided.
- All eye exercise content is bundled with the extension; no external API or CMS is used.
- Reminders use the Chrome OS-level notification API (`chrome.notifications`); the extension requires the `notifications` permission declared in its manifest. If the user denies notification permission at the OS level, the popup displays a clear message indicating reminders are blocked and guides the user to re-enable them.
- The reminder timer restarts from the full interval each time the browser is launched (no cross-session persistence of mid-cycle timers).
- Reminder interval is free-form numeric input within the 15–90 minute range (default: 20 minutes).
- Snooze duration is free-form numeric input within the 2–15 minute range (default: 5 minutes); both are validated at input time.
- Visual design follows a simple, readable style consistent with KISS and modular principles; no complex animations or rich media in v1.
- Accessibility is limited to basic usability: keyboard navigation (Tab/Enter), minimum 14px font size, and a minimum colour contrast ratio of 4.5:1; WCAG 2.1 AA full compliance and screen-reader optimisation are out of scope.
