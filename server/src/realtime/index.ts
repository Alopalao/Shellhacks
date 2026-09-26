// Socket.IO layer: token auth, per-user rooms, presence, typing relay, and the Realtime
// implementation REST handlers use to push events.
import { Server, type Socket } from 'socket.io';
import { z } from 'zod';
import { findSession, parseBearer, touchSession, userForToken } from '../auth/sessions';
import type { Db, Realtime } from '../context';
import { areCounterparts, counterpartIds, findUser, resolveThreadAccess } from '../db/queries';
import type { ClientToServerEvents, LiveNotification, Presence, ServerToClientEvents } from '../shared/contracts';
import { PresenceTracker } from './presence';

export interface SocketData {
  userId: string;
  token: string;
}

type InterServerEvents = Record<string, never>;
export type BrianIo = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type BrianSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

/** The full realtime service. `ctx.realtime` exposes the narrower `Realtime` interface. */
export interface RealtimeServer extends Realtime {
  readonly io: BrianIo;
  presenceOf(userId: string): Presence;
  /** Push a user's presence to their counterparts (e.g. after a doctor change). */
  broadcastPresence(userId: string): void;
  /** True while some socket is connected with this session token. */
  hasLiveSocket(token: string): boolean;
  /** Disconnect sockets whose session no longer exists (after logout / session eviction). */
  disconnectInvalidSessions(): void;
  /**
   * Make every client resync after the data changed underneath it (demo reset). Each socket
   * whose session survived gets `notice` (skipping `quietToken`, the device that asked, which
   * confirms on its own), then every socket is disconnected. The app reconnects after an
   * "io server disconnect" and refetches its screens on reconnect; sockets whose session is
   * gone fail the handshake and sign out.
   */
  resyncAll(notice: LiveNotification, quietToken?: string): void;
  close(): Promise<void>;
}

/** Narrow a `ctx.realtime` to the full service when available (it always is at runtime). */
export function isRealtimeServer(realtime: Realtime): realtime is RealtimeServer {
  return typeof (realtime as Partial<RealtimeServer>).disconnectInvalidSessions === 'function';
}

export const userRoom = (userId: string): string => `user:${userId}`;

const typingSchema = z.object({ threadId: z.string().min(1).max(200), isTyping: z.boolean() });
const presenceQuerySchema = z.array(z.string().min(1).max(100)).max(500);

function handshakeToken(socket: BrianSocket): string | null {
  const auth: unknown = socket.handshake.auth;
  if (typeof auth === 'object' && auth !== null) {
    const token = (auth as { token?: unknown }).token;
    if (typeof token === 'string' && token.trim()) return token.trim();
  }
  // Fallback for non-browser clients that can send headers.
  const header = socket.handshake.headers.authorization;
  return parseBearer(typeof header === 'string' ? header : undefined);
}

export interface CreateRealtimeOptions {
  /** Engine.IO heartbeat; lower values detect vanished devices (offline presence) faster. */
  pingIntervalMs?: number;
  pingTimeoutMs?: number;
}

/**
 * Creates the Socket.IO server (not yet attached to an HTTP server — call
 * `realtime.io.attach(httpServer)` once the Express app is mounted on it).
 */
export function createRealtime(db: Db, options: CreateRealtimeOptions = {}): RealtimeServer {
  const io: BrianIo = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>({
    cors: { origin: '*' },
    serveClient: false,
    pingInterval: options.pingIntervalMs ?? 10_000,
    pingTimeout: options.pingTimeoutMs ?? 8_000,
  });
  const presence = new PresenceTracker();

  const emitToUser: Realtime['emitToUser'] = (userId, event, ...args) => {
    io.to(userRoom(userId)).emit(event, ...args);
  };

  const broadcastPresence = (userId: string): void => {
    const user = findUser(db.data, userId);
    if (!user) return;
    const payload = presence.get(userId);
    for (const id of counterpartIds(db.data, user)) emitToUser(id, 'presence', payload);
  };

  /** Presence of others is visible to yourself, your counterparts, and (for doctors) everyone. */
  const canSeePresence = (viewerId: string, targetId: string): boolean => {
    if (viewerId === targetId) return true;
    const viewer = findUser(db.data, viewerId);
    const target = findUser(db.data, targetId);
    if (!viewer || !target) return false;
    return target.role === 'doctor' || areCounterparts(db.data, viewer, target);
  };

  io.use((socket, next) => {
    const token = handshakeToken(socket);
    const session = token ? findSession(db, token) : undefined;
    const user = session && findUser(db.data, session.userId);
    if (!token || !session || !user) {
      next(new Error('unauthorized'));
      return;
    }
    touchSession(db, session);
    socket.data.userId = user.id;
    socket.data.token = token;
    next();
  });

  io.on('connection', (socket) => {
    const { userId } = socket.data;
    void socket.join(userRoom(userId));
    if (presence.connect(userId, socket.id)) broadcastPresence(userId);

    socket.on('typing', (payload) => {
      const parsed = typingSchema.safeParse(payload);
      if (!parsed.success) return;
      const access = resolveThreadAccess(db.data, userId, parsed.data.threadId);
      if (!access.ok) return;
      emitToUser(access.other.id, 'typing', {
        threadId: access.threadId,
        userId,
        isTyping: parsed.data.isTyping,
      });
    });

    socket.on('presence:query', (userIds, ack) => {
      if (typeof ack !== 'function') return;
      const parsed = presenceQuerySchema.safeParse(userIds);
      if (!parsed.success) {
        ack([]);
        return;
      }
      const unique = [...new Set(parsed.data)];
      ack(unique.filter((id) => canSeePresence(userId, id)).map((id) => presence.get(id)));
    });

    socket.on('disconnect', () => {
      if (presence.disconnect(userId, socket.id)) broadcastPresence(userId);
      // The app was in use until now; keeps this device from being first in line for eviction.
      const session = findSession(db, socket.data.token);
      if (session) touchSession(db, session);
    });
  });

  return {
    io,
    emitToUser,
    isOnline: (userId) => presence.isOnline(userId),
    presenceOf: (userId) => presence.get(userId),
    broadcastPresence,
    hasLiveSocket: (token) => {
      for (const socket of io.sockets.sockets.values()) if (socket.data.token === token) return true;
      return false;
    },
    disconnectInvalidSessions: () => {
      for (const socket of io.sockets.sockets.values()) {
        if (!userForToken(db, socket.data.token)) socket.disconnect(true);
      }
    },
    resyncAll: (notice, quietToken) => {
      for (const socket of io.sockets.sockets.values()) {
        const signedIn = !!userForToken(db, socket.data.token);
        if (signedIn && socket.data.token !== quietToken) socket.emit('notify', notice);
        socket.disconnect(!signedIn);
      }
    },
    close: async () => {
      await io.close();
    },
  };
}
