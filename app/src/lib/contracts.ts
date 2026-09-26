// BRIAN API contracts — shared by server and app.
// server/src/shared/contracts.ts and app/src/lib/contracts.ts MUST stay byte-for-byte identical.

// ───────────────────────── Users & auth ─────────────────────────

export type Role = 'patient' | 'doctor';

export interface PatientProfile {
  dateOfBirth?: string; // YYYY-MM-DD
  allergies: string[];
  conditions: string[];
  pharmacy?: string;
}

export interface DoctorProfile {
  specialty: string; // "Internal Medicine"
  credentials: string; // "MD"
  clinic?: string;
  bio?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  /** 'doctor-photo' → the app renders the bundled professional-doctor image; null → initials avatar. */
  avatar: 'doctor-photo' | null;
  createdAt: string; // ISO timestamp
  patient?: PatientProfile; // present when role === 'patient'
  doctor?: DoctorProfile; // present when role === 'doctor'
  doctorId?: string | null; // patient's assigned physician
}

export interface LoginRequest {
  email: string;
  password: string;
  /** Only used when the email is new (sign-up). Defaults to 'patient'. */
  role?: Role;
  /** Only used when the email is new. Defaults to a name derived from the email. */
  name?: string;
}

export interface LoginResponse {
  status: 'lgtm';
  token: string;
  user: User;
  isNewUser: boolean;
}

export interface UpdateMeRequest {
  name?: string;
  patient?: Partial<PatientProfile>;
  doctor?: Partial<DoctorProfile>;
}

export interface Presence {
  userId: string;
  online: boolean;
  lastSeen?: string | null;
}

// ───────────────────────── Messaging ─────────────────────────

export type MessageAttachment =
  | { type: 'visit-note'; noteId: string }
  | { type: 'prescription'; prescriptionId: string };

export interface ChatMessage {
  id: string;
  threadId: string; // `${patientId}__${doctorId}`
  patientId: string;
  doctorId: string;
  senderId: string;
  body: string;
  createdAt: string;
  readAt: string | null;
  attachment: MessageAttachment | null;
}

export interface Thread {
  id: string; // `${patientId}__${doctorId}`
  patientId: string;
  doctorId: string;
  counterpart: User; // the other participant, from the viewer's point of view
  lastMessage: ChatMessage | null;
  unreadCount: number;
}

export interface SendMessageRequest {
  body: string;
  attachment?: MessageAttachment | null;
}

// ───────────────────────── Prescriptions ─────────────────────────

export type PrescriptionStatus = 'active' | 'paused' | 'discontinued';

export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string | null; // null when self-reported by the patient (OTC / supplement)
  drugName: string; // "Lisinopril"
  strength: string; // "10 mg"
  form: string; // "tablet"
  dose: string; // "1 tablet"
  route: string; // "by mouth"
  frequency: string; // "once daily"
  times: string[]; // reminder slots, local "HH:mm", e.g. ["08:00", "20:00"]
  instructions: string; // "Take in the morning with water."
  purpose: string | null; // "Blood pressure"
  quantity: number | null;
  refillsRemaining: number;
  startDate: string; // YYYY-MM-DD
  endDate: string | null;
  status: PrescriptionStatus;
  selfReported: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PrescriptionInput {
  drugName: string;
  strength: string;
  form: string;
  dose: string;
  route: string;
  frequency: string;
  times: string[];
  instructions: string;
  purpose?: string | null;
  quantity?: number | null;
  refillsRemaining?: number;
  startDate?: string;
  endDate?: string | null;
  status?: PrescriptionStatus;
}

export interface CreatePrescriptionRequest extends PrescriptionInput {
  patientId: string; // doctors: an assigned patient; patients: must be their own id (self-reported)
}

export interface DoseLog {
  id: string;
  prescriptionId: string;
  patientId: string;
  date: string; // YYYY-MM-DD (patient's local date)
  slot: string; // "HH:mm" — which scheduled time this dose satisfies
  takenAt: string; // ISO timestamp
}

export interface LogDoseRequest {
  prescriptionId: string;
  date: string;
  slot: string;
}

export type RefillStatus = 'pending' | 'approved' | 'denied';

export interface RefillRequest {
  id: string;
  prescriptionId: string;
  patientId: string;
  doctorId: string;
  status: RefillStatus;
  patientNote: string | null;
  doctorNote: string | null;
  refillsAdded: number | null; // set on approval
  createdAt: string;
  resolvedAt: string | null;
}

export interface CreateRefillRequest {
  prescriptionId: string;
  patientNote?: string | null;
}

export interface ResolveRefillRequest {
  status: 'approved' | 'denied';
  doctorNote?: string | null;
  /** Refills to add on approval (default 1). */
  refillsAdded?: number;
}

// ───────────────────────── Visit notes ─────────────────────────

export interface VisitNote {
  id: string;
  patientId: string;
  doctorId: string;
  title: string;
  body: string; // clinician's words (may contain jargon — the AI can explain it)
  createdAt: string;
}

export interface CreateVisitNoteRequest {
  patientId: string;
  title: string;
  body: string;
}

// ───────────────────────── Dashboards ─────────────────────────

export interface PatientDashboard {
  doctor: User | null;
  doctorOnline: boolean;
  prescriptions: Prescription[]; // active + paused
  todayDoses: DoseLog[]; // doses logged for `date` (query param, default server-local today)
  pendingRefills: RefillRequest[];
  latestNote: VisitNote | null;
  unreadMessages: number;
}

export interface PatientSummary {
  patient: User;
  online: boolean;
  activePrescriptions: number;
  adherence7d: number | null; // 0..1 over the last 7 days of scheduled slots; null if nothing scheduled
  pendingRefills: number;
  unreadMessages: number;
  lastMessageAt: string | null;
}

export interface PatientDetail {
  patient: User;
  online: boolean;
  prescriptions: Prescription[]; // all statuses
  doseLogs: DoseLog[]; // last 14 days
  refillRequests: RefillRequest[];
  notes: VisitNote[];
}

// ───────────────────────── AI doctor & evidence ─────────────────────────

export type AiMode = 'general' | 'explain-note' | 'medication' | 'symptoms' | 'lesson';

export type TriageLevel = 'emergency' | 'urgent' | 'routine' | 'info';

export interface TriageAction {
  label: string; // "Call 911"
  phone?: string; // "911"
  url?: string;
}

export interface Triage {
  level: TriageLevel;
  title: string;
  message: string;
  actions: TriageAction[];
}

export type EvidenceSource = 'PubMed' | 'MedlinePlus' | 'openFDA' | 'RxNorm' | 'NIH' | 'CDC' | 'Glossary';

export interface Citation {
  id: string; // "1", "2", … — the assistant cites these as [1], [2]
  source: EvidenceSource;
  title: string;
  url: string;
  publisher?: string; // journal name or organization
  year?: string;
  authors?: string;
  snippet?: string;
  pmid?: string;
}

export interface AiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string; // markdown-lite (see docs/SPEC.md); assistant cites evidence as [1], [2]
  createdAt: string;
  mode?: AiMode;
  citations?: Citation[];
  triage?: Triage | null;
  /** true when produced without an LLM (no ANTHROPIC_API_KEY, or the LLM call failed). */
  mocked?: boolean;
}

export interface AiConversation {
  id: string;
  userId: string;
  title: string;
  mode: AiMode;
  messages: AiMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface AiChatContext {
  noteId?: string;
  noteText?: string;
  prescriptionId?: string;
  drugName?: string;
  lessonId?: string;
  lessonTitle?: string;
}

export interface AiChatRequest {
  conversationId?: string;
  message: string;
  mode?: AiMode;
  context?: AiChatContext;
}

export interface AiChatResponse {
  conversation: AiConversation;
  reply: AiMessage;
}

export interface AiStatus {
  provider: 'anthropic' | 'mock';
  model: string | null;
  evidence: { pubmed: boolean; medlineplus: boolean; openfda: boolean; rxnorm: boolean };
}

export interface DrugInfoSection {
  title: string; // "Uses", "How to take", "Warnings", "Interactions", "Side effects"
  text: string;
}

export interface DrugInfo {
  query: string;
  name: string;
  genericName: string | null;
  brandNames: string[];
  rxcui: string | null;
  sections: DrugInfoSection[];
  citations: Citation[];
  mocked: boolean;
}

export interface EvidenceSearchResponse {
  query: string;
  citations: Citation[];
}

// ───────────────────────── Health & errors ─────────────────────────

export interface HealthResponse {
  ok: true;
  name: 'BRIAN';
  version: string;
  time: string;
  ai: AiStatus;
}

export interface ApiError {
  error: string;
  details?: unknown;
}

// ───────────────────────── Realtime (Socket.IO) ─────────────────────────
// Connect with: io(serverUrl, { auth: { token } }). Each socket joins room `user:<id>`.

export type LiveNotificationKind = 'message' | 'prescription' | 'refill' | 'note' | 'dose' | 'system';

export interface LiveNotification {
  id: string;
  kind: LiveNotificationKind;
  title: string;
  body: string;
  createdAt: string;
  /** In-app route to open when tapped, e.g. "/patient/meds/rx_123". */
  href?: string;
}

export interface ServerToClientEvents {
  'message:new': (message: ChatMessage) => void;
  'message:read': (payload: { threadId: string; readerId: string; readAt: string }) => void;
  typing: (payload: { threadId: string; userId: string; isTyping: boolean }) => void;
  presence: (presence: Presence) => void;
  'prescription:upsert': (prescription: Prescription) => void;
  'dose:logged': (dose: DoseLog) => void;
  'dose:removed': (payload: { id: string; prescriptionId: string; patientId: string }) => void;
  'refill:upsert': (refill: RefillRequest) => void;
  'note:new': (note: VisitNote) => void;
  'user:updated': (user: User) => void;
  notify: (notification: LiveNotification) => void;
}

export interface ClientToServerEvents {
  typing: (payload: { threadId: string; isTyping: boolean }) => void;
  'presence:query': (userIds: string[], ack: (presence: Presence[]) => void) => void;
}
