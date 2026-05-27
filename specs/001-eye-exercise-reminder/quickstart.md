# Quickstart: Eye Exercise Reminder Chrome Extension

**Feature**: `001-eye-exercise-reminder`
**Date**: 2026-05-27
**Stack**: Vue 3 + Pinia + TypeScript + SCSS + Vuetify 3 + Vite + vite-plugin-web-extension

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 20.x LTS | `node --version` to verify |
| npm | 10.x | Bundled with Node 20 |
| Chrome | 88+ | Manifest V3 support required |

---

## Project Initialisation

```bash
# 1. Navigate to the repo root
cd eyesaver

# 2. Install dependencies
npm install

# 3. Verify the build compiles
npm run build
```

---

## Dependency Overview

```json
{
  "dependencies": {
    "vue": "^3.5.0",
    "pinia": "^2.2.0",
    "vuetify": "^3.6.0",
    "@mdi/js": "^7.4.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "vite": "^5.2.0",
    "vite-plugin-web-extension": "^4.1.0",
    "sass": "^1.75.0",
    "@types/chrome": "^0.0.268"
  }
}
```

> **No test libraries are installed** — constitution Principle IV.

---

## Development

```bash
# Start Vite dev server (popup HMR enabled)
npm run dev
```

Then load the extension into Chrome:
1. Open `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `dist/` directory (created by `npm run dev` or `npm run build`)
5. The EyeSaver icon appears in the Chrome toolbar

**Reloading after changes**:
- Popup changes: Vite HMR reloads automatically — no manual reload needed
- Service worker changes: Click the refresh icon on the extension card in `chrome://extensions`

---

## Build for Production

```bash
npm run build
```

Output is in `dist/`. Load it as an unpacked extension in `chrome://extensions`. To publish, zip the `dist/` folder and upload to the Chrome Web Store.

---

## Project Structure Reference

```
src/
├── background/
│   └── service-worker.ts      # Alarms + notifications + snooze logic
├── popup/
│   ├── App.vue                # Root component (Vuetify VApp shell)
│   ├── main.ts                # Bootstrap: Vue + Pinia + Vuetify
│   ├── components/
│   │   ├── ExerciseCard.vue   # Exercise display (name, steps)
│   │   ├── CountdownTimer.vue # Next reminder countdown
│   │   └── SettingsPanel.vue  # Interval, snooze, enable toggle
│   ├── stores/
│   │   ├── exerciseStore.ts   # Exercise list + current index
│   │   ├── scheduleStore.ts   # Active-notification flag, countdown
│   │   └── settingsStore.ts   # UserSettings (persisted)
│   ├── composables/
│   │   └── useStorage.ts      # chrome.storage.local reactive bridge
│   └── styles/
│       ├── _variables.scss    # Design tokens
│       └── main.scss          # Global styles + Vuetify overrides
├── shared/
│   ├── types/index.ts         # Exercise, UserSettings, ReminderState, StorageSchema
│   ├── exercises/index.ts     # Bundled 6-exercise array
│   └── constants/index.ts     # Alarm names, notification ID, defaults
├── manifest.json              # Chrome MV3 manifest
└── vite.config.ts             # Multi-entry build config
```

---

## Manual QA Checklist (first-install)

1. Load the unpacked extension — toolbar icon appears
2. Click the icon — popup shows exercise #1 and "Your first reminder in X minutes"
3. Wait for the first alarm to fire (set interval to 1 min in dev mode for quick testing)
4. Verify OS notification appears with exercise name and Snooze button
5. Click Snooze — notification disappears; re-fires after snooze duration
6. Open popup while notification is active — notification clears, timer resets
7. Open Settings — change interval and snooze duration; verify countdown updates
8. Toggle the enable switch off — verify no further notifications fire
9. Toggle back on — verify reminders resume

> Alarms respect a 1-minute minimum in production Chrome. In developer mode, shorter intervals work for testing.
