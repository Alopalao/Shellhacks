// Realtime fan-out helpers and human-friendly `notify` payloads with role-correct hrefs.
import type { ServerContext } from '../context';
import { newId } from '../db/ids';
import type { LiveNotification, Prescription, ServerToClientEvents, User } from '../shared/contracts';

/** Emit one event to several users (null/duplicate ids are skipped). */
export function emitTo<E extends keyof ServerToClientEvents>(
  ctx: ServerContext,
  userIds: ReadonlyArray<string | null | undefined>,
  event: E,
  ...args: Parameters<ServerToClientEvents[E]>
): void {
  const seen = new Set<string>();
  for (const id of userIds) {
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ctx.realtime.emitToUser(id, event, ...args);
  }
}

export type NotificationInput = Omit<LiveNotification, 'id' | 'createdAt'>;

/** Send a toast-style `notify` event to one user. */
export function notify(ctx: ServerContext, userId: string | null | undefined, input: NotificationInput): void {
  if (!userId) return;
  const notification: LiveNotification = {
    id: newId('ntf'),
    createdAt: new Date().toISOString(),
    ...input,
  };
  ctx.realtime.emitToUser(userId, 'notify', notification);
}

/** In-app routes (expo-router) the toasts deep-link to, per recipient role. */
export const hrefs = {
  patient: {
    home: '/patient',
    med: (prescriptionId: string) => `/patient/meds/${prescriptionId}`,
    chat: '/patient/care/chat',
    note: (noteId: string) => `/patient/care/notes/${noteId}`,
  },
  doctor: {
    patient: (patientId: string) => `/doctor/patients/${patientId}`,
    thread: (threadId: string) => `/doctor/messages/${threadId}`,
    inbox: '/doctor/inbox',
  },
} as const;

/** "Dr. Daniel Reyes" for doctors (adds the title if missing), the plain name for patients. */
export function displayName(user: User): string {
  if (user.role !== 'doctor') return user.name;
  return /^dr\.?\s/i.test(user.name) ? user.name : `Dr. ${user.name}`;
}

/** Short form for toast titles: "Dr. Reyes" / "Maya". */
export function shortName(user: User): string {
  const bare = user.name.replace(/^dr\.?\s+/i, '').trim();
  const parts = bare.split(/\s+/).filter(Boolean);
  if (user.role === 'doctor') return `Dr. ${parts.at(-1) ?? bare}`;
  return parts[0] ?? user.name;
}

/** "Lisinopril 10 mg" */
export function medLabel(rx: Pick<Prescription, 'drugName' | 'strength'>): string {
  return `${rx.drugName} ${rx.strength}`.trim();
}

/** Single-line preview of a chat message for a toast body. */
export function preview(text: string, max = 140): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length > max ? `${flat.slice(0, max - 1).trimEnd()}…` : flat;
}
