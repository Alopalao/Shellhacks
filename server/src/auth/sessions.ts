import { randomBytes } from 'node:crypto';
import type { Db, Session } from '../context';
import { findUser } from '../db/queries';
import type { User } from '../shared/contracts';

/** Keep at most this many sessions per user (oldest are dropped). */
const MAX_SESSIONS_PER_USER = 20;

/** 256-bit random, URL-safe bearer token. */
export function generateToken(): string {
  return randomBytes(32).toString('base64url');
}

export function createSession(db: Db, userId: string, now: Date = new Date()): Session {
  const session: Session = { token: generateToken(), userId, createdAt: now.toISOString() };
  const sessions = db.data.sessions;
  sessions.push(session);
  const mine = sessions.filter((s) => s.userId === userId);
  if (mine.length > MAX_SESSIONS_PER_USER) {
    const stale = new Set(mine.slice(0, mine.length - MAX_SESSIONS_PER_USER).map((s) => s.token));
    db.data.sessions = sessions.filter((s) => !stale.has(s.token));
  }
  db.save();
  return session;
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
