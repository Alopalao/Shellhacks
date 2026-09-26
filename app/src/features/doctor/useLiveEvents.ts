// Run a callback (debounced) whenever any of several socket events arrives — e.g. silently reload a
// summary list when patients log doses, send messages or request refills.
import { useEffect, useEffectEvent } from 'react';
import { useSocket, type ServerEventName } from '@/lib/socket';

/** Minimal untyped view used to attach one listener to many event names. */
interface LooseEmitter {
  on(event: string, listener: (...args: unknown[]) => void): unknown;
  off(event: string, listener: (...args: unknown[]) => void): unknown;
}

/**
 * Calls `onEvent` at most once per `delayMs` burst after any of `events` fires.
 * `events` may be an inline array literal (compared by value); `onEvent` may change every render.
 */
export function useLiveEvents(events: readonly ServerEventName[], onEvent: () => void, delayMs = 300): void {
  const { socket } = useSocket();
  const fire = useEffectEvent(onEvent);
  const key = [...new Set(events)].sort().join('|');

  useEffect(() => {
    if (!socket || !key) return;
    const names = key.split('|');
    const emitter = socket as unknown as LooseEmitter;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const listener = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        fire();
      }, delayMs);
    };
    names.forEach((name) => emitter.on(name, listener));
    return () => {
      if (timer) clearTimeout(timer);
      names.forEach((name) => emitter.off(name, listener));
    };
  }, [socket, key, delayMs]);
}
