// Shared outbound HTTP for evidence sources: per-request timeout, in-memory TTL cache,
// in-flight de-duplication and a simple spacing rate limiter (NCBI politeness).

export const USER_AGENT = 'BRIAN-demo/1.0';
export const DEFAULT_TIMEOUT_MS = 6_000;
const DEFAULT_TTL_MS = 6 * 60 * 60 * 1000; // evidence changes slowly; 6 h is plenty for a demo

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export class EvidenceError extends Error {
  readonly status: number | null;
  readonly url: string;

  constructor(message: string, url: string, status: number | null = null) {
    super(message);
    this.name = 'EvidenceError';
    this.status = status;
    this.url = url;
  }
}

/** Small LRU-ish cache with per-entry expiry. */
export class TtlCache<V> {
  private readonly entries = new Map<string, { value: V; expires: number }>();

  constructor(
    private readonly maxEntries = 500,
    private readonly now: () => number = Date.now,
  ) {}

  get(key: string): V | undefined {
    const hit = this.entries.get(key);
    if (!hit) return undefined;
    if (hit.expires <= this.now()) {
      this.entries.delete(key);
      return undefined;
    }
    // refresh recency
    this.entries.delete(key);
    this.entries.set(key, hit);
    return hit.value;
  }

  set(key: string, value: V, ttlMs: number): void {
    if (this.entries.has(key)) this.entries.delete(key);
    this.entries.set(key, { value, expires: this.now() + ttlMs });
    while (this.entries.size > this.maxEntries) {
      const oldest = this.entries.keys().next().value;
      if (oldest === undefined) break;
      this.entries.delete(oldest);
    }
  }

  get size(): number {
    return this.entries.size;
  }

  clear(): void {
    this.entries.clear();
  }
}

/** Spaces request *starts* at least `minIntervalMs` apart (e.g. ≤3 req/s for NCBI without a key). */
export class RateLimiter {
  private nextSlot = 0;

  constructor(
    private readonly minIntervalMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  async schedule<T>(task: () => Promise<T>): Promise<T> {
    const current = this.now();
    const slot = Math.max(current, this.nextSlot);
    this.nextSlot = slot + this.minIntervalMs;
    const wait = slot - current;
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    return task();
  }
}

export interface HttpResponse {
  status: number;
  text: string;
}

export interface RequestOptions {
  limiter?: RateLimiter;
  /** Cache successful (2xx) and "not found" (404) responses for this long. */
  ttlMs?: number;
  accept?: string;
}

export interface HttpClientOptions {
  fetch?: FetchLike;
  timeoutMs?: number;
  cache?: TtlCache<HttpResponse>;
}

export class HttpClient {
  private readonly fetchImpl: FetchLike;
  private readonly timeoutMs: number;
  private readonly cache: TtlCache<HttpResponse>;
  private readonly inFlight = new Map<string, Promise<HttpResponse>>();

  constructor(options: HttpClientOptions = {}) {
    this.fetchImpl = options.fetch ?? ((input, init) => fetch(input, init));
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.cache = options.cache ?? new TtlCache<HttpResponse>();
  }

  /** GET `url`. Resolves for 2xx and 404 (callers treat 404 as "no results"); rejects otherwise. */
  async get(url: string, options: RequestOptions = {}): Promise<HttpResponse> {
    const cached = this.cache.get(url);
    if (cached) return cached;
    const pending = this.inFlight.get(url);
    if (pending) return pending;

    const run = async (): Promise<HttpResponse> => {
      let response: Response;
      try {
        response = await this.fetchImpl(url, {
          headers: { 'User-Agent': USER_AGENT, Accept: options.accept ?? 'application/json, text/xml;q=0.9, */*;q=0.8' },
          signal: AbortSignal.timeout(this.timeoutMs),
        });
      } catch (error) {
        const reason = error instanceof Error && error.name === 'TimeoutError' ? 'timed out' : 'network error';
        throw new EvidenceError(`Evidence request ${reason}`, url);
      }
      const text = await response.text().catch(() => '');
      const result: HttpResponse = { status: response.status, text };
      if (response.ok || response.status === 404) {
        this.cache.set(url, result, options.ttlMs ?? DEFAULT_TTL_MS);
        return result;
      }
      throw new EvidenceError(`Evidence request failed with HTTP ${response.status}`, url, response.status);
    };

    const promise = (options.limiter ? options.limiter.schedule(run) : run()).finally(() => {
      this.inFlight.delete(url);
    });
    this.inFlight.set(url, promise);
    return promise;
  }
}

/** Builds `base?k=v&…`, skipping empty values. */
export function buildUrl(base: string, params: Record<string, string | number | null | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === '') continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `${base}?${query}` : base;
}
