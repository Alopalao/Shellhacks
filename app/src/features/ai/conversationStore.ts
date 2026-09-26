// The "current" AI conversation per signed-in user, persisted in AsyncStorage so returning to the
// AI tab (or reloading the web app) restores the chat. The history screen writes here to open or
// reset a conversation; the chat screen reacts to changes.
import { useEffect, useSyncExternalStore } from 'react';
import { getString, removeItem, setString } from '@/lib/storage';
import { conversationStorageKey } from './config';

/** userId → conversation id (null = new chat). Missing key = not loaded from storage yet. */
const current = new Map<string, string | null>();
const loading = new Map<string, Promise<string | null>>();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Load the saved id for `userId` (once). Resolves the current value. */
export function loadCurrentConversationId(userId: string): Promise<string | null> {
  if (current.has(userId)) return Promise.resolve(current.get(userId) ?? null);
  const inflight = loading.get(userId);
  if (inflight) return inflight;
  const promise = getString(conversationStorageKey(userId)).then((saved) => {
    loading.delete(userId);
    // A set() that happened while we were reading wins over the stored value.
    if (!current.has(userId)) {
      current.set(userId, saved || null);
      emit();
    }
    return current.get(userId) ?? null;
  });
  loading.set(userId, promise);
  return promise;
}

/** Synchronous read: undefined until loaded. */
export function getCurrentConversationId(userId: string): string | null | undefined {
  return current.has(userId) ? (current.get(userId) ?? null) : undefined;
}

/** Make `id` the current conversation for `userId` (null = start a new chat). Persists in the background. */
export function setCurrentConversationId(userId: string, id: string | null): void {
  if (current.get(userId) === id && current.has(userId)) return;
  current.set(userId, id);
  emit();
  const key = conversationStorageKey(userId);
  void (id ? setString(key, id) : removeItem(key));
}

/**
 * Subscribe to the current conversation id. `ready` is false until the saved value has been read.
 * Returns `{ ready: false, id: null }` when there is no user.
 */
export function useCurrentConversationId(userId: string | null | undefined): { ready: boolean; id: string | null } {
  const snapshot = useSyncExternalStore(
    subscribe,
    () => (userId ? getCurrentConversationId(userId) : undefined),
    () => (userId ? getCurrentConversationId(userId) : undefined),
  );
  useEffect(() => {
    if (userId) void loadCurrentConversationId(userId);
  }, [userId]);
  return { ready: snapshot !== undefined, id: snapshot ?? null };
}
