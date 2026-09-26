// createServer(): boots a complete BRIAN instance (store → realtime → context → app →
// HTTP server → Socket.IO attach → listen). Used by index.ts and by the tests.
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import type { Express } from 'express';
import { createApp } from './app';
import { createRequireAuth } from './auth/middleware';
import { config as baseConfig, type Config } from './config';
import type { ServerContext } from './context';
import { openJsonDb, type JsonDb } from './db/store';
import { createRealtime, type BrianIo, type RealtimeServer } from './realtime';

export interface CreateServerOptions {
  /** JSON store path (default config.dataFile). Tests pass a temp file. */
  dataFile?: string;
  /** Port to listen on (default config.port). Use 0 for an ephemeral port. */
  port?: number;
  /** Interface to bind (default config.host). */
  host?: string;
  /** Any other config overrides (e.g. { anthropicApiKey: '', evidenceOffline: true }). */
  config?: Partial<Config>;
  /** Debounce window for store writes in ms (default 150). */
  saveDebounceMs?: number;
}

export interface BrianServer {
  app: Express;
  httpServer: http.Server;
  io: BrianIo;
  ctx: ServerContext;
  db: JsonDb;
  realtime: RealtimeServer;
  /** Base URL reachable from this machine, e.g. http://localhost:4000 */
  url: string;
  port: number;
  /** Disconnects sockets, stops listening, flushes the store. Idempotent. */
  close(): Promise<void>;
}

function listen(server: http.Server, port: number, host: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const onError = (err: Error): void => {
      server.off('listening', onListening);
      reject(err);
    };
    const onListening = (): void => {
      server.off('error', onError);
      resolve();
    };
    server.once('error', onError);
    server.once('listening', onListening);
    server.listen(port, host);
  });
}

/** A host string usable in a URL from this machine. */
function urlHost(host: string): string {
  if (host === '0.0.0.0' || host === '::' || host === '') return 'localhost';
  return host.includes(':') ? `[${host}]` : host;
}

export async function createServer(options: CreateServerOptions = {}): Promise<BrianServer> {
  const config: Config = {
    ...baseConfig,
    ...options.config,
    ...(options.dataFile !== undefined && { dataFile: options.dataFile }),
    ...(options.port !== undefined && { port: options.port }),
    ...(options.host !== undefined && { host: options.host }),
  };

  // 1. Data, realtime and context are fully built before any request can be served.
  const db = openJsonDb(config.dataFile, { debounceMs: options.saveDebounceMs });
  const realtime = createRealtime(db);
  const ctx: ServerContext = { config, db, requireAuth: createRequireAuth(db), realtime };
  const app = createApp(ctx);

  // 2. HTTP server with the app, then Socket.IO in front of it for /socket.io/ requests.
  const httpServer = http.createServer(app);
  realtime.io.attach(httpServer);

  try {
    await listen(httpServer, config.port, config.host);
  } catch (err) {
    await realtime.close().catch(() => undefined);
    await db.close();
    throw err;
  }

  const port = (httpServer.address() as AddressInfo).port;
  let closing: Promise<void> | null = null;
  const close = (): Promise<void> => {
    closing ??= (async () => {
      // Socket.IO closes the HTTP server too; drop lingering keep-alive connections so
      // shutdown never hangs on an idle browser tab.
      const stopped = realtime.close();
      httpServer.closeIdleConnections();
      const force = setTimeout(() => httpServer.closeAllConnections(), 1000);
      force.unref();
      await stopped;
      clearTimeout(force);
      await db.close();
    })();
    return closing;
  };

  return {
    app,
    httpServer,
    io: realtime.io,
    ctx,
    db,
    realtime,
    url: `http://${urlHost(config.host)}:${port}`,
    port,
    close,
  };
}
