// Pure read helpers over DbData shared by routes and the realtime layer.
import type { DbData } from '../context';
import type { ChatMessage, Prescription, User } from '../shared/contracts';

export function findUser(data: DbData, id: string | null | undefined): User | undefined {
  if (!id) return undefined;
  return data.users.find((u) => u.id === id);
}

export function findUserByEmail(data: DbData, email: string): User | undefined {
  const needle = email.trim().toLowerCase();
  return data.users.find((u) => u.email.toLowerCase() === needle);
}

export function listDoctors(data: DbData): User[] {
  return data.users.filter((u) => u.role === 'doctor');
}

/** The demo physician new patients are assigned to: the first doctor in the store. */
export function firstDoctor(data: DbData): User | undefined {
  return data.users.find((u) => u.role === 'doctor');
}

export function patientsOf(data: DbData, doctorId: string): User[] {
  return data.users.filter((u) => u.role === 'patient' && u.doctorId === doctorId);
}

/**
 * The people who care about this user's presence and profile:
 * a patient's assigned doctor, or all of a doctor's patients.
 */
export function counterpartIds(data: DbData, user: User): string[] {
  if (user.role === 'patient') return user.doctorId ? [user.doctorId] : [];
  return patientsOf(data, user.id).map((p) => p.id);
}

/** True when `a` and `b` are a patient and their currently assigned doctor (either order). */
export function areCounterparts(data: DbData, a: User, b: User): boolean {
  if (a.role === 'patient' && b.role === 'doctor') return a.doctorId === b.id;
  if (a.role === 'doctor' && b.role === 'patient') return b.doctorId === a.id;
  return false;
}

export const THREAD_SEPARATOR = '__';

export function threadIdFor(patientId: string, doctorId: string): string {
  return `${patientId}${THREAD_SEPARATOR}${doctorId}`;
}

export function parseThreadId(threadId: string): { patientId: string; doctorId: string } | null {
  const parts = threadId.split(THREAD_SEPARATOR);
  if (parts.length !== 2) return null;
  const [patientId, doctorId] = parts as [string, string];
  if (!patientId || !doctorId) return null;
  return { patientId, doctorId };
}

export type ThreadAccess =
  | { ok: true; threadId: string; patient: User; doctor: User; self: User; other: User }
  | { ok: false; reason: 'not-found' | 'forbidden' };

/**
 * Resolves a thread for `viewerId`. A thread exists only between a patient and their
 * *currently* assigned doctor, and only those two people may access it.
 */
export function resolveThreadAccess(data: DbData, viewerId: string, threadId: string): ThreadAccess {
  const ids = parseThreadId(threadId);
  if (!ids) return { ok: false, reason: 'not-found' };
  if (viewerId !== ids.patientId && viewerId !== ids.doctorId) return { ok: false, reason: 'forbidden' };
  const patient = findUser(data, ids.patientId);
  const doctor = findUser(data, ids.doctorId);
  if (!patient || patient.role !== 'patient' || !doctor || doctor.role !== 'doctor') {
    return { ok: false, reason: 'not-found' };
  }
  if (patient.doctorId !== doctor.id) return { ok: false, reason: 'forbidden' };
  const self = viewerId === patient.id ? patient : doctor;
  const other = self === patient ? doctor : patient;
  return { ok: true, threadId, patient, doctor, self, other };
}

/** Messages of a thread in ascending chronological order. */
export function threadMessages(data: DbData, threadId: string): ChatMessage[] {
  return data.messages
    .filter((m) => m.threadId === threadId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function unreadCountFor(data: DbData, threadId: string, readerId: string): number {
  let count = 0;
  for (const m of data.messages) {
    if (m.threadId === threadId && m.senderId !== readerId && m.readAt === null) count++;
  }
  return count;
}

export function lastMessageOf(data: DbData, threadId: string): ChatMessage | null {
  let last: ChatMessage | null = null;
  for (const m of data.messages) {
    if (m.threadId === threadId && (!last || m.createdAt > last.createdAt)) last = m;
  }
  return last;
}

const STATUS_ORDER: Record<Prescription['status'], number> = { active: 0, paused: 1, discontinued: 2 };

/** Active first, then paused, then discontinued; alphabetical within a status. */
export function comparePrescriptions(a: Prescription, b: Prescription): number {
  return STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.drugName.localeCompare(b.drugName);
}

export const newestFirst = <T extends { createdAt: string }>(a: T, b: T): number => b.createdAt.localeCompare(a.createdAt);
