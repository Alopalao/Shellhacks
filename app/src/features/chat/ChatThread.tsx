// The real-time conversation used by both roles (patient ↔ their doctor).
// Inverted FlatList (newest at the bottom, stays anchored), optimistic sends with retry,
// live receipts / typing / presence, "Load earlier" paging and a keyboard-aware composer.
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused, type Href } from 'expo-router';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type ListRenderItem,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, Avatar, Button, Chip, Disclaimer, ErrorState, LoadingState } from '@/components/ui';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useNow } from '@/hooks/useInterval';
import { errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Thread } from '@/lib/contracts';
import { displayName } from '@/lib/format';
import { useSocketEvent } from '@/lib/socket';
import { colors, maxContentWidth, radius, spacing } from '@/theme';
import { ChatHeader } from './ChatHeader';
import { Composer } from './Composer';
import { DaySeparator } from './DaySeparator';
import { MessageBubble } from './MessageBubble';
import { buildRows, messageKey, shortName } from './messages';
import { TypingIndicator } from './TypingIndicator';
import type { ChatRow } from './types';
import { useAttachmentLookup } from './useAttachmentLookup';
import { useChatThread } from './useChatThread';
import { useAppActive, useRealtimeOffline } from './useConnectivity';
import { usePresenceDetails } from './usePresenceDetails';
import { useTypingEmitter, useTypingThreads } from './useTyping';

/** Scrolled further than this from the newest message → show the "jump to latest" pill. */
const SCROLLED_UP_PX = 240;

export const CHAT_EMERGENCY_NOTE =
  'Messages are for non-urgent questions and may not be answered right away. In an emergency, call 911.';

const PATIENT_STARTERS = ['Question about my medication', 'Can we schedule a follow-up?', 'My symptoms have changed'];
const DOCTOR_STARTERS = ['How are you feeling today?', 'Your lab results are in.', 'Please keep logging your doses.'];

export interface ChatThreadProps {
  thread: Thread;
  /** Back target when the stack can't go back (deep link / web refresh). */
  backHref: Href;
  /** Extra header actions (e.g. the doctor's "open chart" button). */
  headerRight?: ReactNode;
  /** Makes the header identity tappable. */
  onPressCounterpart?: () => void;
  counterpartHint?: string;
  /** Prefill the composer. */
  initialDraft?: string;
  /** Focus the composer on open. */
  autoFocus?: boolean;
}

/** Full-screen conversation. Render with `key={thread.id}` so switching threads starts fresh. */
export function ChatThread({
  thread,
  backHref,
  headerRight,
  onPressCounterpart,
  counterpartHint,
  initialDraft,
  autoFocus,
}: ChatThreadProps) {
  const { user } = useAuth();
  const me = user?.id ?? '';
  const viewerRole = user?.role ?? 'patient';
  const counterpart = thread.counterpart;
  const counterpartName = displayName(counterpart);
  const { isWide } = useBreakpoint();

  const isFocused = useIsFocused();
  const appActive = useAppActive();
  const chat = useChatThread({
    threadId: thread.id,
    me,
    patientId: thread.patientId,
    doctorId: thread.doctorId,
    active: isFocused && appActive,
  });
  const presence = usePresenceDetails(counterpart.id);
  const typing = !!useTypingThreads(me)[thread.id];
  const offline = useRealtimeOffline();
  const lookup = useAttachmentLookup({ viewerRole, patientId: thread.patientId, messages: chat.messages });
  const typingEmitter = useTypingEmitter(thread.id);
  const now = useNow(60_000);

  const [draft, setDraft] = useState(initialDraft ?? '');
  const listRef = useRef<FlatList<ChatRow>>(null);
  const inputRef = useRef<TextInput>(null);
  const [scrolledUp, setScrolledUp] = useState(false);
  const [newBelow, setNewBelow] = useState(0);

  const rows = useMemo(() => buildRows(chat.messages, me, now).reverse(), [chat.messages, me, now]);

  // Leaving the screen stops our typing indicator on the other side.
  const stopTyping = typingEmitter.stop;
  useEffect(() => {
    if (!isFocused) stopTyping();
  }, [isFocused, stopTyping]);

  const scrollToLatest = (animated = true) => {
    listRef.current?.scrollToOffset({ offset: 0, animated });
    setNewBelow(0);
  };

  // Keep the newest message in view unless the user scrolled up to read history.
  const newest = chat.messages[chat.messages.length - 1];
  const newestKey = newest ? messageKey(newest) : null;
  const scrolledUpRef = useRef(scrolledUp);
  useEffect(() => {
    scrolledUpRef.current = scrolledUp;
  }, [scrolledUp]);
  useEffect(() => {
    if (newestKey && !scrolledUpRef.current) listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [newestKey]);

  useSocketEvent('message:new', (message) => {
    if (message.threadId === thread.id && message.senderId !== me && scrolledUpRef.current) {
      setNewBelow((n) => n + 1);
    }
  });

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const up = e.nativeEvent.contentOffset.y > SCROLLED_UP_PX;
    if (up !== scrolledUp) setScrolledUp(up);
    if (!up && newBelow) setNewBelow(0);
  };

  const handleChange = (text: string) => {
    setDraft(text);
    typingEmitter.onTextChange(text);
  };

  const handleSend = () => {
    if (offline) return;
    if (!chat.send(draft)) return;
    setDraft('');
    typingEmitter.stop();
    scrollToLatest(true);
  };

  const applyStarter = (text: string) => {
    handleChange(text);
    inputRef.current?.focus();
  };

  const renderRow: ListRenderItem<ChatRow> = ({ item }) =>
    item.type === 'day' ? (
      <DaySeparator label={item.label} />
    ) : (
      <MessageBubble
        row={item}
        counterpartName={counterpartName}
        viewerRole={viewerRole}
        patientId={thread.patientId}
        lookup={lookup}
        onRetry={chat.retry}
        onDiscard={chat.discard}
      />
    );

  const threadStart = (
    <View style={styles.threadStart}>
      {chat.hasMore ? (
        <View style={styles.loadEarlier}>
          <Button
            title={chat.earlierError ? 'Try loading earlier messages again' : 'Load earlier messages'}
            icon="time-outline"
            variant="outline"
            size="sm"
            loading={chat.loadingEarlier}
            onPress={chat.loadEarlier}
          />
          {chat.earlierError ? (
            <AppText variant="caption" tone="danger" align="center">
              {errorMessage(chat.earlierError)}
            </AppText>
          ) : null}
        </View>
      ) : (
        <View style={styles.startInfo}>
          <Avatar user={counterpart} size={56} />
          <AppText variant="small" tone="muted" align="center">
            This is the start of your conversation with {counterpartName}.
          </AppText>
          {viewerRole === 'patient' ? <Disclaimer compact text={CHAT_EMERGENCY_NOTE} style={styles.startNote} /> : null}
        </View>
      )}
    </View>
  );

  let body: ReactNode;
  if (chat.status === 'loading') {
    body = <LoadingState label="Loading messages…" />;
  } else if (chat.status === 'error') {
    body = <ErrorState error={chat.error} title="Couldn't load messages" onRetry={chat.reload} />;
  } else if (chat.messages.length === 0 && !typing) {
    const starters = viewerRole === 'doctor' ? DOCTOR_STARTERS : PATIENT_STARTERS;
    body = (
      <View style={styles.empty}>
        <Avatar user={counterpart} size={72} online={presence.online} />
        <AppText variant="title3" align="center">
          {viewerRole === 'doctor'
            ? `No messages with ${counterpart.name} yet`
            : `Start a conversation with ${counterpartName}`}
        </AppText>
        <AppText tone="muted" align="center" style={styles.emptyText}>
          {viewerRole === 'doctor'
            ? 'Check in, share results, or answer a question. They will see it instantly.'
            : 'Ask about your medicines, share how you are feeling, or follow up on a visit.'}
        </AppText>
        <View style={styles.starters}>
          {starters.map((text) => (
            <Chip key={text} label={text} onPress={() => applyStarter(text)} icon="chatbubble-outline" disabled={offline} />
          ))}
        </View>
        {viewerRole === 'patient' ? <Disclaimer compact text={CHAT_EMERGENCY_NOTE} style={styles.startNote} /> : null}
      </View>
    );
  } else {
    body = (
      <FlatList
        ref={listRef}
        inverted
        data={rows}
        keyExtractor={(row) => row.key}
        renderItem={renderRow}
        ListHeaderComponent={typing ? <TypingIndicator name={counterpartName} /> : null}
        ListFooterComponent={threadStart}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        onScroll={handleScroll}
        scrollEventThrottle={64}
        initialNumToRender={24}
        maxToRenderPerBatch={24}
        windowSize={11}
        showsVerticalScrollIndicator={Platform.OS === 'web'}
        accessibilityLabel={`Conversation with ${counterpartName}`}
      />
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'web' ? undefined : 'padding'}
        enabled={Platform.OS !== 'web'}
      >
        <View style={[styles.column, isWide && styles.columnWide]}>
          <ChatHeader
            counterpart={counterpart}
            online={presence.online}
            lastSeen={presence.lastSeen}
            typing={typing}
            backHref={backHref}
            right={headerRight}
            onPressCounterpart={onPressCounterpart}
            counterpartHint={counterpartHint}
          />
          <View style={styles.body}>
            {body}
            {scrolledUp && chat.status === 'ready' ? (
              <Pressable
                onPress={() => scrollToLatest(true)}
                hitSlop={4}
                accessibilityRole="button"
                accessibilityLabel={newBelow ? `${newBelow} new ${newBelow === 1 ? 'message' : 'messages'}. Jump to latest` : 'Jump to latest message'}
                style={({ pressed }) => [styles.jump, pressed && styles.jumpPressed]}
              >
                <Ionicons name="arrow-down" size={16} color={colors.textOnBlack} />
                <AppText variant="label" tone="inverse">
                  {newBelow ? `${newBelow} new ${newBelow === 1 ? 'message' : 'messages'}` : 'Latest'}
                </AppText>
              </Pressable>
            ) : null}
          </View>
          {offline ? (
            <View style={styles.offline} accessibilityRole="alert" accessibilityLiveRegion="polite">
              <ActivityIndicator size="small" color={colors.text} />
              <AppText variant="small" style={styles.flex}>
                Reconnecting to BRIAN… You can send messages again once you're back online.
              </AppText>
            </View>
          ) : null}
          <Composer
            inputRef={inputRef}
            value={draft}
            onChangeText={handleChange}
            onSend={handleSend}
            onBlur={stopTyping}
            disabled={offline}
            autoFocus={autoFocus}
            placeholder={offline ? 'Waiting for connection…' : `Message ${shortName(counterpart)}`}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  column: { flex: 1, width: '100%', maxWidth: maxContentWidth, alignSelf: 'center', backgroundColor: colors.white },
  columnWide: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.border },
  body: { flex: 1 },
  listContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  threadStart: { paddingTop: spacing.lg, paddingBottom: spacing.sm },
  loadEarlier: { alignItems: 'center', gap: spacing.xs },
  startInfo: { alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg },
  startNote: { maxWidth: 420 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  emptyText: { maxWidth: 420 },
  starters: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  jump: {
    position: 'absolute',
    bottom: spacing.md,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 40,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.black,
  },
  jumpPressed: { opacity: 0.85 },
  offline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.yellowLight,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.yellowBorder,
  },
});
