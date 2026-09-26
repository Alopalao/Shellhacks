// Shared test utilities: boot an isolated BRIAN server (temp data file, ephemeral port),
// sign in over HTTP, and connect typed Socket.IO clients that record every event.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { io, type Socket } from 'socket.io-client';
import request from 'supertest';
import { createServer, type BrianServer, type CreateServerOptions } from '../src/server';
import type {
  ClientToServerEvents,
  LoginRequest,
  LoginResponse,
  ServerToClientEvents,
  User,
} from '../src/shared/contracts';

export type ClientSocket = Socket<ServerToClientEvents, ClientToServerEvents>;
export type EventName = keyof ServerToClientEvents;
export type EventPayload<E extends EventName> = Parameters<ServerToClientEvents[E]>[0];

export interface TestServer extends BrianServer {
  dataDir: string;
  /** supertest agent bound to this server. */
  http: ReturnType<typeof request>;
  stop(): Promise<void>;
}

export async function startTestServer(options: CreateServerOptions = {}): Promise<TestServer> {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'brian-test-'));
  const server = await createServer({
    dataFile: path.join(dataDir, 'db.json'),
    port: 0,
    host: '127.0.0.1',
    saveDebounceMs: 10,
    ...options,
    config: { anthropicApiKey: '', evidenceOffline: true, ...options.config },
  });
  return {
    ...server,
    dataDir,
    http: request(server.url),
    stop: async () => {
      await server.close();
      fs.rmSync(dataDir, { recursive: true, force: true });
    },
  };
}

export interface Session {
  token: string;
  user: User;
  auth: { Authorization: string };
}

export async function login(
  server: TestServer,
  email: string,
  extra: Partial<Omit<LoginRequest, 'email'>> = {},
): Promise<Session> {
  const res = await server.http
    .post('/api/auth/login')
    .send({ email, password: 'lgtm', ...extra })
    .expect(200);
  const body = res.body as LoginResponse;
  return { token: body.token, user: body.user, auth: { Authorization: `Bearer ${body.token}` } };
}

let counter = 0;
/** A unique email for a throwaway account. */
export function uniqueEmail(label = 'user'): string {
  counter += 1;
  return `${label}.${process.pid}.${Date.now()}.${counter}@example.test`;
}

interface Recorded {
  event: string;
  args: unknown[];
}

/**
 * A connected client that records every server event, so assertions can't race the
 * emit: `await client.next('notify', n => n.kind === 'message')` also sees past events.
 */
export class RecordingClient {
  readonly socket: ClientSocket;
  private readonly events: Recorded[] = [];
  private readonly waiters = new Set<() => void>();

  constructor(socket: ClientSocket) {
    this.socket = socket;
    socket.onAny((event: string, ...args: unknown[]) => {
      this.events.push({ event, args });
      for (const wake of [...this.waiters]) wake();
    });
  }

  received<E extends EventName>(event: E, predicate?: (payload: EventPayload<E>) => boolean): EventPayload<E>[] {
    return this.events
      .filter((e) => e.event === event)
      .map((e) => e.args[0] as EventPayload<E>)
      .filter((payload) => !predicate || predicate(payload));
  }

  /** Resolves with the first (past or future) matching event payload. */
  next<E extends EventName>(
    event: E,
    predicate?: (payload: EventPayload<E>) => boolean,
    timeoutMs = 3000,
  ): Promise<EventPayload<E>> {
    return new Promise((resolve, reject) => {
      const check = (): boolean => {
        const [hit] = this.received(event, predicate);
        if (hit === undefined) return false;
        cleanup();
        resolve(hit);
        return true;
      };
      const timer = setTimeout(() => {
        cleanup();
        reject(new Error(`Timed out after ${timeoutMs}ms waiting for "${event}"`));
      }, timeoutMs);
      const cleanup = (): void => {
        clearTimeout(timer);
        this.waiters.delete(wake);
      };
      const wake = (): void => {
        check();
      };
      if (!check()) this.waiters.add(wake);
    });
  }

  clear(): void {
    this.events.length = 0;
  }

  close(): void {
    this.socket.disconnect();
  }
}

export function connectSocket(server: TestServer, token: string): Promise<RecordingClient> {
  const socket: ClientSocket = io(server.url, {
    auth: { token },
    transports: ['websocket'],
    forceNew: true,
    reconnection: false,
  });
  const client = new RecordingClient(socket);
  return new Promise((resolve, reject) => {
    socket.once('connect', () => resolve(client));
    socket.once('connect_error', (err) => {
      socket.disconnect();
      reject(err);
    });
  });
}

/** Wait for the server to process preceding socket traffic (one round trip). */
export function roundTrip(client: RecordingClient): Promise<void> {
  return new Promise((resolve) => {
    client.socket.emit('presence:query', [], () => resolve());
  });
}

export const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
