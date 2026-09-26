// Conversation state for the AI chat: restore the current conversation, send turns (optimistic user
// message + pending state), cancel, retry, switch/new conversations. Screen-agnostic.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { api, isApiRequestError } from '@/lib/api';
import type { AiChatContext, AiChatRequest, AiConversation, AiMessage, AiMode } from '@/lib/contracts';
import { getCurrentConversationId, setCurrentConversationId, useCurrentConversationId } from './conversationStore';

/** Result of `send` / `retry`. `stale` = the chat was reset or switched while waiting. */
export type SendOutcome = 'sent' | 'error' | 'aborted' | 'stale' | 'skipped';

export interface PendingTurn {
  id: string;
  request: AiChatRequest;
  /** Optimistic copy of the user's message (shown until the server returns the conversation). */
  userMessage: AiMessage;
  /** Date.now() when the request started (drives the staged progress text). */
  startedAt: number;
}

export interface FailedTurn {
  id: string;
  request: AiChatRequest;
  userMessage: AiMessage;
  error: unknown;
}

export interface SendOptions {
  mode: AiMode;
  context?: AiChatContext;
}

export interface UseAiChatOptions {
  userId: string | null;
  /** Called after an existing conversation has been loaded (e.g. to restore its mode). */
  onConversationLoaded?: (conversation: AiConversation) => void;
  /** Called when an answer arrives. */
  onReply?: (reply: AiMessage, conversation: AiConversation) => void;
}

export interface UseAiChatResult {
  /** False until the saved conversation id has been read from storage. */
  ready: boolean;
  /** Id of the current conversation (null = new chat). */
  conversationId: string | null;
  conversation: AiConversation | null;
  /** Server-confirmed messages (the optimistic message lives in `pending` / `failed`). */
  messages: AiMessage[];
  /** Loading an existing conversation. */
  loading: boolean;
  loadError: unknown;
  pending: PendingTurn | null;
  failed: FailedTurn | null;
  /** Id of the most recent answer received in this session (for scroll-to-answer). */
  lastReplyId: string | null;
  send: (text: string, options: SendOptions) => Promise<SendOutcome>;
  retry: () => Promise<SendOutcome>;
  /** Abort the in-flight question. Resolves its text so the composer can restore it. */
  cancel: () => string | null;
  /** Drop the failed question. Resolves its text so the composer can restore it. */
  dismissFailed: () => string | null;
  newChat: () => void;
  openConversation: (id: string) => void;
  reloadConversation: () => void;
}

const EMPTY: AiMessage[] = [];

function isAborted(error: unknown): boolean {
  return isApiRequestError(error) && error.kind === 'aborted';
}

function localId(): string {
  return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Drop empty fields so the server only sees real context. */
export function cleanContext(context: AiChatContext | undefined): AiChatContext | undefined {
  if (!context) return undefined;
  const out: AiChatContext = {};
  for (const [key, value] of Object.entries(context) as [keyof AiChatContext, string | undefined][]) {
    if (typeof value === 'string' && value.trim()) out[key] = value;
  }
  return Object.keys(out).length ? out : undefined;
}

/** The server returns the whole conversation; make sure the reply is part of it. */
function withReply(conversation: AiConversation, reply: AiMessage): AiConversation {
  if (conversation.messages.some((m) => m.id === reply.id)) return conversation;
  return { ...conversation, messages: [...conversation.messages, reply] };
}

export function useAiChat({ userId, onConversationLoaded, onReply }: UseAiChatOptions): UseAiChatResult {
  const stored = useCurrentConversationId(userId);

  const [conversation, setConversation] = useState<AiConversation | null>(null);
  const [loadingState, setLoadingState] = useState(false);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [pending, setPending] = useState<PendingTurn | null>(null);
  const [failed, setFailed] = useState<FailedTurn | null>(null);
  const [lastReplyId, setLastReplyId] = useState<string | null>(null);

  const conversationRef = useRef<AiConversation | null>(null);
  const pendingRef = useRef<PendingTurn | null>(null);
  const failedRef = useRef<FailedTurn | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  /** Bumped whenever the chat is reset or switched; late responses from older sessions are ignored. */
  const sessionRef = useRef(0);
  const loadRequestRef = useRef(0);
  const loadingRef = useRef(false);
  const mountedRef = useRef(true);
  const latest = useRef({ userId, onConversationLoaded, onReply });
  useLayoutEffect(() => {
    latest.current = { userId, onConversationLoaded, onReply };
  });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  const applyConversation = useCallback((next: AiConversation | null) => {
    conversationRef.current = next;
    setConversation(next);
  }, []);

  const applyPending = useCallback((next: PendingTurn | null) => {
    pendingRef.current = next;
    setPending(next);
  }, []);

  const applyFailed = useCallback((next: FailedTurn | null) => {
    failedRef.current = next;
    setFailed(next);
  }, []);

  const applyLoading = useCallback((next: boolean) => {
    loadingRef.current = next;
    setLoadingState(next);
  }, []);

  /** Forget everything local (in-flight request, failed turn, loaded conversation). */
  const resetLocal = useCallback(() => {
    sessionRef.current += 1;
    loadRequestRef.current += 1;
    abortRef.current?.abort();
    abortRef.current = null;
    applyPending(null);
    applyFailed(null);
    applyConversation(null);
    applyLoading(false);
    setLoadError(null);
    setLastReplyId(null);
  }, [applyConversation, applyFailed, applyLoading, applyPending]);

  const load = useCallback(
    async (id: string) => {
      resetLocal();
      const request = loadRequestRef.current;
      applyLoading(true);
      try {
        const loaded = await api.aiConversation(id);
        if (!mountedRef.current || request !== loadRequestRef.current) return;
        applyConversation(loaded);
        latest.current.onConversationLoaded?.(loaded);
      } catch (error) {
        if (!mountedRef.current || request !== loadRequestRef.current) return;
        if (isApiRequestError(error) && (error.status === 404 || error.status === 403)) {
          // Deleted (or not ours): fall back to a fresh chat.
          const uid = latest.current.userId;
          if (uid) setCurrentConversationId(uid, null);
        } else {
          setLoadError(error);
        }
      } finally {
        if (mountedRef.current && request === loadRequestRef.current) applyLoading(false);
      }
    },
    [applyConversation, applyLoading, resetLocal],
  );

  // Follow the persisted "current conversation" (restored on launch, changed by history / new chat).
  useEffect(() => {
    if (!stored.ready) return;
    const currentId = conversationRef.current?.id ?? null;
    if (stored.id === currentId) return;
    if (stored.id) void load(stored.id);
    else resetLocal();
  }, [stored.ready, stored.id, load, resetLocal]);

  const runTurn = useCallback(
    async function run(request: AiChatRequest, userMessage: AiMessage): Promise<SendOutcome> {
      const session = sessionRef.current;
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const turn: PendingTurn = { id: userMessage.id, request, userMessage, startedAt: Date.now() };
      applyPending(turn);
      applyFailed(null);
      setLastReplyId(null);
      try {
        const response = await api.aiChat(request, controller.signal);
        if (!mountedRef.current || session !== sessionRef.current || pendingRef.current !== turn) return 'stale';
        const next = withReply(response.conversation, response.reply);
        applyConversation(next);
        setLastReplyId(response.reply.id);
        const uid = latest.current.userId;
        if (uid) setCurrentConversationId(uid, next.id);
        latest.current.onReply?.(response.reply, next);
        return 'sent';
      } catch (error) {
        if (isAborted(error)) return 'aborted';
        if (!mountedRef.current || session !== sessionRef.current || pendingRef.current !== turn) return 'stale';
        // The conversation was deleted elsewhere: carry the question over to a fresh conversation.
        if (request.conversationId && isApiRequestError(error) && error.status === 404) {
          sessionRef.current += 1;
          applyConversation(null);
          const uid = latest.current.userId;
          if (uid) setCurrentConversationId(uid, null);
          const { conversationId: _dropped, ...rest } = request;
          return run(rest, userMessage);
        }
        applyFailed({ id: userMessage.id, request, userMessage, error });
        return 'error';
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
        if (pendingRef.current === turn) applyPending(null);
      }
    },
    [applyConversation, applyFailed, applyPending],
  );

  const send = useCallback(
    async (text: string, options: SendOptions): Promise<SendOutcome> => {
      const message = text.trim();
      if (!message || pendingRef.current || loadingRef.current) return 'skipped';
      const request: AiChatRequest = { message, mode: options.mode };
      const conversationId = conversationRef.current?.id;
      if (conversationId) request.conversationId = conversationId;
      const context = cleanContext(options.context);
      if (context) request.context = context;
      const userMessage: AiMessage = {
        id: localId(),
        role: 'user',
        content: message,
        createdAt: new Date().toISOString(),
        mode: options.mode,
      };
      return runTurn(request, userMessage);
    },
    [runTurn],
  );

  const retry = useCallback(async (): Promise<SendOutcome> => {
    const turn = failedRef.current;
    if (!turn || pendingRef.current) return 'skipped';
    const conversationId = conversationRef.current?.id ?? turn.request.conversationId;
    const request: AiChatRequest = { ...turn.request };
    if (conversationId) request.conversationId = conversationId;
    return runTurn(request, { ...turn.userMessage, createdAt: new Date().toISOString() });
  }, [runTurn]);

  const cancel = useCallback((): string | null => {
    const turn = pendingRef.current;
    if (!turn) return null;
    abortRef.current?.abort();
    abortRef.current = null;
    applyPending(null);
    return turn.userMessage.content;
  }, [applyPending]);

  const dismissFailed = useCallback((): string | null => {
    const turn = failedRef.current;
    if (!turn) return null;
    applyFailed(null);
    return turn.userMessage.content;
  }, [applyFailed]);

  const newChat = useCallback(() => {
    resetLocal();
    const uid = latest.current.userId;
    if (uid) setCurrentConversationId(uid, null);
  }, [resetLocal]);

  const openConversation = useCallback(
    (id: string) => {
      const uid = latest.current.userId;
      if (!uid) return;
      if (getCurrentConversationId(uid) === id) {
        if (conversationRef.current?.id !== id) void load(id);
        return;
      }
      setCurrentConversationId(uid, id);
    },
    [load],
  );

  const reloadConversation = useCallback(() => {
    const uid = latest.current.userId;
    const id = uid ? getCurrentConversationId(uid) : null;
    if (id) void load(id);
  }, [load]);

  // Until the stored conversation is loaded, report "loading" (avoids an empty-state flash on launch).
  const restoring = stored.ready && !!stored.id && conversation?.id !== stored.id && !loadError;

  return {
    ready: stored.ready,
    conversationId: stored.id,
    conversation,
    messages: conversation?.messages ?? EMPTY,
    loading: loadingState || restoring,
    loadError,
    pending,
    failed,
    lastReplyId,
    send,
    retry,
    cancel,
    dismissFailed,
    newChat,
    openConversation,
    reloadConversation,
  };
}
