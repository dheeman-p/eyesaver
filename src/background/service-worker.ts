/**
 * EyeSaver service worker (Chrome MV3).
 *
 * Responsible for the full reminder lifecycle:
 *   - On install: seed defaults and schedule the first reminder alarm.
 *   - On main alarm: show the current exercise notification and pre-advance the index.
 *   - On Snooze button: pause the main alarm and schedule a snooze alarm.
 *   - On snooze alarm: re-fire the same exercise notification and restart the main alarm.
 *   - On user dismiss: reset the cycle (without re-advancing — alarm handler already did).
 *   - On settings change: react to enable toggle / interval changes via storage events.
 *
 * All cross-context state lives in `chrome.storage.local`.
 */

import {
  ALARM_NAME,
  DEFAULT_SETTINGS,
  DEFAULT_STATE,
  NOTIFICATION_ID,
  SNOOZE_ALARM_NAME,
  STORAGE_KEY_SETTINGS,
  STORAGE_KEY_STATE,
} from '@shared/constants';
import { EXERCISES } from '@shared/exercises';
import type { ReminderState, UserSettings } from '@shared/types';

// ---------- Storage helpers ----------

async function getSettings(): Promise<UserSettings> {
  const result = await chrome.storage.local.get(STORAGE_KEY_SETTINGS);
  return (result[STORAGE_KEY_SETTINGS] as UserSettings) ?? DEFAULT_SETTINGS;
}

async function getState(): Promise<ReminderState> {
  const result = await chrome.storage.local.get(STORAGE_KEY_STATE);
  return (result[STORAGE_KEY_STATE] as ReminderState) ?? DEFAULT_STATE;
}

async function setState(patch: Partial<ReminderState>): Promise<void> {
  const current = await getState();
  const next: ReminderState = { ...current, ...patch };
  await chrome.storage.local.set({ [STORAGE_KEY_STATE]: next });
}

// ---------- Notification helpers ----------

// Notification icon: fetch the bundled PNG once and cache it as a data URL.
// Chrome MV3 service workers can have trouble loading chrome-extension:// URLs
// directly as `iconUrl` (the SW may be torn down between fetch and render);
// a data URL is always safe and inlines the bytes.
let cachedIconDataUrl: string | null = null;

async function loadIconDataUrl(): Promise<string | null> {
  if (cachedIconDataUrl) return cachedIconDataUrl;
  try {
    const response = await fetch(chrome.runtime.getURL('icons/icon-128.png'));
    if (!response.ok) {
      console.error('[EyeSaver] icon fetch failed:', response.status);
      return null;
    }
    const blob = await response.blob();
    cachedIconDataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
    return cachedIconDataUrl;
  } catch (err) {
    console.error('[EyeSaver] icon load failed:', err);
    return null;
  }
}

async function showExerciseNotification(exerciseIndex: number): Promise<void> {
  const exercise = EXERCISES[exerciseIndex] ?? EXERCISES[0];
  const iconUrl = (await loadIconDataUrl()) ?? chrome.runtime.getURL('icons/icon-128.png');
  chrome.notifications.create(NOTIFICATION_ID, {
    type: 'basic',
    iconUrl,
    title: exercise.name,
    message: exercise.description,
    buttons: [{ title: 'Snooze' }],
    requireInteraction: false,
  }, (createdId) => {
    if (chrome.runtime.lastError) {
      console.error('[EyeSaver] notifications.create failed:', chrome.runtime.lastError.message);
    } else {
      console.log('[EyeSaver] notification shown:', createdId, exercise.name);
    }
  });
}

// ---------- T010: install / startup ----------

chrome.runtime.onInstalled.addListener(async () => {
  const existing = await chrome.storage.local.get([
    STORAGE_KEY_SETTINGS,
    STORAGE_KEY_STATE,
  ]);

  const settings: UserSettings =
    (existing[STORAGE_KEY_SETTINGS] as UserSettings) ?? DEFAULT_SETTINGS;
  const state: ReminderState =
    (existing[STORAGE_KEY_STATE] as ReminderState) ?? {
      ...DEFAULT_STATE,
      cycleStartedAt: Date.now(),
    };

  await chrome.storage.local.set({
    [STORAGE_KEY_SETTINGS]: settings,
    [STORAGE_KEY_STATE]: state,
  });

  if (settings.enabled) {
    await chrome.alarms.clear(ALARM_NAME);
    await chrome.alarms.create(ALARM_NAME, {
      delayInMinutes: settings.intervalMinutes,
    });
  }
});

// ---------- T011 + T014: alarm handlers ----------

chrome.alarms.onAlarm.addListener(async (alarm) => {
  console.log('[EyeSaver] alarm fired:', alarm.name, new Date().toISOString());
  if (alarm.name === ALARM_NAME) {
    // T011: main reminder fires.
    const [settings, state] = await Promise.all([getSettings(), getState()]);
    if (!settings.enabled) return;

    // Display the CURRENT index first, then pre-advance so the next fire
    // shows the next exercise (data-model state-transitions contract).
    const currentIndex = state.currentExerciseIndex;
    const nextIndex = (currentIndex + 1) % EXERCISES.length;

    await chrome.storage.local.set({
      [STORAGE_KEY_STATE]: {
        cycleStartedAt: Date.now(),
        currentExerciseIndex: nextIndex,
        activeNotificationId: NOTIFICATION_ID,
      } satisfies ReminderState,
    });

    showExerciseNotification(currentIndex);

    // Schedule the next reminder.
    await chrome.alarms.create(ALARM_NAME, {
      delayInMinutes: settings.intervalMinutes,
    });
    return;
  }

  if (alarm.name === SNOOZE_ALARM_NAME) {
    // T014: snooze elapsed — re-fire SAME exercise (do NOT advance again).
    const [settings, state] = await Promise.all([getSettings(), getState()]);
    if (!settings.enabled) return;

    // T011 already pre-advanced the stored index to N+1 before the snooze;
    // the exercise that was snoozed lives at (N+1 - 1) mod length = N.
    const total = EXERCISES.length;
    const snoozedIndex =
      (state.currentExerciseIndex - 1 + total) % total;

    await setState({ activeNotificationId: NOTIFICATION_ID });
    showExerciseNotification(snoozedIndex);

    // Restart the main interval timer from now.
    await chrome.alarms.create(ALARM_NAME, {
      delayInMinutes: settings.intervalMinutes,
    });
  }
});

// ---------- T012: snooze button ----------

chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
  if (notificationId !== NOTIFICATION_ID) return;
  if (buttonIndex !== 0) return;

  const settings = await getSettings();

  await chrome.alarms.clear(ALARM_NAME);
  await chrome.alarms.create(SNOOZE_ALARM_NAME, {
    delayInMinutes: settings.snoozeDurationMinutes,
  });
  await chrome.notifications.clear(NOTIFICATION_ID);
  await setState({ activeNotificationId: null });
});

// ---------- T013: user-dismiss handler ----------

chrome.notifications.onClosed.addListener(async (notificationId, byUser) => {
  if (notificationId !== NOTIFICATION_ID) return;
  if (!byUser) return;

  const settings = await getSettings();

  // Do NOT advance currentExerciseIndex — T011 already advanced N → N+1.
  await setState({
    activeNotificationId: null,
    cycleStartedAt: Date.now(),
  });

  await chrome.alarms.clear(ALARM_NAME);
  if (settings.enabled) {
    await chrome.alarms.create(ALARM_NAME, {
      delayInMinutes: settings.intervalMinutes,
    });
  }
});

// ---------- T024: react to settings changes from popup ----------

chrome.storage.onChanged.addListener(async (changes, areaName) => {
  if (areaName !== 'local') return;
  if (!(STORAGE_KEY_SETTINGS in changes)) return;

  const oldSettings = (changes[STORAGE_KEY_SETTINGS].oldValue as UserSettings | undefined) ?? DEFAULT_SETTINGS;
  const newSettings = changes[STORAGE_KEY_SETTINGS].newValue as UserSettings | undefined;
  if (!newSettings) return;

  // Enable toggled off → cancel everything.
  if (oldSettings.enabled && !newSettings.enabled) {
    await chrome.alarms.clearAll();
    await chrome.notifications.clear(NOTIFICATION_ID);
    await setState({ activeNotificationId: null });
    return;
  }

  // Enable toggled on → start the cycle fresh.
  if (!oldSettings.enabled && newSettings.enabled) {
    await chrome.alarms.clear(ALARM_NAME);
    await chrome.alarms.create(ALARM_NAME, {
      delayInMinutes: newSettings.intervalMinutes,
    });
    await setState({ cycleStartedAt: Date.now() });
    return;
  }

  // Interval changed while still enabled → reschedule.
  if (
    newSettings.enabled &&
    oldSettings.intervalMinutes !== newSettings.intervalMinutes
  ) {
    await chrome.alarms.clear(ALARM_NAME);
    await chrome.alarms.create(ALARM_NAME, {
      delayInMinutes: newSettings.intervalMinutes,
    });
    await setState({ cycleStartedAt: Date.now() });
  }
});
