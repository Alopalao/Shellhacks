// Pure helpers for chat state: merging server messages with optimistic ones (dedupe by id,
// reconcile pending bubbles), read receipts, list rows with day separators, and previews.
import type { ChatMessage, MessageAttachment, User } from '@/lib/contracts';
import { addDays, dateKey, displayName, formatDate, formatTime, isSameDay, toDate } from '@/lib/format';
import type { ChatRow, LocalMessage, Receipt } from './types';

/** Messages per page for the initial load and "Load earlier". */
export const CHAT_PAGE_SIZE = 50;

/** Consecutive messages from the same sender closer than this are grouped visually. */
const GROUP_GAP_MS = 5 * 60_000;

const WEEKDAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Stable React key: the optimistic client id survives reconciliation with the server copy. */
export function messageKey(message: LocalMessage): string {
  return message.clientId ?? message.id;
}

/** New client id for an optimistic message. */
export function createClientId(): string {
  return `local_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function sameAttachment(a: MessageAttachment | null | undefined, b: MessageAttachment | null | undefined): boolean {
  if (!a || !b) return !a && !b;
  if (a.type === 'visit-note') return b.type === 'visit-note' && a.noteId === b.noteId;
  return b.type === 'prescription' && a.prescriptionId === b.prescriptionId;
}

function timeOf(iso: string): number {
  const t = Date.parse(iso);
  return Number.isNaN(t) ? 0 : t;
}

function compareSent(a: LocalMessage, b: LocalMessage): number {
  return timeOf(a.createdAt) - timeOf(b.createdAt) || a.id.localeCompare(b.id);
}

/**
 * Canonical order: delivered messages by server time, then unsent (pending/failed) ones in the
 * order they were written. Keeping unsent bubbles last avoids jumps caused by device clock skew.
 */
export function normalizeMessages(list: readonly LocalMessage[]): LocalMessage[] {
  const sent = list.filter((m) => m.status === 'sent').sort(compareSent);
  const unsent = list.filter((m) => m.status !== 'sent');
  return [...sent, ...unsent];
}

export interface UpsertOptions {
  /** Signed-in user id (needed to reconcile optimistic bubbles). */
  me: string;
  /** The optimistic message this server message answers (POST response). */
  clientId?: string;
  /** Match an unsent bubble with the same body/attachment when no client id is known (socket echo). */
  reconcile?: boolean;
}

/**
 * Insert or merge one server message:
 * 1. already present by id → merge (keeps the client id and the newest read state);
 * 2. the optimistic bubble with `clientId` is still unsent → replace it;
 * 3. `reconcile` and an unsent bubble of mine has the same body + attachment → replace it;
 * 4. otherwise append.
 * Does not sort — call `normalizeMessages` afterwards.
 */
export function upsertMessage(list: readonly LocalMessage[], message: ChatMessage, options: UpsertOptions): LocalMessage[] {
  const { me, clientId, reconcile = false } = options;
  const existing = list.findIndex((m) => m.id === message.id);
  if (existing >= 0) {
    const prev = list[existing]!;
    const merged: LocalMessage = {
      ...message,
      readAt: message.readAt ?? prev.readAt,
      status: 'sent',
      clientId: prev.clientId ?? clientId,
    };
    return list
      .map((m, i) => (i === existing ? merged : m))
      .filter((m, i) => i === existing || !(clientId && m.clientId === clientId && m.status !== 'sent'));
  }

  if (clientId) {
    const byClient = list.findIndex((m) => m.clientId === clientId && m.status !== 'sent');
    if (byClient >= 0) {
      return list.map((m, i) => (i === byClient ? { ...message, status: 'sent', clientId } : m));
    }
  }

  if (reconcile && message.senderId === me) {
    const body = message.body.trim();
    const pending = list.findIndex(
      (m) =>
        m.status !== 'sent' &&
        m.senderId === me &&
        m.body.trim() === body &&
        sameAttachment(m.attachment, message.attachment),
    );
    if (pending >= 0) {
      return list.map((m, i) => (i === pending ? { ...message, status: 'sent', clientId: m.clientId } : m));
    }
  }

  return [...list, { ...message, status: 'sent' }];
}

/** Merge a page of server messages (initial load, resync, or "Load earlier"). */
export function mergeMessages(
  list: readonly LocalMessage[],
  incoming: readonly ChatMessage[],
  options: Omit<UpsertOptions, 'clientId'>,
): LocalMessage[] {
  let next: LocalMessage[] = [...list];
  for (const message of incoming) next = upsertMessage(next, message, options);
  return normalizeMessages(next);
}

/**
 * Apply a `message:read` event: the reader has read every message sent by the *other* participant
 * (optionally only those created at or before `upTo`). Returns the same array when nothing changed.
 */
export function applyRead(list: LocalMessage[], readerId: string, readAt: string, upTo?: string): LocalMessage[] {
  const cutoff = upTo ? timeOf(upTo) : Number.POSITIVE_INFINITY;
  let changed = false;
  const next = list.map((m) => {
    if (m.status !== 'sent' || m.readAt || m.senderId === readerId) return m;
    if (timeOf(m.createdAt) > cutoff) return m;
    changed = true;
    return { ...m, readAt };
  });
  return changed ? next : list;
}

/** The newest incoming message the viewer hasn't read yet (drives POST /read). */
export function latestUnreadIncoming(list: readonly LocalMessage[], me: string): LocalMessage | null {
  for (let i = list.length - 1; i >= 0; i -= 1) {
    const m = list[i]!;
    if (m.status === 'sent' && m.senderId !== me && !m.readAt) return m;
  }
  return null;
}

/** Oldest delivered message — the `before` cursor for "Load earlier". */
export function oldestSent(list: readonly LocalMessage[]): LocalMessage | null {
  return list.find((m) => m.status === 'sent') ?? null;
}

/** "Today", "Yesterday", "Monday" (this week), else "Mon, Apr 12" (year when not current). */
export function dayLabel(input: string, now: Date = new Date()): string {
  const d = toDate(input);
  if (!d) return '';
  if (isSameDay(d, now)) return 'Today';
  if (isSameDay(d, addDays(dateKey(now), -1))) return 'Yesterday';
  const days = Math.round((toDate(dateKey(now))!.getTime() - toDate(dateKey(d))!.getTime()) / 86_400_000);
  if (days > 0 && days < 7) return WEEKDAYS_LONG[d.getDay()] ?? formatDate(d, { weekday: true });
  return formatDate(d, { weekday: true, omitCurrentYear: true });
}

function sameGroup(a: LocalMessage | undefined, b: LocalMessage | undefined): boolean {
  if (!a || !b || a.senderId !== b.senderId) return false;
  if (!isSameDay(a.createdAt, b.createdAt)) return false;
  return Math.abs(timeOf(b.createdAt) - timeOf(a.createdAt)) <= GROUP_GAP_MS;
}

/**
 * Rows in chronological order (oldest first): a day separator before each new day, grouping flags,
 * and a read receipt on my latest delivered message when the other person hasn't replied since.
 * Reverse the result for an inverted list.
 */
export function buildRows(messages: readonly LocalMessage[], me: string, now: Date = new Date()): ChatRow[] {
  let lastMineSent = -1;
  let lastTheirs = -1;
  messages.forEach((m, i) => {
    if (m.senderId === me && m.status === 'sent') lastMineSent = i;
    if (m.senderId !== me) lastTheirs = i;
  });
  const receiptIndex = lastMineSent > lastTheirs ? lastMineSent : -1;

  const rows: ChatRow[] = [];
  let currentDay = '';
  messages.forEach((m, i) => {
    const day = dateKey(m.createdAt);
    if (day !== currentDay) {
      currentDay = day;
      rows.push({ type: 'day', key: `day-${day}`, label: dayLabel(m.createdAt, now) });
    }
    const prev = messages[i - 1];
    const next = messages[i + 1];
    let receipt: Receipt | null = null;
    if (i === receiptIndex) receipt = m.readAt ? { kind: 'seen', at: m.readAt } : { kind: 'sent' };
    rows.push({
      type: 'message',
      key: messageKey(m),
      message: m,
      mine: m.senderId === me,
      firstInGroup: !sameGroup(prev, m),
      lastInGroup: !sameGroup(m, next),
      receipt,
    });
  });
  return rows;
}

/** One-line preview for thread lists: "You: See you then", "Shared a visit note". */
export function messagePreview(message: ChatMessage | null | undefined, me: string): string {
  if (!message) return 'No messages yet';
  const prefix = message.senderId === me ? 'You: ' : '';
  const body = message.body.replace(/\s+/g, ' ').trim();
  if (body) return `${prefix}${body}`;
  if (message.attachment?.type === 'visit-note') return `${prefix}Shared a visit note`;
  if (message.attachment?.type === 'prescription') return `${prefix}Shared a medication`;
  return `${prefix}Message`;
}

/** "Dr. Reyes" for doctors, first name for patients — for buttons and placeholders. */
export function shortName(user: Pick<User, 'name' | 'role'> | null | undefined): string {
  if (!user) return '';
  const full = displayName(user);
  if (user.role !== 'doctor') return full.split(/\s+/)[0] ?? full;
  const parts = full.replace(/^dr\.?\s+/i, '').trim().split(/\s+/).filter(Boolean);
  return `Dr. ${parts[parts.length - 1] ?? full}`;
}

/**
 * Human "last seen" text: `just now`, `5 min ago`, `today at 3:05 PM`, `yesterday at 9:12 AM`, `Apr 3`.
 */
export function formatLastSeen(iso: string | null | undefined, now: Date = new Date()): string | null {
  const d = toDate(iso ?? null);
  if (!d) return null;
  const diff = now.getTime() - d.getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 60 * 60_000) return `${Math.max(1, Math.round(diff / 60_000))} min ago`;
  if (isSameDay(d, now)) return `today at ${formatTime(d)}`;
  if (isSameDay(d, addDays(dateKey(now), -1))) return `yesterday at ${formatTime(d)}`;
  return formatDate(d, { omitCurrentYear: true });
}
