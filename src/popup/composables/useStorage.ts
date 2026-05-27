import { ref, type Ref } from 'vue';

/**
 * Reactive bridge over `chrome.storage.local`.
 *
 * - Reads the key on init; resolves to `defaultValue` if absent.
 * - Subscribes to `chrome.storage.onChanged` so the ref stays in sync with
 *   writes from other contexts (e.g. the service worker).
 * - `set` writes through to `chrome.storage.local`; the onChanged handler
 *   then echoes the value back to the local ref.
 *
 * @returns `{ value, set, ready }` — `ready` resolves after the initial load.
 */
export function useStorage<T>(
  key: string,
  defaultValue: T,
): { value: Ref<T>; set: (v: T) => Promise<void>; ready: Promise<void> } {
  const value = ref(defaultValue) as Ref<T>;

  const ready = new Promise<void>((resolve) => {
    chrome.storage.local.get(key, (result) => {
      if (result && key in result && result[key] !== undefined) {
        value.value = result[key] as T;
      }
      resolve();
    });
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') return;
    if (key in changes) {
      const newValue = changes[key].newValue;
      if (newValue !== undefined) {
        value.value = newValue as T;
      }
    }
  });

  const set = async (newValue: T): Promise<void> => {
    value.value = newValue;
    await chrome.storage.local.set({ [key]: newValue });
  };

  return { value, set, ready };
}
