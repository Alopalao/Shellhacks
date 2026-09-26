// Typed REST client for the BRIAN server (see docs/SPEC.md §3).
// - Attaches the bearer token set by AuthProvider, parses JSON, and throws ApiRequestError on failure.
// - Helpers unwrap single-key envelopes: `api.threads()` resolves `Thread[]`, not `{ threads }`.
import type {
  AiChatRequest,
  AiChatResponse,
  AiConversation,
  AiStatus,
  ChatMessage,
  CreatePrescriptionRequest,
  CreateRefillRequest,
  CreateVisitNoteRequest,
  DoseLog,
  DrugInfo,
  EvidenceSearchResponse,
  HealthResponse,
  LogDoseRequest,
  LoginRequest,
  LoginResponse,
  PatientDashboard,
  PatientDetail,
  PatientSummary,
  Prescription,
  PrescriptionInput,
  RefillRequest,
  RefillStatus,
  ResolveRefillRequest,
  SendMessageRequest,
  Thread,
  UpdateMeRequest,
  User,
  VisitNote,
} from './contracts';
import { todayKey } from './format';
import { getServerUrl, getServerUrlState, normalizeServerUrl } from './server-url';

/** Default request timeout. */
export const DEFAULT_TIMEOUT_MS = 20_000;
/** AI chat can take a while (LLM + evidence tools). */
export const AI_CHAT_TIMEOUT_MS = 120_000;
/** Evidence lookups hit external services server-side. */
export const EVIDENCE_TIMEOUT_MS = 45_000;
/** Connection tests should fail fast. */
export const HEALTH_TIMEOUT_MS = 6_000;

/** Why a request failed. `http` = server answered with an error status. */
export type ApiErrorKind = 'http' | 'network' | 'timeout' | 'aborted' | 'parse';

/**
 * Error thrown by every API helper. `message` is friendly and safe to show in the UI.
 * `status` is the HTTP status (0 when the server was unreachable / timed out).
 */
export class ApiRequestError extends Error {
  readonly status: number;
  readonly kind: ApiErrorKind;
  readonly details?: unknown;
  /** Server base URL the request was sent to (for "check your server" hints). */
  readonly serverUrl: string;
  /** Raw `error` string from the server body, if any. */
  readonly serverMessage?: string;

  constructor(init: {
    message: string;
    status: number;
    kind: ApiErrorKind;
    serverUrl: string;
    details?: unknown;
    serverMessage?: string;
  }) {
    super(init.message);
    // Keep `instanceof` reliable even if Error subclassing is transpiled.
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = 'ApiRequestError';
    this.status = init.status;
    this.kind = init.kind;
    this.serverUrl = init.serverUrl;
    this.details = init.details;
    this.serverMessage = init.serverMessage;
  }

  /** True when the server could not be reached at all (down, wrong URL, timeout). */
  get isNetworkError(): boolean {
    return this.kind === 'network' || this.kind === 'timeout';
  }
}

/** Narrow unknown errors. */
export function isApiRequestError(error: unknown): error is ApiRequestError {
  return (
    error instanceof ApiRequestError ||
    (error instanceof Error && error.name === 'ApiRequestError' && 'status' in error && 'kind' in error)
  );
}

/** True when `error` means "the server is unreachable" (vs. a normal 4xx/5xx). */
export function isNetworkError(error: unknown): boolean {
  return isApiRequestError(error) && (error.kind === 'network' || error.kind === 'timeout');
}

/** A friendly message for any thrown value (ApiRequestError, Error, string…). */
export function errorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error) return error;
  return fallback;
}

// ───────────────────────── Auth token plumbing (set by AuthProvider) ─────────────────────────

let authToken: string | null = null;
let unauthorizedHandler: ((token: string) => void) | null = null;

/** Set/clear the bearer token used by all requests. Called by AuthProvider. */
export function setAuthToken(token: string | null): void {
  authToken = token;
}

/** Current bearer token (or null). */
export function getAuthToken(): string | null {
  return authToken;
}

/**
 * Called with the token that was rejected when an authenticated request gets a 401
 * (AuthProvider signs the user out if it is still the current token).
 */
export function setUnauthorizedHandler(handler: ((token: string) => void) | null): void {
  unauthorizedHandler = handler;
}

// ───────────────────────── Core request ─────────────────────────

type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** JSON body (serialized for you). */
  body?: unknown;
  /** Query parameters; null/undefined/'' values are skipped. */
  query?: Record<string, QueryValue>;
  /** Milliseconds before the request is aborted with kind 'timeout'. Default 20 s. */
  timeoutMs?: number;
  /** Attach the bearer token (default true). */
  auth?: boolean;
  /** Override the server base URL (e.g. to test a URL before saving it). */
  baseUrl?: string;
  /** Caller-controlled cancellation (kind 'aborted'). */
  signal?: AbortSignal;
}

function buildUrl(baseUrl: string, path: string, query?: Record<string, QueryValue>): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const params = Object.entries(query ?? {})
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return `${baseUrl}${cleanPath}${params.length ? `?${params.join('&')}` : ''}`;
}

function statusMessage(status: number, serverMessage: string | undefined, hadToken: boolean): string {
  if (status === 401) {
    return hadToken ? 'Your session has ended. Please sign in again.' : serverMessage || 'Please sign in to continue.';
  }
  if (serverMessage) return serverMessage;
  switch (status) {
    case 400:
      return 'Some of that information looks off. Please check and try again.';
    case 403:
      return "You don't have access to that.";
    case 404:
      return "We couldn't find that. It may have been removed.";
    case 409:
      return 'That request conflicts with an existing one.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    default:
      return status >= 500
        ? 'The BRIAN server hit a problem. Please try again in a moment.'
        : `Request failed (HTTP ${status}).`;
  }
}

/**
 * Low-level request. Prefer the typed `api.*` helpers; use this for anything not covered.
 * Resolves the parsed JSON body typed as `T`; throws ApiRequestError otherwise.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const baseUrl = normalizeServerUrl(options.baseUrl) ?? getServerUrl();
  const method = options.method ?? (options.body === undefined ? 'GET' : 'POST');
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const token = options.auth === false ? null : authToken;
  const url = buildUrl(baseUrl, path, options.query);

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const onExternalAbort = () => controller.abort();
  if (options.signal) {
    if (options.signal.aborted) controller.abort();
    else options.signal.addEventListener('abort', onExternalAbort);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
    });
  } catch (cause) {
    clearTimeout(timer);
    options.signal?.removeEventListener('abort', onExternalAbort);
    if (timedOut) {
      throw new ApiRequestError({
        kind: 'timeout',
        status: 0,
        serverUrl: baseUrl,
        message: `The BRIAN server at ${baseUrl} took too long to respond. Check that it's running and try again.`,
        details: cause,
      });
    }
    if (options.signal?.aborted) {
      throw new ApiRequestError({ kind: 'aborted', status: 0, serverUrl: baseUrl, message: 'Request cancelled.' });
    }
    const { source, detected } = getServerUrlState();
    throw new ApiRequestError({
      kind: 'network',
      status: 0,
      serverUrl: baseUrl,
      message:
        source === 'tunnel' && baseUrl === detected
          ? "This app was opened through an Expo tunnel, which can't reach the BRIAN server. Enter the server's public address in the server settings."
          : `Can't reach the BRIAN server at ${baseUrl}. Make sure it's running (npm run server) and that this device is on the same network.`,
      details: cause,
    });
  }

  let text = '';
  try {
    text = await response.text();
  } catch {
    // Body could not be read; treat as empty.
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener('abort', onExternalAbort);
  }

  let json: unknown = undefined;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      if (response.ok) {
        throw new ApiRequestError({
          kind: 'parse',
          status: response.status,
          serverUrl: baseUrl,
          message: `Unexpected response from ${baseUrl}. Is this the BRIAN server?`,
        });
      }
    }
  }

  if (!response.ok) {
    const body = (json && typeof json === 'object' ? json : {}) as { error?: unknown; details?: unknown };
    const serverMessage = typeof body.error === 'string' ? body.error : undefined;
    if (response.status === 401 && token) unauthorizedHandler?.(token);
    throw new ApiRequestError({
      kind: 'http',
      status: response.status,
      serverUrl: baseUrl,
      serverMessage,
      details: body.details,
      message: statusMessage(response.status, serverMessage, !!token),
    });
  }

  return json as T;
}

// ───────────────────────── Typed endpoint helpers ─────────────────────────

const enc = encodeURIComponent;

export interface MessagesQuery {
  limit?: number;
  /** ISO timestamp: only messages created before this. */
  before?: string;
}

export interface DosesQuery {
  /** Doctors: which patient. Patients: omit. */
  patientId?: string;
  /** Only doses for this prescription. */
  prescriptionId?: string;
  /** Inclusive `YYYY-MM-DD`. */
  from?: string;
  /** Inclusive `YYYY-MM-DD`. */
  to?: string;
}

export interface ResolveRefillResponse {
  refillRequest: RefillRequest;
  prescription: Prescription;
}

/** Every REST endpoint in SPEC §3, typed. All helpers throw ApiRequestError on failure. */
export const api = {
  // Health & status
  /** GET /api/health (no auth). Pass `baseUrl` to test a URL before saving it. Fails fast (6 s). */
  health: (baseUrl?: string) =>
    apiRequest<HealthResponse>('/api/health', { auth: false, baseUrl, timeoutMs: HEALTH_TIMEOUT_MS }),
  /** GET /api/ai/status (no auth). */
  aiStatus: () => apiRequest<AiStatus>('/api/ai/status', { auth: false }),

  // Auth & me
  /** POST /api/auth/login → `{ status: 'lgtm', token, user, isNewUser }`. Prefer `useAuth().login`. */
  login: (req: LoginRequest) => apiRequest<LoginResponse>('/api/auth/login', { method: 'POST', body: req, auth: false }),
  /** POST /api/auth/logout. Prefer `useAuth().logout`. */
  logout: () => apiRequest<{ ok: true }>('/api/auth/logout', { method: 'POST', body: {} }),
  /** GET /api/me → the signed-in user. */
  me: async () => (await apiRequest<{ user: User }>('/api/me')).user,
  /** PATCH /api/me → updated user (call `useAuth().setUser(user)` afterwards). */
  updateMe: async (req: UpdateMeRequest) =>
    (await apiRequest<{ user: User }>('/api/me', { method: 'PATCH', body: req })).user,
  /** GET /api/doctors → all doctors. */
  doctors: async () => (await apiRequest<{ doctors: User[] }>('/api/doctors')).doctors,
  /** PUT /api/me/doctor (patients) → updated user with the new `doctorId`. */
  chooseDoctor: async (doctorId: string) =>
    (await apiRequest<{ user: User }>('/api/me/doctor', { method: 'PUT', body: { doctorId } })).user,

  // Patient dashboard
  /** GET /api/dashboard?date= (patients). Defaults to today's local date key. */
  dashboard: (date: string = todayKey()) => apiRequest<PatientDashboard>('/api/dashboard', { query: { date } }),

  // Messaging
  /** GET /api/threads. Patients get exactly one thread (their doctor); doctors one per patient. */
  threads: async () => (await apiRequest<{ threads: Thread[] }>('/api/threads')).threads,
  /** GET /api/threads/:id/messages (ascending). */
  messages: async (threadId: string, query: MessagesQuery = {}) =>
    (
      await apiRequest<{ messages: ChatMessage[] }>(`/api/threads/${enc(threadId)}/messages`, {
        query: { limit: query.limit, before: query.before },
      })
    ).messages,
  /** POST /api/threads/:id/messages → the created message (also pushed as `message:new`). */
  sendMessage: async (threadId: string, req: SendMessageRequest) =>
    (
      await apiRequest<{ message: ChatMessage }>(`/api/threads/${enc(threadId)}/messages`, {
        method: 'POST',
        body: req,
      })
    ).message,
  /** POST /api/threads/:id/read — marks the counterpart's messages read. */
  markThreadRead: (threadId: string) =>
    apiRequest<{ ok: true }>(`/api/threads/${enc(threadId)}/read`, { method: 'POST', body: {} }),

  // Prescriptions
  /** GET /api/prescriptions (patients: own; doctors: pass `patientId`). */
  prescriptions: async (patientId?: string) =>
    (await apiRequest<{ prescriptions: Prescription[] }>('/api/prescriptions', { query: { patientId } }))
      .prescriptions,
  /** POST /api/prescriptions (doctor → assigned patient; patient → self-reported, own id). */
  createPrescription: async (req: CreatePrescriptionRequest) =>
    (await apiRequest<{ prescription: Prescription }>('/api/prescriptions', { method: 'POST', body: req }))
      .prescription,
  /** PATCH /api/prescriptions/:id (e.g. `{ status: 'paused' }`). */
  updatePrescription: async (id: string, patch: Partial<PrescriptionInput>) =>
    (
      await apiRequest<{ prescription: Prescription }>(`/api/prescriptions/${enc(id)}`, {
        method: 'PATCH',
        body: patch,
      })
    ).prescription,
  /** DELETE /api/prescriptions/:id → prescription with status `discontinued`. */
  discontinuePrescription: async (id: string) =>
    (await apiRequest<{ prescription: Prescription }>(`/api/prescriptions/${enc(id)}`, { method: 'DELETE' }))
      .prescription,

  // Doses
  /** GET /api/doses (patients: own; doctors: `patientId`), optional inclusive `from`/`to`. */
  doses: async (query: DosesQuery = {}) =>
    (await apiRequest<{ doseLogs: DoseLog[] }>('/api/doses', { query: { ...query } })).doseLogs,
  /** POST /api/doses (patients) — idempotent per prescription + date + slot. */
  logDose: async (req: LogDoseRequest) =>
    (await apiRequest<{ doseLog: DoseLog }>('/api/doses', { method: 'POST', body: req })).doseLog,
  /** DELETE /api/doses/:id (patients, own) — "un-take" a dose. */
  removeDose: (id: string) => apiRequest<{ ok: true }>(`/api/doses/${enc(id)}`, { method: 'DELETE' }),

  // Refills
  /** GET /api/refills (patients: own; doctors: theirs), optional status filter. Newest first. */
  refills: async (status?: RefillStatus) =>
    (await apiRequest<{ refillRequests: RefillRequest[] }>('/api/refills', { query: { status } })).refillRequests,
  /** POST /api/refills (patients). 409 if one is already pending for that prescription. */
  createRefill: async (req: CreateRefillRequest) =>
    (await apiRequest<{ refillRequest: RefillRequest }>('/api/refills', { method: 'POST', body: req }))
      .refillRequest,
  /** PATCH /api/refills/:id (doctors): approve (adds `refillsAdded`, default 1) or deny. */
  resolveRefill: (id: string, req: ResolveRefillRequest) =>
    apiRequest<ResolveRefillResponse>(`/api/refills/${enc(id)}`, { method: 'PATCH', body: req }),

  // Visit notes
  /** GET /api/notes (patients: own; doctors: `patientId`). Newest first. */
  notes: async (patientId?: string) =>
    (await apiRequest<{ notes: VisitNote[] }>('/api/notes', { query: { patientId } })).notes,
  /** POST /api/notes (doctors). */
  createNote: async (req: CreateVisitNoteRequest) =>
    (await apiRequest<{ note: VisitNote }>('/api/notes', { method: 'POST', body: req })).note,

  // Doctor views
  /** GET /api/patients (doctors) → summaries for the patient list. */
  patients: async () => (await apiRequest<{ patients: PatientSummary[] }>('/api/patients')).patients,
  /** GET /api/patients/:id (doctors, assigned patient). */
  patient: (id: string) => apiRequest<PatientDetail>(`/api/patients/${enc(id)}`),

  // Admin
  /** POST /api/admin/reset — wipes and re-seeds demo data. */
  resetDemo: () => apiRequest<{ ok: true }>('/api/admin/reset', { method: 'POST', body: {} }),

  // AI doctor
  /** POST /api/ai/chat (120 s timeout). Pass `signal` to cancel. */
  aiChat: (req: AiChatRequest, signal?: AbortSignal) =>
    apiRequest<AiChatResponse>('/api/ai/chat', { method: 'POST', body: req, timeoutMs: AI_CHAT_TIMEOUT_MS, signal }),
  /** GET /api/ai/conversations (newest first). */
  aiConversations: async () =>
    (await apiRequest<{ conversations: AiConversation[] }>('/api/ai/conversations')).conversations,
  /** GET /api/ai/conversations/:id. */
  aiConversation: async (id: string) =>
    (await apiRequest<{ conversation: AiConversation }>(`/api/ai/conversations/${enc(id)}`)).conversation,
  /** DELETE /api/ai/conversations/:id. */
  deleteAiConversation: (id: string) =>
    apiRequest<{ ok: true }>(`/api/ai/conversations/${enc(id)}`, { method: 'DELETE' }),

  // Evidence
  /** GET /api/drugs/info?name= → FDA label sections + citations. */
  drugInfo: (name: string) => apiRequest<DrugInfo>('/api/drugs/info', { query: { name }, timeoutMs: EVIDENCE_TIMEOUT_MS }),
  /** GET /api/evidence/search?q= → citations (PubMed / MedlinePlus / …). */
  evidenceSearch: (q: string) =>
    apiRequest<EvidenceSearchResponse>('/api/evidence/search', { query: { q }, timeoutMs: EVIDENCE_TIMEOUT_MS }),
} as const;

export type Api = typeof api;
