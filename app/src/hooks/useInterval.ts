import { useEffect, useEffectEvent, useState } from 'react';

/** Calls `callback` every `delayMs`. Pass `null` to pause. The callback may change freely between renders. */
export function useInterval(callback: () => void, delayMs: number | null): void {
  const tick = useEffectEvent(callback);
  useEffect(() => {
    if (delayMs == null) return;
    const id = setInterval(() => tick(), delayMs);
    return () => clearInterval(id);
  }, [delayMs]);
}

/** Current time, re-rendering every `intervalMs` (default 30 s). Use for "5 min ago" labels and "next dose" logic. */
export function useNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date());
  useInterval(() => setNow(new Date()), intervalMs);
  return now;
}
