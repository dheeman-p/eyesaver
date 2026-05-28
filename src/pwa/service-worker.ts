/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { EXERCISES } from '@shared/exercises';

// Precache all built assets injected by vite-plugin-pwa (injectManifest)
precacheAndRoute(self.__WB_MANIFEST);

// Remove old precache entries from previous versions
cleanupOutdatedCaches();

// --- IndexedDB helpers (duplicated from composable since SW can't import Vue modules) ---

const DB_NAME = 'eyesaver-pwa';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('state')) {
        db.createObjectStore('state', { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbGet<T>(store: string, key: string): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => {
      const record = req.result as { key: string; value: T } | undefined;
      resolve(record?.value);
    };
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(store: string, key: string, value: unknown): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).put({ key, value });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// --- Notification helper (T019) ---

function showReminder(exerciseIndex: number): Promise<void> {
  const exercise = EXERCISES[exerciseIndex % EXERCISES.length];
  return self.registration.showNotification(exercise.name, {
    body: exercise.steps[0],
    icon: '/icons/icon-192.png',
    actions: [
      { action: 'snooze', title: 'Snooze' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
    data: { exerciseIndex },
  });
}

// --- Read contract: check state and fire if overdue (T017, T018) ---

async function checkAndFire(): Promise<void> {
  const enabled = await idbGet<boolean>('settings', 'enabled');
  if (enabled === false) return;

  const intervalMinutes = (await idbGet<number>('settings', 'intervalMinutes')) ?? 20;
  const intervalMs = intervalMinutes * 60_000;

  const snoozedUntil = await idbGet<number | null>('state', 'snoozedUntil');
  const nextFireAt = await idbGet<number | null>('state', 'nextFireAt');
  const currentExerciseIndex = (await idbGet<number>('state', 'currentExerciseIndex')) ?? 0;

  // Snooze active and not elapsed — do nothing
  if (snoozedUntil && snoozedUntil > Date.now()) return;

  // Snooze elapsed — fire and reset (T028)
  if (snoozedUntil && snoozedUntil <= Date.now()) {
    await showReminder(currentExerciseIndex);
    const newIndex = (currentExerciseIndex + 1) % EXERCISES.length;
    await idbPut('state', 'currentExerciseIndex', newIndex);
    await idbPut('state', 'nextFireAt', Date.now() + intervalMs);
    await idbPut('state', 'notificationActive', true);
    await idbPut('state', 'snoozedUntil', null);
    return;
  }

  // Overdue — fire notification
  if (nextFireAt !== null && nextFireAt !== undefined && nextFireAt <= Date.now()) {
    await showReminder(currentExerciseIndex);
    const newIndex = (currentExerciseIndex + 1) % EXERCISES.length;
    await idbPut('state', 'currentExerciseIndex', newIndex);
    await idbPut('state', 'nextFireAt', Date.now() + intervalMs);
    await idbPut('state', 'notificationActive', true);
    await idbPut('state', 'snoozedUntil', null);
    return;
  }

  // Not yet scheduled — initialize
  if (nextFireAt === null || nextFireAt === undefined) {
    await idbPut('state', 'nextFireAt', Date.now() + intervalMs);
    return;
  }
}

// --- Event handlers ---

// Install handler — skip waiting so updates take effect immediately
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    event.waitUntil(self.skipWaiting());
  }
});

// T017: Periodic Background Sync handler
self.addEventListener('periodicsync', (event: any) => {
  if (event.tag === 'eyesaver-reminder') {
    event.waitUntil(checkAndFire());
  }
});

// T018: Activate handler — claim clients and clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Clean up old workbox precache entries
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => name.startsWith('workbox-precache-') === false && name !== 'workbox-precache-v2')
          .filter((name) => !name.includes(self.registration.scope))
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
      await checkAndFire();
    })(),
  );
});

// T027: Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    (async () => {
      const action = event.action;
      const exerciseIndex = event.notification.data?.exerciseIndex ?? 0;

      if (action === 'snooze') {
        // Write snooze state
        const snoozeDurationMinutes =
          (await idbGet<number>('settings', 'snoozeDurationMinutes')) ?? 5;
        await idbPut('state', 'snoozedUntil', Date.now() + snoozeDurationMinutes * 60_000);
        await idbPut('state', 'notificationActive', false);
      } else if (action === 'dismiss') {
        // Reset timer to full interval
        const intervalMinutes =
          (await idbGet<number>('settings', 'intervalMinutes')) ?? 20;
        await idbPut('state', 'nextFireAt', Date.now() + intervalMinutes * 60_000);
        await idbPut('state', 'notificationActive', false);
        await idbPut('state', 'snoozedUntil', null);
      } else {
        // Default click — open/focus PWA (H1 fix — FR-008)
        const urlToOpen = new URL(
          `/?exercise=${exerciseIndex}`,
          self.location.origin,
        ).href;
        const allClients = await self.clients.matchAll({
          type: 'window',
          includeUncontrolled: true,
        });
        for (const client of allClients) {
          if (client.url.startsWith(self.location.origin) && 'focus' in client) {
            await (client as WindowClient).focus();
            await (client as WindowClient).navigate(urlToOpen);
            return;
          }
        }
        await self.clients.openWindow(urlToOpen);
      }
    })(),
  );
});
