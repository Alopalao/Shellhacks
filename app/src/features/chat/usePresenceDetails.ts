// Online state plus "last seen" for one user. The foundation's usePresence() only exposes a boolean,
// so this also listens to `presence` events and asks `presence:query` for the lastSeen timestamp.
import { useEffect, useState } from 'react';
import type { Presence } from '@/lib/contracts';
import { usePresence, useSocket, useSocketEvent } from '@/lib/socket';

const QUERY_TIMEOUT_MS = 5_000;

export interface PresenceDetails {
  online: boolean;
  /** ISO time the user was last connected (null when unknown). */
  lastSeen: string | null;
}

/** Live `{ online, lastSeen }` for `userId`. `fallbackOnline` is used until the socket answers. */
export function usePresenceDetails(userId: string | null | undefined, fallbackOnline = false): PresenceDetails {
  const online = usePresence(userId, fallbackOnline);
  const { socket, connected, connectCount } = useSocket();
  const [seen, setSeen] = useState<{ userId: string; lastSeen: string | null } | null>(null);

  const record = (p: Presence) => {
    if (!userId || p.userId !== userId) return;
    // Online users report "now"; only keep a timestamp that describes when they left.
    setSeen({ userId, lastSeen: p.online ? null : (p.lastSeen ?? null) });
  };

  useSocketEvent('presence', (p) => record(p));

  useEffect(() => {
    if (!socket || !connected || !userId) return;
    let cancelled = false;
    socket.timeout(QUERY_TIMEOUT_MS).emit('presence:query', [userId], (err, list) => {
      if (cancelled || err || !Array.isArray(list)) return;
      const p = list.find((item) => item.userId === userId);
      if (p) setSeen({ userId, lastSeen: p.online ? null : (p.lastSeen ?? null) });
    });
    return () => {
      cancelled = true;
    };
  }, [socket, connected, connectCount, userId]);

  const lastSeen = seen && seen.userId === userId ? seen.lastSeen : null;
  return { online, lastSeen: online ? null : lastSeen };
}
