// JSON-file store. The whole dataset lives in memory; mutations call save(), which
// schedules a debounced, atomic write (temp file + rename) so a crash mid-write can never
// leave a truncated db.json behind. Pending writes are flushed synchronously on exit.
import fs from 'node:fs';
import path from 'node:path';
import type { Db, DbData } from '../context';
import { createSeedData } from './seed';

export interface JsonDbOptions {
  /** Debounce window for save() in ms (default 150). */
  debounceMs?: number;
  /** Clock used when seeding (tests may pin it). */
  now?: () => Date;
  /** Where warnings go (default console). */
  logger?: Pick<Console, 'warn' | 'error'>;
}

const COLLECTIONS = [
  'users',
  'sessions',
  'messages',
  'prescriptions',
  'doseLogs',
  'refillRequests',
  'visitNotes',
  'aiConversations',
] as const satisfies ReadonlyArray<keyof DbData>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Shallow shape check of a parsed file. Returns null when the file is not a BRIAN v1 store.
 * Missing collections (older files) are filled in with empty arrays.
 */
function normalize(raw: unknown): DbData | null {
  if (!isRecord(raw) || raw.version !== 1 || !Array.isArray(raw.users)) return null;
  const data: Record<string, unknown> = { version: 1 };
  for (const key of COLLECTIONS) {
    const value = raw[key];
    if (value === undefined) data[key] = [];
    else if (Array.isArray(value)) data[key] = value;
    else return null;
  }
  return data as unknown as DbData;
}

export class JsonDb implements Db {
  readonly file: string;
  data: DbData;
  /** True when this instance created the data from the seed (missing or corrupt file). */
  readonly seeded: boolean;

  private readonly debounceMs: number;
  private readonly now: () => Date;
  private readonly logger: Pick<Console, 'warn' | 'error'>;
  private dirty = false;
  private timer: NodeJS.Timeout | null = null;
  private writeChain: Promise<void> = Promise.resolve();
  private tmpCounter = 0;
  private closed = false;
  private readonly onExit = (): void => this.flushSync();

  constructor(file: string, options: JsonDbOptions = {}) {
    this.file = path.resolve(file);
    this.debounceMs = options.debounceMs ?? 150;
    this.now = options.now ?? (() => new Date());
    this.logger = options.logger ?? console;

    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    const loaded = this.load();
    this.seeded = loaded === null;
    this.data = loaded ?? createSeedData(this.now());
    if (this.seeded) {
      this.dirty = true;
      this.flushSync();
    }
    process.on('exit', this.onExit);
  }

  /** Mark the data dirty and schedule a debounced write. */
  save(): void {
    if (this.closed) {
      // After close() (e.g. a request that raced shutdown) write straight through.
      this.dirty = true;
      this.flushSync();
      return;
    }
    this.dirty = true;
    if (this.timer) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.enqueueWrite();
    }, this.debounceMs);
    // Never keep the process alive just for a pending write; the exit hook flushes it.
    this.timer.unref();
  }

  /**
   * Wipe and re-seed demo data. The `data` object identity is preserved (collections are
   * swapped in place) so anything holding `db.data` keeps seeing live data. Sessions of
   * users that still exist after the re-seed (the demo accounts have stable ids) survive,
   * so signed-in demo devices stay signed in.
   */
  reset(): void {
    const fresh = createSeedData(this.now());
    const survivingUsers = new Set(fresh.users.map((u) => u.id));
    fresh.sessions = this.data.sessions.filter((s) => survivingUsers.has(s.userId));
    Object.assign(this.data, fresh);
    this.save();
  }

  /** Write any pending changes now (async, serialized with other writes). */
  async flush(): Promise<void> {
    this.clearTimer();
    await this.enqueueWrite();
  }

  /** Write any pending changes synchronously (used on process exit). */
  flushSync(): void {
    this.clearTimer();
    if (!this.dirty) return;
    try {
      const json = this.serialize();
      const tmp = this.tmpPath();
      fs.writeFileSync(tmp, json);
      fs.renameSync(tmp, this.file);
    } catch (err) {
      this.logger.error(`[db] Failed to write ${this.file}:`, err);
    }
  }

  /** Flush pending writes and detach from the process. Safe to call more than once. */
  async close(): Promise<void> {
    if (this.closed) return;
    this.closed = true;
    await this.flush();
    process.off('exit', this.onExit);
  }

  private clearTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private enqueueWrite(): Promise<void> {
    this.writeChain = this.writeChain.then(() => this.writeOnce());
    return this.writeChain;
  }

  private async writeOnce(): Promise<void> {
    if (!this.dirty) return;
    const json = this.serialize();
    const tmp = this.tmpPath();
    try {
      await fs.promises.writeFile(tmp, json);
      await fs.promises.rename(tmp, this.file);
    } catch (err) {
      // Keep the data dirty so the next save/flush retries.
      this.dirty = true;
      this.logger.error(`[db] Failed to write ${this.file}:`, err);
      await fs.promises.rm(tmp, { force: true }).catch(() => undefined);
    }
  }

  /** Snapshot the data and clear the dirty flag (changes after this re-dirty it). */
  private serialize(): string {
    this.dirty = false;
    return JSON.stringify(this.data, null, 2);
  }

  private tmpPath(): string {
    this.tmpCounter += 1;
    return `${this.file}.${process.pid}.${this.tmpCounter}.tmp`;
  }

  /** Returns the stored data, or null when the file is missing or unusable (after backing it up). */
  private load(): DbData | null {
    let text: string;
    try {
      text = fs.readFileSync(this.file, 'utf8');
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw err;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = undefined;
    }
    const data = normalize(parsed);
    if (data) return data;

    const backup = `${this.file}.corrupt-${this.now().toISOString().replace(/[:.]/g, '-')}`;
    try {
      fs.renameSync(this.file, backup);
      this.logger.warn(`[db] ${this.file} was unreadable — moved it to ${backup} and re-seeded demo data.`);
    } catch {
      this.logger.warn(`[db] ${this.file} was unreadable — re-seeding demo data.`);
    }
    return null;
  }
}

export function openJsonDb(file: string, options?: JsonDbOptions): JsonDb {
  return new JsonDb(file, options);
}
