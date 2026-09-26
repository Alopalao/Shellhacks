// Short-lived "just changed" markers for live updates (e.g. "Updated by Dr. Reyes").
import { useEffect, useRef, useState } from 'react';

export interface LiveHighlight {
  label: string;
  /** Changes on every flash so components can re-run their entrance animation. */
  stamp: number;
}

export interface LiveHighlights {
  get: (id: string) => LiveHighlight | undefined;
  flash: (id: string, label: string) => void;
}

/** Tracks highlighted ids; each flash clears itself after `durationMs` (default 6 s). */
export function useLiveHighlights(durationMs = 6_000): LiveHighlights {
  const [map, setMap] = useState<Readonly<Record<string, LiveHighlight>>>({});
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((t) => clearTimeout(t));
      pending.clear();
    };
  }, []);

  const flash = (id: string, label: string) => {
    const existing = timers.current.get(id);
    if (existing) clearTimeout(existing);
    setMap((prev) => ({ ...prev, [id]: { label, stamp: Date.now() } }));
    timers.current.set(
      id,
      setTimeout(() => {
        timers.current.delete(id);
        setMap((prev) => {
          if (!(id in prev)) return prev;
          const { [id]: _removed, ...rest } = prev;
          return rest;
        });
      }, durationMs),
    );
  };

  return { get: (id) => map[id], flash };
}
