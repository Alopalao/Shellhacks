// Socket.IO layer: token auth, per-user rooms, presence, typing relay, and the Realtime
// implementation REST handlers use to push events.
import { Server, type Socket } from 'socket.io';
import { z } from 'zod';
import { userForToken, parseBearer } from '../auth/sessions';
import type { Db, Realtime } from '../context';
import { areCounterparts, counterpartIds, findUser, resolveThreadAccess } from '../db/queries';
import type { ClientToServerEvents, Presence, ServerToClientEvents } from '../shared/contracts';
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
  /** Disconnect sockets whose session no longer exists (after logout / demo reset). */
  disconnectInvalidSessions(): void;
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
    const user = userForToken(db, token);
    if (!token || !user) {
      next(new Error('unauthorized'));
      return;
    }
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
    });
  });

  return {
    io,
    emitToUser,
    isOnline: (userId) => presence.isOnline(userId),
    presenceOf: (userId) => presence.get(userId),
    broadcastPresence,
    disconnectInvalidSessions: () => {
      for (const socket of io.sockets.sockets.values()) {
        if (!userForToken(db, socket.data.token)) socket.disconnect(true);
      }
    },
    close: async () => {
      await io.close();
    },
  };
}
