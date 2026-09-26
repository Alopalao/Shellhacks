import { randomBytes } from 'node:crypto';
import type { Db, Session } from '../context';
import { findUser } from '../db/queries';
import type { User } from '../shared/contracts';

/** Keep at most this many sessions per user; idle, least recently used ones are dropped first. */
const MAX_SESSIONS_PER_USER = 20;
/** `lastUsedAt` is refreshed at most this often, so busy clients don't rewrite the store per request. */
const TOUCH_INTERVAL_MS = 60_000;

const lastUsed = (session: Session): string => session.lastUsedAt ?? session.createdAt;

/** 256-bit random, URL-safe bearer token. */
export function generateToken(): string {
  return randomBytes(32).toString('base64url');
}

export interface CreateSessionOptions {
  now?: Date;
  /** True when a token has a connected socket (an open app); those are evicted last. */
  isLive?: (token: string) => boolean;
}

export interface CreatedSession {
  session: Session;
  /**
   * Tokens signed out to stay under the per-user cap. Callers should drop their sockets
   * (`realtime.disconnectInvalidSessions()`) so those devices stop receiving live events.
   */
  evicted: string[];
}

export function createSession(db: Db, userId: string, options: CreateSessionOptions = {}): CreatedSession {
  const { now = new Date(), isLive = () => false } = options;
  const session: Session = { token: generateToken(), userId, createdAt: now.toISOString() };
  const others = db.data.sessions.filter((s) => s.userId === userId);
  const excess = others.length + 1 - MAX_SESSIONS_PER_USER;
  let evicted: string[] = [];
  if (excess > 0) {
    // Idle devices before open ones, then least recently used first. Never the new session.
    evicted = others
      .map((s) => ({ token: s.token, live: isLive(s.token), usedAt: lastUsed(s) }))
      .sort((a, b) => Number(a.live) - Number(b.live) || (a.usedAt < b.usedAt ? -1 : a.usedAt > b.usedAt ? 1 : 0))
      .slice(0, excess)
      .map((s) => s.token);
    const stale = new Set(evicted);
    db.data.sessions = db.data.sessions.filter((s) => !stale.has(s.token));
  }
  db.data.sessions.push(session);
  db.save();
  return { session, evicted };
}

/** Records that a session was just used (at most one store write per TOUCH_INTERVAL_MS). */
export function touchSession(db: Db, session: Session, now: Date = new Date()): void {
  const last = Date.parse(lastUsed(session));
  if (Number.isFinite(last) && now.getTime() - last < TOUCH_INTERVAL_MS) return;
  session.lastUsedAt = now.toISOString();
  db.save();
}

export function findSession(db: Db, token: string): Session | undefined {
  if (!token) return undefined;
  return db.data.sessions.find((s) => s.token === token);
}

/** The user a token belongs to, or undefined for unknown tokens / deleted users. */
export function userForToken(db: Db, token: string | null | undefined): User | undefined {
  if (!token) return undefined;
  const session = findSession(db, token);
  return session ? findUser(db.data, session.userId) : undefined;
}

export function revokeSession(db: Db, token: string): boolean {
  const before = db.data.sessions.length;
  db.data.sessions = db.data.sessions.filter((s) => s.token !== token);
  const removed = db.data.sessions.length !== before;
  if (removed) db.save();
  return removed;
}

/** Extracts the token from an `Authorization: Bearer <token>` header value. */
export function parseBearer(header: string | undefined): string | null {
  if (!header) return null;
  const match = /^Bearer\s+(\S+)\s*$/i.exec(header);
  return match?.[1] ?? null;
}
