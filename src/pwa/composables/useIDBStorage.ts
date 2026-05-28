const DB_NAME = 'eyesaver-pwa';
const DB_VERSION = 1;
const STORE_SETTINGS = 'settings';
const STORE_STATE = 'state';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(STORE_STATE)) {
        db.createObjectStore(STORE_STATE, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

export async function getItem<T>(
  store: 'settings' | 'state',
  key: string,
): Promise<T | undefined> {
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

export async function setItem<T>(
  store: 'settings' | 'state',
  key: string,
  value: T,
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).put({ key, value });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllItems<T>(
  store: 'settings' | 'state',
): Promise<Record<string, T>> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => {
      const records = req.result as { key: string; value: T }[];
      const result: Record<string, T> = {};
      for (const r of records) {
        result[r.key] = r.value;
      }
      resolve(result);
    };
    req.onerror = () => reject(req.error);
  });
}

export { openDB, STORE_SETTINGS, STORE_STATE, DB_NAME };
