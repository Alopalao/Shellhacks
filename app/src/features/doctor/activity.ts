// Session-only live activity feed for the doctor (doses logged, refill requests, messages, profile
// updates). Events are recorded by `useActivityRecorder()` — mounted on the Patients and Inbox tabs so
// it captures events from the moment the doctor opens the app — and read with `useActivityFeed()`.
import { useSyncExternalStore } from 'react';
import { useAuth } from '@/lib/auth';
import type { ChatMessage, DoseLog, Prescription, RefillRequest, User } from '@/lib/contracts';
import { useSocketEvent } from '@/lib/socket';

export type ActivityItem =
  | { id: string; kind: 'dose'; at: string; patientId: string; prescriptionId: string; slot: string; date: string }
  | { id: string; kind: 'refill'; at: string; patientId: string; prescriptionId: string; note: string | null }
  | { id: string; kind: 'message'; at: string; patientId: string; threadId: string; body: string }
  | { id: string; kind: 'profile'; at: string; patientId: string; name: string }
  | { id: string; kind: 'medication'; at: string; patientId: string; prescriptionId: string; label: string; status: string };

export type ActivityKind = ActivityItem['kind'];

const MAX_ITEMS = 60;

interface FeedState {
  ownerId: string | null;
  items: readonly ActivityItem[];
}

let state: FeedState = { ownerId: null, items: [] };
const listeners = new Set<() => void>();
/**
 * Socket.IO hands the same payload object to every listener, so a WeakSet dedupes events when more
 * than one recorder is mounted at once.
 */
const seenPayloads = new WeakSet<object>();

function emit() {
  listeners.forEach((l) => l());
}

function record(ownerId: string, payload: object, item: ActivityItem) {
  if (seenPayloads.has(payload)) return;
  seenPayloads.add(payload);
  const items = state.ownerId === ownerId ? state.items : [];
  if (items.some((x) => x.id === item.id)) return;
  state = { ownerId, items: [item, ...items].slice(0, MAX_ITEMS) };
  emit();
}

/** Forget the session's activity (e.g. on sign-out). */
export function clearActivity(): void {
  state = { ownerId: null, items: [] };
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => state;
const EMPTY: readonly ActivityItem[] = [];

/** The current doctor's activity feed, newest first. */
export function useActivityFeed(): readonly ActivityItem[] {
  const { user } = useAuth();
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return user && snapshot.ownerId === user.id ? snapshot.items : EMPTY;
}

const nowIso = () => new Date().toISOString();

/** Listen for patient-side events and append them to the feed. Safe to mount more than once. */
export function useActivityRecorder(): void {
  const { user } = useAuth();
  const doctorId = user?.role === 'doctor' ? user.id : null;

  useSocketEvent('dose:logged', (dose: DoseLog) => {
    if (!doctorId) return;
    record(doctorId, dose, {
      id: `dose:${dose.id}`,
      kind: 'dose',
      at: dose.takenAt || nowIso(),
      patientId: dose.patientId,
      prescriptionId: dose.prescriptionId,
      slot: dose.slot,
      date: dose.date,
    });
  });

  useSocketEvent('refill:upsert', (refill: RefillRequest) => {
    if (!doctorId || refill.status !== 'pending') return;
    record(doctorId, refill, {
      id: `refill:${refill.id}`,
      kind: 'refill',
      at: refill.createdAt || nowIso(),
      patientId: refill.patientId,
      prescriptionId: refill.prescriptionId,
      note: refill.patientNote,
    });
  });

  useSocketEvent('message:new', (message: ChatMessage) => {
    if (!doctorId || message.senderId === doctorId) return;
    record(doctorId, message, {
      id: `message:${message.id}`,
      kind: 'message',
      at: message.createdAt || nowIso(),
      patientId: message.patientId,
      threadId: message.threadId,
      body: message.body,
    });
  });

  useSocketEvent('user:updated', (updated: User) => {
    if (!doctorId || updated.role !== 'patient' || updated.id === doctorId) return;
    const at = nowIso();
    record(doctorId, updated, {
      id: `profile:${updated.id}:${at}`,
      kind: 'profile',
      at,
      patientId: updated.id,
      name: updated.name,
    });
  });

  useSocketEvent('prescription:upsert', (rx: Prescription) => {
    // Only patient-side changes: self-reported OTC meds / supplements.
    if (!doctorId || !rx.selfReported) return;
    record(doctorId, rx, {
      id: `medication:${rx.id}:${rx.updatedAt}`,
      kind: 'medication',
      at: rx.updatedAt || nowIso(),
      patientId: rx.patientId,
      prescriptionId: rx.id,
      label: `${rx.drugName} ${rx.strength}`.trim(),
      status: rx.status,
    });
  });
}
