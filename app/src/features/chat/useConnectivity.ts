// Small hooks about the environment a chat runs in: app foreground state and a debounced
// "realtime connection is down" flag (so brief blips don't disable the composer).
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useSocket } from '@/lib/socket';

/** True while the app (or browser tab) is in the foreground. */
export function useAppActive(): boolean {
  const [active, setActive] = useState(() => AppState.currentState == null || AppState.currentState === 'active');
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => setActive(next === 'active'));
    return () => sub.remove();
  }, []);
  return active;
}

/**
 * True once the realtime connection has been down for `graceMs` (default 1.5 s).
 * Starts false so the first connect doesn't flash an offline state.
 */
export function useRealtimeOffline(graceMs = 1_500): boolean {
  const { status } = useSocket();
  const down = status === 'connecting' || status === 'reconnecting' || status === 'unauthorized';
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    if (!down) {
      setOffline(false);
      return;
    }
    const timer = setTimeout(() => setOffline(true), graceMs);
    return () => clearTimeout(timer);
  }, [down, graceMs]);
  return down && offline;
}
