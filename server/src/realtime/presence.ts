import type { Presence } from '../shared/contracts';

/**
 * In-memory presence: a user is online while at least one of their sockets is connected
 * (a user may be signed in on several devices / tabs at once).
 */
export class PresenceTracker {
  private readonly sockets = new Map<string, Set<string>>();
  private readonly lastSeen = new Map<string, string>();

  /** Registers a socket. Returns true when this is the user's first live socket. */
  connect(userId: string, socketId: string): boolean {
    let set = this.sockets.get(userId);
    if (!set) {
      set = new Set();
      this.sockets.set(userId, set);
    }
    const wasOffline = set.size === 0;
    set.add(socketId);
    return wasOffline;
  }

  /** Unregisters a socket. Returns true when the user's last live socket went away. */
  disconnect(userId: string, socketId: string, at: Date = new Date()): boolean {
    const set = this.sockets.get(userId);
    if (!set || !set.delete(socketId)) return false;
    if (set.size > 0) return false;
    this.sockets.delete(userId);
    this.lastSeen.set(userId, at.toISOString());
    return true;
  }

  isOnline(userId: string): boolean {
    return (this.sockets.get(userId)?.size ?? 0) > 0;
  }

  /** Online users report "seen now"; offline users report when their last socket closed (or null). */
  get(userId: string, now: Date = new Date()): Presence {
    const online = this.isOnline(userId);
    return {
      userId,
      online,
      lastSeen: online ? now.toISOString() : (this.lastSeen.get(userId) ?? null),
    };
  }
}
