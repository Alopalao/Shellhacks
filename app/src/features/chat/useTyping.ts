// Typing indicators over the socket: a throttled emitter for the composer and a per-thread map of
// "the other person is typing" for headers and thread lists.
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSocket, useSocketEvent } from '@/lib/socket';

/** Re-send `isTyping: true` at most this often while the user keeps typing. */
const TYPING_THROTTLE_MS = 2_000;
/** Send `isTyping: false` after this much idle time. */
const TYPING_IDLE_MS = 3_000;
/** Hide a remote typing indicator if no refresh arrives within this window (lost stop event). */
const REMOTE_TYPING_TIMEOUT_MS = 6_000;

export interface TypingEmitter {
  /** Call on every text change. Empty text stops the indicator. */
  onTextChange: (text: string) => void;
  /** Stop immediately (on send, blur, unmount). */
  stop: () => void;
}

/** Emits `typing` for `threadId`: throttled while typing, auto-stops after ~3 s idle. */
export function useTypingEmitter(threadId: string): TypingEmitter {
  const { socket } = useSocket();
  const socketRef = useRef(socket);
  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);

  const typing = useRef(false);
  const lastEmitAt = useRef(0);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const emit = useCallback(
    (isTyping: boolean) => {
      const s = socketRef.current;
      if (s?.connected) s.emit('typing', { threadId, isTyping });
    },
    [threadId],
  );

  const stop = useCallback(() => {
    if (idleTimer.current) {
      clearTimeout(idleTimer.current);
      idleTimer.current = null;
    }
    if (typing.current) {
      typing.current = false;
      emit(false);
    }
  }, [emit]);

  const onTextChange = useCallback(
    (text: string) => {
      if (!text.trim()) {
        stop();
        return;
      }
      const now = Date.now();
      if (!typing.current || now - lastEmitAt.current >= TYPING_THROTTLE_MS) {
        typing.current = true;
        lastEmitAt.current = now;
        emit(true);
      }
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(stop, TYPING_IDLE_MS);
    },
    [emit, stop],
  );

  // Never leave the other side stuck on "typing…".
  useEffect(() => stop, [stop]);

  return { onTextChange, stop };
}

/**
 * `{ [threadId]: true }` while the *other* participant of that thread is typing.
 * Clears on a stop event, on their next message, after a timeout, and when the socket drops.
 */
export function useTypingThreads(me: string | null | undefined): Readonly<Record<string, boolean>> {
  const { connected } = useSocket();
  const [typing, setTyping] = useState<Record<string, boolean>>({});
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const clear = useCallback((threadId: string) => {
    const timer = timers.current.get(threadId);
    if (timer) clearTimeout(timer);
    timers.current.delete(threadId);
    setTyping((prev) => {
      if (!prev[threadId]) return prev;
      const next = { ...prev };
      delete next[threadId];
      return next;
    });
  }, []);

  useSocketEvent('typing', ({ threadId, userId, isTyping }) => {
    if (!me || userId === me) return;
    if (!isTyping) {
      clear(threadId);
      return;
    }
    const existing = timers.current.get(threadId);
    if (existing) clearTimeout(existing);
    timers.current.set(
      threadId,
      setTimeout(() => clear(threadId), REMOTE_TYPING_TIMEOUT_MS),
    );
    setTyping((prev) => (prev[threadId] ? prev : { ...prev, [threadId]: true }));
  });

  useSocketEvent('message:new', (message) => {
    if (message.senderId !== me) clear(message.threadId);
  });

  useEffect(() => {
    if (connected) return;
    timers.current.forEach((t) => clearTimeout(t));
    timers.current.clear();
    setTyping((prev) => (Object.keys(prev).length ? {} : prev));
  }, [connected]);

  useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach((t) => clearTimeout(t));
      map.clear();
    };
  }, []);

  return typing;
}
