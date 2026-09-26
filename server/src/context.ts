import type { RequestHandler, Response } from 'express';
import type { Config } from './config';
import type {
  AiConversation,
  ChatMessage,
  DoseLog,
  Prescription,
  RefillRequest,
  ServerToClientEvents,
  User,
  VisitNote,
} from './shared/contracts';

export interface Session {
  token: string;
  userId: string;
  createdAt: string;
}

/** Everything persisted to the JSON store. Mutate arrays in place, then call db.save(). */
export interface DbData {
  version: 1;
  users: User[];
  sessions: Session[];
  messages: ChatMessage[];
  prescriptions: Prescription[];
  doseLogs: DoseLog[];
  refillRequests: RefillRequest[];
  visitNotes: VisitNote[];
  aiConversations: AiConversation[];
}

export interface Db {
  data: DbData;
  /** Persist (debounced/atomic write is fine). */
  save(): void;
  /** Wipe and re-seed demo data. */
  reset(): void;
}

export interface Realtime {
  emitToUser<E extends keyof ServerToClientEvents>(
    userId: string,
    event: E,
    ...args: Parameters<ServerToClientEvents[E]>
  ): void;
  isOnline(userId: string): boolean;
}

export interface ServerContext {
  config: Config;
  db: Db;
  /** Express middleware: validates `Authorization: Bearer <token>`, sets res.locals.user, or responds 401. */
  requireAuth: RequestHandler;
  realtime: Realtime;
}

/** The authenticated user for a request that passed ctx.requireAuth. */
export function currentUser(res: Response): User {
  const user = res.locals.user as User | undefined;
  if (!user) throw new Error('currentUser() called on a route without requireAuth');
  return user;
}
