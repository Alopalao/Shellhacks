// Small, typed JSON helpers on top of AsyncStorage (localStorage on web).
// Every helper swallows storage/parse failures so a corrupt value never crashes the app.
import AsyncStorage from '@react-native-async-storage/async-storage';

/** All AsyncStorage keys used by the app live under this prefix. */
export const STORAGE_PREFIX = 'brian.';

/** Keys owned by the foundation layer. Feature code should pick its own `brian.<feature>.*` keys. */
export const storageKeys = {
  session: `${STORAGE_PREFIX}session`,
  serverUrl: `${STORAGE_PREFIX}serverUrl`,
} as const;

/** Read and JSON-parse a value. Returns `fallback` when missing, unreadable or unparsable. */
export async function getJSON<T>(key: string, fallback: T): Promise<T>;
export async function getJSON<T>(key: string): Promise<T | null>;
export async function getJSON<T>(key: string, fallback: T | null = null): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** JSON-stringify and store a value. Resolves `false` if storage failed (never throws). */
export async function setJSON(key: string, value: unknown): Promise<boolean> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/** Read a raw string value (or null). */
export async function getString(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Store a raw string value. Resolves `false` if storage failed. */
export async function setString(key: string, value: string): Promise<boolean> {
  try {
    await AsyncStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

/** Remove a key. Never throws. */
export async function removeItem(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/**
 * Read-modify-write helper: `updateJSON('brian.lessons.progress', {}, (p) => ({ ...p, [id]: true }))`.
 * Returns the stored value.
 */
export async function updateJSON<T>(key: string, fallback: T, update: (current: T) => T): Promise<T> {
  const current = await getJSON<T>(key, fallback);
  const next = update(current);
  await setJSON(key, next);
  return next;
}
