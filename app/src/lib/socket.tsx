// Realtime connection (Socket.IO) typed with the shared contracts.
// Connects while signed in; reconnects when the server URL or token changes.
import {
  createContext,
  use,
  useEffect,
  useEffectEvent,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuth } from './auth';
import type { ClientToServerEvents, Presence, ServerToClientEvents } from './contracts';
import { useServerUrl } from './server-url';

/** The typed client socket. `socket.emit('typing', { threadId, isTyping })` is fully typed. */
export type BrianSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

/**
 * - `idle`: signed out, no socket.
 * - `connecting`: first attempt in progress.
 * - `connected`: live.
 * - `reconnecting`: connection lost or failing; retrying automatically.
 * - `unauthorized`: the server rejected the token (the session is re-validated and usually signed out).
 */
export type SocketStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'unauthorized';

export type ServerEventName = keyof ServerToClientEvents;

// ───────────────────────── Presence store ─────────────────────────

class PresenceStore {
  // Immutable snapshot: replaced (never mutated) on every change, so React (and the React
  // Compiler's auto-memoization) can depend on its identity.
  private byId: ReadonlyMap<string, Presence> = new Map();
  private listeners = new Set<() => void>();
  private watchers = new Map<string, number>();

  get = (userId: string): Presence | undefined => this.byId.get(userId);

  /** Current presence snapshot; a new Map whenever anything changes. */
  snapshot = (): ReadonlyMap<string, Presence> => this.byId;

  set = (presence: Presence): void => {
    const prev = this.byId.get(presence.userId);
    if (prev && prev.online === presence.online && prev.lastSeen === presence.lastSeen) return;
    this.byId = new Map(this.byId).set(presence.userId, presence);
    this.listeners.forEach((l) => l());
  };

  setMany = (list: readonly Presence[]): void => {
    list.forEach(this.set);
  };

  clear = (): void => {
    if (this.byId.size === 0) return;
    this.byId = new Map();
    this.listeners.forEach((l) => l());
  };

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  /** Ref-counted interest in a user id; watched ids are re-queried on every (re)connect. */
  watch = (userId: string): (() => void) => {
    this.watchers.set(userId, (this.watchers.get(userId) ?? 0) + 1);
    return () => {
      const n = (this.watchers.get(userId) ?? 1) - 1;
      if (n <= 0) this.watchers.delete(userId);
      else this.watchers.set(userId, n);
    };
  };

  watchedIds = (): string[] => [...this.watchers.keys()];
}

const PRESENCE_QUERY_TIMEOUT_MS = 5_000;

function queryPresence(socket: BrianSocket, store: PresenceStore, userIds: readonly string[]) {
  const ids = [...new Set(userIds.filter(Boolean))];
  if (!ids.length || !socket.connected) return;
  socket.timeout(PRESENCE_QUERY_TIMEOUT_MS).emit('presence:query', ids, (err, list) => {
    if (!err && Array.isArray(list)) store.setMany(list);
  });
}

// ───────────────────────── Context ─────────────────────────

export interface SocketContextValue {
  /** The live socket while signed in (may be temporarily disconnected), else null. */
  socket: BrianSocket | null;
  /** True while the socket is connected. */
  connected: boolean;
  status: SocketStatus;
  /** Increments on every successful (re)connect — handy as an effect dependency to resync data. */
  connectCount: number;
  /** Last connection error message, if any. */
  lastError: string | null;
}

interface InternalContext extends SocketContextValue {
  presence: PresenceStore;
}

const SocketContext = createContext<InternalContext | null>(null);

interface ConnectionState {
  status: SocketStatus;
  connectCount: number;
  lastError: string | null;
}

/** Provides the realtime socket. Must be inside AuthProvider. */
export function SocketProvider({ children }: { children: ReactNode }) {
  const { status: authStatus, token, refreshUser } = useAuth();
  const { url, ready } = useServerUrl();
  const [presence] = useState(() => new PresenceStore());
  const [socket, setSocket] = useState<BrianSocket | null>(null);
  const [conn, setConn] = useState<ConnectionState>({ status: 'idle', connectCount: 0, lastError: null });

  const onUnauthorized = useEffectEvent(async (s: BrianSocket) => {
    const user = await refreshUser();
    // Token still valid (e.g. server restarted mid-handshake) → try again shortly.
    if (user && !s.connected) setTimeout(() => s.connect(), 3_000);
  });

  useEffect(() => {
    if (authStatus !== 'signed-in' || !token || !ready) {
      setSocket(null);
      setConn((c) => ({ ...c, status: 'idle', lastError: null }));
      presence.clear();
      return;
    }

    const s: BrianSocket = io(url, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 5_000,
      timeout: 10_000,
    });
    let disposed = false;
    setSocket(s);
    setConn((c) => ({ ...c, status: 'connecting', lastError: null }));

    s.on('connect', () => {
      setConn((c) => ({ status: 'connected', connectCount: c.connectCount + 1, lastError: null }));
      queryPresence(s, presence, presence.watchedIds());
    });
    s.on('disconnect', (reason) => {
      if (disposed) return;
      setConn((c) => ({ ...c, status: 'reconnecting' }));
      // The server closed the connection deliberately; socket.io won't retry on its own.
      if (reason === 'io server disconnect') setTimeout(() => !disposed && s.connect(), 1_000);
    });
    s.on('connect_error', (err) => {
      if (disposed) return;
      if (err.message === 'unauthorized') {
        setConn((c) => ({ ...c, status: 'unauthorized', lastError: err.message }));
        void onUnauthorized(s);
        return;
      }
      setConn((c) => ({
        ...c,
        status: c.status === 'connecting' && c.connectCount === 0 ? 'connecting' : 'reconnecting',
        lastError: err.message,
      }));
    });
    s.io.on('reconnect_attempt', () => {
      if (!disposed) setConn((c) => (c.status === 'connected' ? c : { ...c, status: 'reconnecting' }));
    });
    s.on('presence', (p) => presence.set(p));

    return () => {
      disposed = true;
      s.removeAllListeners();
      s.io.removeAllListeners();
      s.disconnect();
    };
  }, [authStatus, token, url, ready, presence]);

  const value = useMemo<InternalContext>(
    () => ({
      socket,
      connected: conn.status === 'connected',
      status: conn.status,
      connectCount: conn.connectCount,
      lastError: conn.lastError,
      presence,
    }),
    [socket, conn, presence],
  );

  return <SocketContext value={value}>{children}</SocketContext>;
}

function useSocketContext(): InternalContext {
  const ctx = use(SocketContext);
  if (!ctx) throw new Error('Socket hooks must be used inside <SocketProvider>');
  return ctx;
}

/** `{ socket, connected, status, connectCount, lastError }`. */
export function useSocket(): SocketContextValue {
  const { socket, connected, status, connectCount, lastError } = useSocketContext();
  return { socket, connected, status, connectCount, lastError };
}

/** Minimal untyped view used to register listeners for a generic event name. */
interface LooseEmitter {
  on(event: string, listener: (...args: unknown[]) => void): unknown;
  off(event: string, listener: (...args: unknown[]) => void): unknown;
}

/**
 * Subscribe to a server event for the lifetime of the component. The handler may change every
 * render (it's read through an effect event), so inline arrow functions are fine:
 *
 *   useSocketEvent('message:new', (m) => setMessages((prev) => [...prev, m]));
 */
export function useSocketEvent<E extends ServerEventName>(event: E, handler: ServerToClientEvents[E]): void {
  const { socket } = useSocketContext();
  const onEvent = useEffectEvent((...args: unknown[]) => {
    (handler as (...a: unknown[]) => void)(...args);
  });
  useEffect(() => {
    if (!socket) return;
    const emitter = socket as unknown as LooseEmitter;
    const listener = (...args: unknown[]) => onEvent(...args);
    emitter.on(event, listener);
    return () => {
      emitter.off(event, listener);
    };
  }, [socket, event]);
}

/**
 * Live online status for one user. Seeded with `presence:query` on mount/reconnect and kept up to
 * date by `presence` events. `fallback` (e.g. `dashboard.doctorOnline`) is used until the socket answers.
 */
export function usePresence(userId: string | null | undefined, fallback = false): boolean {
  const { socket, connected, presence } = useSocketContext();
  const online = useSyncExternalStore(
    presence.subscribe,
    () => (userId ? presence.get(userId)?.online : undefined),
    () => undefined,
  );
  useEffect(() => {
    if (!userId) return;
    return presence.watch(userId);
  }, [presence, userId]);
  useEffect(() => {
    if (socket && connected && userId) queryPresence(socket, presence, [userId]);
  }, [socket, connected, userId, presence]);
  return online ?? fallback;
}

/**
 * Live online status for many users (e.g. the doctor's patient list).
 * Returns `{ [userId]: boolean }`; ids the socket hasn't reported use `fallback[userId] ?? false`.
 */
export function usePresenceMap(
  userIds: readonly string[],
  fallback?: Readonly<Record<string, boolean>>,
): Record<string, boolean> {
  const { socket, connected, presence } = useSocketContext();
  const snapshot = useSyncExternalStore(presence.subscribe, presence.snapshot, presence.snapshot);
  const idsKey = [...new Set(userIds)].sort().join('|');
  useEffect(() => {
    const ids = idsKey ? idsKey.split('|') : [];
    const unwatch = ids.map((id) => presence.watch(id));
    return () => unwatch.forEach((u) => u());
  }, [presence, idsKey]);
  useEffect(() => {
    if (socket && connected && idsKey) queryPresence(socket, presence, idsKey.split('|'));
  }, [socket, connected, idsKey, presence]);
  return useMemo(() => {
    const out: Record<string, boolean> = {};
    for (const id of idsKey ? idsKey.split('|') : []) {
      out[id] = snapshot.get(id)?.online ?? fallback?.[id] ?? false;
    }
    return out;
  }, [snapshot, idsKey, fallback]);
}
