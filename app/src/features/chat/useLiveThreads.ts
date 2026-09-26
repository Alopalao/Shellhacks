// GET /api/threads kept live: new messages bump previews/unread counts and re-order the list,
// reads clear unread counts, profile edits refresh the counterpart, and doctor changes refetch the
// list. Also mirrors the total unread count onto the Care (patient) / Messages (doctor) tab badge.
import { useEffect, useMemo } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { ChatMessage, Role, Thread, User } from '@/lib/contracts';
import { useSocketEvent } from '@/lib/socket';
import { setTabBadge, type TabBadgeKey } from '@/lib/tab-badges';

/** Tab that shows the unread-messages badge for a role. */
export function chatTabBadgeKey(role: Role): TabBadgeKey {
  return role === 'doctor' ? 'doctor/messages' : 'patient/care';
}

function lastActivity(thread: Thread): number {
  const t = thread.lastMessage ? Date.parse(thread.lastMessage.createdAt) : Number.NaN;
  return Number.isNaN(t) ? 0 : t;
}

/** Most recent activity first; threads without messages last, by name. */
export function sortThreads(threads: readonly Thread[]): Thread[] {
  return [...threads].sort(
    (a, b) => lastActivity(b) - lastActivity(a) || a.counterpart.name.localeCompare(b.counterpart.name),
  );
}

function applyNewMessage(thread: Thread, message: ChatMessage, me: string): Thread {
  if (thread.lastMessage?.id === message.id) return thread; // duplicate delivery
  const newer = !thread.lastMessage || Date.parse(message.createdAt) >= Date.parse(thread.lastMessage.createdAt);
  return {
    ...thread,
    lastMessage: newer ? message : thread.lastMessage,
    unreadCount: message.senderId !== me && !message.readAt ? thread.unreadCount + 1 : thread.unreadCount,
  };
}

/**
 * True when a `user:updated` for a patient changes which threads `me` has: the patient's thread is
 * with another doctor now (they switched away from me, or I'm that patient and switched), or the
 * patient was assigned to me (or I'm the patient and just got a doctor) and there's no thread yet.
 */
export function threadsChangedBy(threads: readonly Thread[], updated: User, me: string): boolean {
  if (updated.role !== 'patient') return false;
  const assigned = updated.doctorId ?? null;
  const current = threads.find((t) => t.patientId === updated.id);
  if (current) return current.doctorId !== assigned;
  return assigned !== null && (assigned === me || updated.id === me);
}

export interface LiveThreads {
  threads: Thread[] | undefined;
  error: unknown;
  loading: boolean;
  refreshing: boolean;
  refresh: () => Promise<void>;
  reload: () => Promise<void>;
  /** Sum of unread counts across threads. */
  totalUnread: number;
}

/** Live thread list for the signed-in user (patients get exactly one thread). */
export function useLiveThreads(options: { syncTabBadge?: boolean } = {}): LiveThreads {
  const { syncTabBadge = true } = options;
  const { user } = useAuth();
  const me = user?.id ?? '';
  const query = useApiQuery(() => api.threads(), [me], { enabled: !!me });
  const { data, setData, reload } = query;

  useSocketEvent('message:new', (message) => {
    if (!me) return;
    if (!data?.some((t) => t.id === message.threadId)) {
      // A thread we don't know yet (e.g. a newly assigned patient) — fetch the list again.
      if (data) void reload();
      return;
    }
    setData((prev) =>
      prev ? sortThreads(prev.map((t) => (t.id === message.threadId ? applyNewMessage(t, message, me) : t))) : prev,
    );
  });

  useSocketEvent('message:read', ({ threadId, readerId, readAt }) => {
    setData((prev) =>
      prev?.map((t) => {
        if (t.id !== threadId) return t;
        if (readerId === me) return t.unreadCount === 0 ? t : { ...t, unreadCount: 0 };
        const last = t.lastMessage;
        if (last && last.senderId === me && !last.readAt) return { ...t, lastMessage: { ...last, readAt } };
        return t;
      }),
    );
  });

  useSocketEvent('user:updated', (updated) => {
    if (me && data && threadsChangedBy(data, updated, me)) {
      // A patient switched physicians (or a new patient was assigned to me): threads were added or
      // removed, so fetch the list again instead of patching it.
      void reload();
      return;
    }
    setData((prev) => prev?.map((t) => (t.counterpart.id === updated.id ? { ...t, counterpart: updated } : t)));
  });

  const totalUnread = useMemo(() => (data ?? []).reduce((sum, t) => sum + t.unreadCount, 0), [data]);

  const role = user?.role;
  useEffect(() => {
    if (!syncTabBadge || !role || data === undefined) return;
    setTabBadge(chatTabBadgeKey(role), totalUnread);
  }, [syncTabBadge, role, data, totalUnread]);

  return {
    threads: data,
    error: query.error,
    loading: query.loading,
    refreshing: query.refreshing,
    refresh: query.refresh,
    reload: query.reload,
    totalUnread,
  };
}
