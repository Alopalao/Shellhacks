// State machine for one chat thread: initial load, "Load earlier" paging, optimistic sends with
// retry, live `message:new` / `message:read`, resync after reconnect/refocus, and mark-as-read.
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { api, errorMessage } from '@/lib/api';
import type { ChatMessage, MessageAttachment } from '@/lib/contracts';
import { useSocket, useSocketEvent } from '@/lib/socket';
import {
  CHAT_PAGE_SIZE,
  applyRead,
  createClientId,
  latestUnreadIncoming,
  mergeMessages,
  normalizeMessages,
  oldestSent,
  upsertMessage,
} from './messages';
import type { LocalMessage } from './types';

export interface ChatThreadState {
  messages: LocalMessage[];
  status: 'loading' | 'ready' | 'error';
  /** Error of the initial load (only meaningful while status === 'error'). */
  error: unknown;
  /** More (older) messages are available on the server. */
  hasMore: boolean;
  loadingEarlier: boolean;
  earlierError: unknown;
}

type Action =
  | { type: 'reset' }
  | { type: 'loaded'; messages: ChatMessage[]; me: string }
  | { type: 'loadFailed'; error: unknown }
  | { type: 'resynced'; messages: ChatMessage[]; me: string }
  | { type: 'earlierStart' }
  | { type: 'earlierLoaded'; messages: ChatMessage[]; me: string }
  | { type: 'earlierFailed'; error: unknown }
  | { type: 'received'; message: ChatMessage; me: string; clientId?: string }
  | { type: 'optimistic'; message: LocalMessage }
  | { type: 'sendFailed'; clientId: string; error: string }
  | { type: 'retrying'; clientId: string }
  | { type: 'discard'; clientId: string }
  /** `upTo`: only messages created at or before this time (local confirmation of our own POST /read). */
  | { type: 'read'; readerId: string; readAt: string; upTo?: string };

const initialState: ChatThreadState = {
  messages: [],
  status: 'loading',
  error: null,
  hasMore: false,
  loadingEarlier: false,
  earlierError: null,
};

function reducer(state: ChatThreadState, action: Action): ChatThreadState {
  switch (action.type) {
    case 'reset':
      return initialState;
    case 'loaded':
      return {
        ...state,
        // Keep anything that arrived live while the first page was loading.
        messages: mergeMessages(state.messages, action.messages, { me: action.me, reconcile: true }),
        status: 'ready',
        error: null,
        hasMore: action.messages.length >= CHAT_PAGE_SIZE,
      };
    case 'loadFailed':
      return state.status === 'ready' ? state : { ...state, status: 'error', error: action.error };
    case 'resynced':
      return {
        ...state,
        messages: mergeMessages(state.messages, action.messages, { me: action.me, reconcile: true }),
        status: 'ready',
        error: null,
        hasMore: state.status === 'ready' ? state.hasMore : action.messages.length >= CHAT_PAGE_SIZE,
      };
    case 'earlierStart':
      return { ...state, loadingEarlier: true, earlierError: null };
    case 'earlierLoaded':
      return {
        ...state,
        messages: mergeMessages(state.messages, action.messages, { me: action.me, reconcile: false }),
        loadingEarlier: false,
        hasMore: action.messages.length >= CHAT_PAGE_SIZE,
      };
    case 'earlierFailed':
      return { ...state, loadingEarlier: false, earlierError: action.error };
    case 'received':
      return {
        ...state,
        messages: normalizeMessages(
          upsertMessage(state.messages, action.message, {
            me: action.me,
            clientId: action.clientId,
            reconcile: true,
          }),
        ),
      };
    case 'optimistic':
      return { ...state, messages: [...state.messages, action.message] };
    case 'sendFailed':
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.clientId === action.clientId && m.status === 'pending' ? { ...m, status: 'failed', error: action.error } : m,
        ),
      };
    case 'retrying': {
      // Move the bubble to the end again: it is being (re)sent now.
      const target = state.messages.find((m) => m.clientId === action.clientId && m.status === 'failed');
      if (!target) return state;
      const rest = state.messages.filter((m) => m !== target);
      return {
        ...state,
        messages: [...rest, { ...target, status: 'pending', error: undefined, createdAt: new Date().toISOString() }],
      };
    }
    case 'discard':
      return {
        ...state,
        messages: state.messages.filter((m) => !(m.clientId === action.clientId && m.status !== 'sent')),
      };
    case 'read': {
      const messages = applyRead(state.messages, action.readerId, action.readAt, action.upTo);
      return messages === state.messages ? state : { ...state, messages };
    }
    default:
      return state;
  }
}

export interface UseChatThreadOptions {
  threadId: string;
  /** Signed-in user id. */
  me: string;
  /** The patient and doctor of this thread (needed to build optimistic messages). */
  patientId: string;
  doctorId: string;
  /** True while the conversation is on screen and the app is in the foreground → mark as read. */
  active: boolean;
}

export interface ChatThreadController extends ChatThreadState {
  /** Retry the initial load. */
  reload: () => void;
  /** Fetch the previous page (older messages). */
  loadEarlier: () => void;
  /** Send a message optimistically. Returns false when there is nothing to send. */
  send: (body: string, attachment?: MessageAttachment | null) => boolean;
  /** Re-send a failed message. */
  retry: (clientId: string) => void;
  /** Remove a failed message from the conversation. */
  discard: (clientId: string) => void;
}

const RESYNC_THROTTLE_MS = 2_000;

/** Everything a chat screen needs for one thread. */
export function useChatThread({ threadId, me, patientId, doctorId, active }: UseChatThreadOptions): ChatThreadController {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { connectCount } = useSocket();

  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  // Latest-value refs for async callbacks.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  });

  const lastSyncAt = useRef(0);
  const loadSeq = useRef(0);

  const load = useCallback(
    async (mode: 'initial' | 'resync') => {
      const seq = ++loadSeq.current;
      lastSyncAt.current = Date.now();
      try {
        const messages = await api.messages(threadId, { limit: CHAT_PAGE_SIZE });
        if (!alive.current || seq !== loadSeq.current) return;
        dispatch({ type: mode === 'initial' ? 'loaded' : 'resynced', messages, me });
      } catch (error) {
        if (!alive.current || seq !== loadSeq.current) return;
        if (mode === 'initial') dispatch({ type: 'loadFailed', error });
        // A failed background resync keeps what we have; the next reconnect/focus tries again.
      }
    },
    [threadId, me],
  );

  // Initial load (and reset when the thread changes).
  useEffect(() => {
    dispatch({ type: 'reset' });
    void load('initial');
  }, [load]);

  // Resync after a socket reconnect — events may have been missed while offline.
  const seenConnectCount = useRef(connectCount);
  useEffect(() => {
    const changed = connectCount !== seenConnectCount.current;
    seenConnectCount.current = connectCount;
    if (!changed || connectCount <= 1) return;
    void load(stateRef.current.status === 'ready' ? 'resync' : 'initial');
  }, [connectCount, load]);

  // Resync when the conversation becomes active again (screen refocus / app foreground).
  const wasActive = useRef(active);
  useEffect(() => {
    const becameActive = active && !wasActive.current;
    wasActive.current = active;
    if (!becameActive || stateRef.current.status !== 'ready') return;
    if (Date.now() - lastSyncAt.current < RESYNC_THROTTLE_MS) return;
    void load('resync');
  }, [active, load]);

  // Live events.
  useSocketEvent('message:new', (message) => {
    if (message.threadId !== threadId) return;
    dispatch({ type: 'received', message, me });
  });
  useSocketEvent('message:read', ({ threadId: id, readerId, readAt }) => {
    if (id !== threadId) return;
    dispatch({ type: 'read', readerId, readAt });
  });

  // Mark as read while active: on open, and whenever a new incoming message arrives.
  const unread = latestUnreadIncoming(state.messages, me);
  const unreadId = unread?.id ?? null;
  const unreadAt = unread?.createdAt ?? null;
  const markInFlight = useRef(false);
  const lastMarkedId = useRef<string | null>(null);
  // Bumped when a mark-read request settles so a message that arrived meanwhile gets marked too.
  const [markTick, setMarkTick] = useState(0);
  const shouldMark = active && state.status === 'ready' && unreadId !== null;
  useEffect(() => {
    if (!shouldMark || !unreadId || !unreadAt || markInFlight.current || lastMarkedId.current === unreadId) return;
    markInFlight.current = true;
    lastMarkedId.current = unreadId;
    api.markThreadRead(threadId).then(
      () => {
        markInFlight.current = false;
        if (!alive.current) return;
        // The server also emits `message:read`; this covers a momentarily disconnected socket.
        dispatch({ type: 'read', readerId: me, readAt: new Date().toISOString(), upTo: unreadAt });
        setMarkTick((t) => t + 1);
      },
      () => {
        // Try again on the next change (new message, refocus or reconnect) — not in a tight loop.
        markInFlight.current = false;
        lastMarkedId.current = null;
      },
    );
  }, [shouldMark, unreadId, unreadAt, threadId, me, connectCount, markTick]);

  const deliver = useCallback(
    async (clientId: string, body: string, attachment: MessageAttachment | null) => {
      try {
        const message = await api.sendMessage(threadId, { body, attachment });
        if (alive.current) dispatch({ type: 'received', message, me, clientId });
      } catch (error) {
        if (alive.current) {
          dispatch({ type: 'sendFailed', clientId, error: errorMessage(error, 'Message not sent.') });
        }
      }
    },
    [threadId, me],
  );

  const send = useCallback(
    (rawBody: string, attachment: MessageAttachment | null = null): boolean => {
      const body = rawBody.trim();
      if (!body) return false;
      const clientId = createClientId();
      dispatch({
        type: 'optimistic',
        message: {
          id: clientId,
          clientId,
          threadId,
          patientId,
          doctorId,
          senderId: me,
          body,
          attachment,
          createdAt: new Date().toISOString(),
          readAt: null,
          status: 'pending',
        },
      });
      void deliver(clientId, body, attachment);
      return true;
    },
    [threadId, patientId, doctorId, me, deliver],
  );

  const retry = useCallback(
    (clientId: string) => {
      const target = stateRef.current.messages.find((m) => m.clientId === clientId && m.status === 'failed');
      if (!target) return;
      dispatch({ type: 'retrying', clientId });
      void deliver(clientId, target.body, target.attachment);
    },
    [deliver],
  );

  const discard = useCallback((clientId: string) => dispatch({ type: 'discard', clientId }), []);

  const loadEarlier = useCallback(() => {
    const current = stateRef.current;
    if (!current.hasMore || current.loadingEarlier) return;
    const oldest = oldestSent(current.messages);
    if (!oldest) return;
    dispatch({ type: 'earlierStart' });
    api
      .messages(threadId, { limit: CHAT_PAGE_SIZE, before: oldest.createdAt })
      .then((messages) => {
        if (alive.current) dispatch({ type: 'earlierLoaded', messages, me });
      })
      .catch((error: unknown) => {
        if (alive.current) dispatch({ type: 'earlierFailed', error });
      });
  }, [threadId, me]);

  const reload = useCallback(() => {
    dispatch({ type: 'reset' });
    void load('initial');
  }, [load]);

  return { ...state, reload, loadEarlier, send, retry, discard };
}
