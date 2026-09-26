// BRIAN AI (patient) / Evidence AI (doctor) chat screen. Mounted by app/src/app/{patient,doctor}/ai/index.tsx.
//
// - Modes, attached context (visit note / medication / lesson) and deep-link params
//   (?prompt&mode&noteId&prescriptionId&drugName&lessonId&lessonTitle&autoSend=1&conversationId).
// - Answers render with triage banners, [n] citation chips linked to evidence cards, and disclaimers.
// - The current conversation is persisted per user (see conversationStore) and restored on return.
import { router, useFocusEffect, useIsFocused, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type TextInput,
} from 'react-native';
import { AppText, Button, EmergencyStrip, ErrorState, LoadingState, Screen } from '@/components/ui';
import { relatedLesson } from '@/features/lessons';
import { useApiQuery } from '@/hooks/useApiQuery';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { AiChatContext, AiConversation, AiMessage, AiMode, Role, VisitNote } from '@/lib/contracts';
import { firstName, truncate } from '@/lib/format';
import { useSocketEvent } from '@/lib/socket';
import { setTabBadge } from '@/lib/tab-badges';
import { getLesson, type Lesson } from '@/lessons';
import { colors, maxContentWidth, spacing } from '@/theme';
import { AiHeader } from './components/AiHeader';
import { AssistantMessage } from './components/AssistantMessage';
import { Composer } from './components/Composer';
import { ContextChips, type ContextChipItem, type ContextKind } from './components/ContextChips';
import { FailedTurnCard } from './components/FailedTurnCard';
import { ModeChips } from './components/ModeChips';
import { NotePicker } from './components/NotePicker';
import { RelatedLessonCard } from './components/RelatedLessonCard';
import { SuggestedPrompts } from './components/SuggestedPrompts';
import { ThinkingBubble } from './components/ThinkingBubble';
import { TrustPanel } from './components/TrustPanel';
import { UserBubble } from './components/UserBubble';
import { PERSONAS, defaultMode, isAiMode, modeOption, type AiPersona } from './config';
import { clearedAiParams, parseAiDeepLink, type AiRouteParams, type ParsedAiDeepLink } from './links';
import { useAiChat } from './useAiChat';
import { useAiStatus } from './useAiStatus';

/** Context attached to the next question, plus display-only labels. */
type AttachedContext = AiChatContext & { noteTitle?: string };

type ScrollTarget = { type: 'end' } | { type: 'message'; id: string } | null;

/** Top padding of the message list (the column's y inside the scroll content). */
const LIST_PADDING_TOP = spacing.lg;
/** Breathing room above a message/card we scroll to. */
const SCROLL_MARGIN = 12;
/** Attached-context chip labels are truncated to this many characters. */
const CHIP_LABEL_MAX = 24;

function modeForConversation(persona: AiPersona, conversation: AiConversation): AiMode {
  const lastUser = [...conversation.messages].reverse().find((m) => m.role === 'user');
  const mode = lastUser?.mode ?? conversation.mode;
  return isAiMode(mode) ? mode : defaultMode(persona);
}

function scrollTargetForConversation(conversation: AiConversation): ScrollTarget {
  const last = conversation.messages[conversation.messages.length - 1];
  if (!last) return null;
  // Long answers: show the start of the latest answer rather than its end.
  return last.role === 'assistant' ? { type: 'message', id: last.id } : { type: 'end' };
}

export interface AiChatScreenProps {
  role: Role;
}

export function AiChatScreen({ role }: AiChatScreenProps) {
  const persona = PERSONAS[role];
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const isFocused = useIsFocused();
  const rawParams = useLocalSearchParams<AiRouteParams>();
  const deepLink = useMemo(() => parseAiDeepLink(rawParams), [rawParams]);
  const ai = useAiStatus();

  const [mode, setMode] = useState<AiMode>(() => defaultMode(persona));
  const [context, setContext] = useState<AttachedContext>({});
  const [draft, setDraft] = useState('');

  const inputRef = useRef<TextInput | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);
  const messageY = useRef(new Map<string, number>());
  const scrollTarget = useRef<ScrollTarget>(null);
  const distanceFromBottom = useRef(0);
  const focusedRef = useRef(isFocused);
  const consumedLinkKey = useRef<string | null>(null);

  useEffect(() => {
    focusedRef.current = isFocused;
  }, [isFocused]);

  const chat = useAiChat({
    userId,
    onConversationLoaded: (conversation) => {
      setMode(modeForConversation(persona, conversation));
      setContext({});
      scrollTarget.current = scrollTargetForConversation(conversation);
    },
    onReply: (reply) => {
      scrollTarget.current = { type: 'message', id: reply.id };
      if (!focusedRef.current) setTabBadge(persona.tabBadgeKey, 1);
    },
  });

  // Clear the "new answer" tab badge whenever the chat is visible.
  useFocusEffect(
    useCallback(() => {
      setTabBadge(persona.tabBadgeKey, null);
    }, [persona.tabBadgeKey]),
  );

  // ───────────── Attached context: resolve display names ─────────────

  const wantsNotes = persona.canPickNotes && (mode === 'explain-note' || !!context.noteId);
  const notesQuery = useApiQuery(() => api.notes(), [userId], { enabled: wantsNotes && !!userId, keepPreviousData: true });
  const notes = notesQuery.data;
  useSocketEvent('note:new', (note: VisitNote) => {
    notesQuery.setData((prev) => (prev ? [note, ...prev.filter((n) => n.id !== note.id)] : prev));
  });

  const needsDrugName = role === 'patient' && !!context.prescriptionId && !context.drugName;
  const rxQuery = useApiQuery(() => api.prescriptions(), [userId], { enabled: needsDrugName && !!userId, refetchOnFocus: false });

  const attachedNote = context.noteId ? notes?.find((n) => n.id === context.noteId) : undefined;
  const noteTitle = context.noteTitle ?? attachedNote?.title;
  const drugName =
    context.drugName ?? (context.prescriptionId ? rxQuery.data?.find((p) => p.id === context.prescriptionId)?.drugName : undefined);
  const lessonTitle = context.lessonTitle ?? (context.lessonId ? getLesson(context.lessonId)?.title : undefined);

  // The chip icon tells the kind (note / medication / lesson), so labels stay short.
  const contextItems: ContextChipItem[] = [];
  if (context.noteId || context.noteText) {
    contextItems.push({
      kind: 'note',
      label: noteTitle ? truncate(noteTitle, CHIP_LABEL_MAX) : 'Visit note',
      icon: 'document-text-outline',
    });
  }
  if (context.prescriptionId || context.drugName) {
    contextItems.push({
      kind: 'medication',
      label: drugName ? truncate(drugName, CHIP_LABEL_MAX) : 'Medication',
      icon: 'medkit-outline',
    });
  }
  if (context.lessonId || context.lessonTitle) {
    contextItems.push({
      kind: 'lesson',
      label: lessonTitle ? truncate(lessonTitle, CHIP_LABEL_MAX) : 'Lesson',
      icon: 'school-outline',
    });
  }

  const removeContext = (kind: ContextKind) => {
    setContext((prev) => {
      const next = { ...prev };
      if (kind === 'note') {
        delete next.noteId;
        delete next.noteText;
        delete next.noteTitle;
      } else if (kind === 'medication') {
        delete next.prescriptionId;
        delete next.drugName;
      } else {
        delete next.lessonId;
        delete next.lessonTitle;
      }
      return next;
    });
  };

  /** What the server receives: ids plus the resolved names/text we already have. */
  const requestContext = (ctx: AttachedContext): AiChatContext => {
    const out: AiChatContext = {};
    if (ctx.noteId) out.noteId = ctx.noteId;
    const noteText = ctx.noteText ?? (ctx.noteId ? notes?.find((n) => n.id === ctx.noteId)?.body : undefined);
    if (noteText) out.noteText = noteText;
    if (ctx.prescriptionId) out.prescriptionId = ctx.prescriptionId;
    const drug = ctx.drugName ?? (ctx.prescriptionId ? rxQuery.data?.find((p) => p.id === ctx.prescriptionId)?.drugName : undefined);
    if (drug) out.drugName = drug;
    if (ctx.lessonId) out.lessonId = ctx.lessonId;
    const lesson = ctx.lessonTitle ?? (ctx.lessonId ? getLesson(ctx.lessonId)?.title : undefined);
    if (lesson) out.lessonTitle = lesson;
    return out;
  };

  const attachNote = (note: VisitNote) => {
    setContext((prev) => ({ ...prev, noteId: note.id, noteTitle: note.title, noteText: undefined }));
    setMode('explain-note');
    setDraft((prev) => (prev.trim() ? prev : 'Please explain this visit note in plain language.'));
  };

  // ───────────── Sending ─────────────

  const submit = async (text: string, overrides?: { mode?: AiMode; context?: AttachedContext }) => {
    const message = text.trim();
    if (!message) return;
    const sendMode = overrides?.mode ?? mode;
    let ctx = overrides?.context ?? context;
    // "Explain my note" without a note picked: use the most recent one.
    const latestNote = notes?.[0];
    if (persona.canPickNotes && sendMode === 'explain-note' && !ctx.noteId && !ctx.noteText && latestNote) {
      ctx = { ...ctx, noteId: latestNote.id, noteTitle: latestNote.title };
      setContext(ctx);
    }
    scrollTarget.current = { type: 'end' };
    if (Platform.OS !== 'web') Keyboard.dismiss();
    await chat.send(message, { mode: sendMode, context: requestContext(ctx) });
  };

  const sendDraft = () => {
    const text = draft.trim();
    if (!text || chat.pending) return;
    setDraft('');
    void submit(text);
  };

  const cancelPending = () => {
    const text = chat.cancel();
    if (text) setDraft((prev) => (prev.trim() ? prev : text));
    inputRef.current?.focus();
  };

  const editFailed = () => {
    const text = chat.dismissFailed();
    if (text) setDraft(text);
    inputRef.current?.focus();
  };

  const startNewChat = () => {
    chat.newChat();
    setContext({});
    messageY.current.clear();
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  // ───────────── Deep links (consumed once, then cleared) ─────────────

  const consumeDeepLink = useEffectEvent((link: ParsedAiDeepLink) => {
    router.setParams(clearedAiParams());
    if (link.conversationId && !link.startsNewTopic) {
      chat.openConversation(link.conversationId);
      return;
    }
    const nextMode = link.mode ?? (link.startsNewTopic ? defaultMode(persona) : mode);
    setMode(nextMode);
    if (!link.startsNewTopic) return;
    if (chat.conversation || chat.pending || chat.failed || chat.loading) startNewChat();
    const nextContext: AttachedContext = { ...link.context };
    setContext(nextContext);
    if (link.prompt && link.autoSend) {
      void submit(link.prompt, { mode: nextMode, context: nextContext });
    } else if (link.prompt) {
      setDraft(link.prompt);
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  });

  useEffect(() => {
    if (!deepLink) {
      consumedLinkKey.current = null;
      return;
    }
    if (!chat.ready || !isFocused || consumedLinkKey.current === deepLink.key) return;
    consumedLinkKey.current = deepLink.key;
    consumeDeepLink(deepLink);
  }, [deepLink, chat.ready, isFocused]);

  // ───────────── Scrolling ─────────────

  const scrollToY = (y: number) => {
    scrollRef.current?.scrollTo({ y: Math.max(0, y - SCROLL_MARGIN), animated: true });
  };

  const handleMessageLayout = (id: string, event: LayoutChangeEvent) => {
    const y = event.nativeEvent.layout.y;
    messageY.current.set(id, y);
    const target = scrollTarget.current;
    if (target?.type === 'message' && target.id === id) {
      scrollTarget.current = null;
      scrollToY(LIST_PADDING_TOP + y);
    }
  };

  const handleContentSizeChange = () => {
    if (scrollTarget.current?.type === 'end') scrollRef.current?.scrollToEnd({ animated: true });
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    distanceFromBottom.current = contentSize.height - (contentOffset.y + layoutMeasurement.height);
  };

  // Keep the latest message visible when the keyboard opens (native).
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const sub = Keyboard.addListener('keyboardDidShow', () => {
      if (distanceFromBottom.current < 160) scrollRef.current?.scrollToEnd({ animated: true });
    });
    return () => sub.remove();
  }, []);

  // ───────────── Render ─────────────

  const option = modeOption(persona, mode);
  const busy = !!chat.pending;
  const isEmpty = !chat.messages.length && !chat.pending && !chat.failed;
  const showNotePicker =
    persona.canPickNotes && mode === 'explain-note' && !context.noteId && !context.noteText && !busy && !chat.loading;
  const composerDisabled = !chat.ready || chat.loading || !userId;

  // Patients get a "Related BRIAN lesson" under answers whose question matches a lesson's topic
  // (not for lesson follow-ups, which came from that lesson, nor under emergency guidance).
  const relatedByAnswer = new Map<string, Lesson>();
  if (role === 'patient') {
    let question: AiMessage | null = null;
    for (const m of chat.messages) {
      if (m.role === 'user') {
        question = m;
        continue;
      }
      if (!question || question.mode === 'lesson' || m.triage?.level === 'emergency') continue;
      const lesson = relatedLesson(question.content);
      if (lesson) relatedByAnswer.set(m.id, lesson);
    }
  }

  const renderMessage = (message: AiMessage) => (
    <View key={message.id} onLayout={(e) => handleMessageLayout(message.id, e)}>
      {message.role === 'user' ? (
        <UserBubble
          message={message}
          modeOption={message.mode && message.mode !== defaultMode(persona) ? modeOption(persona, message.mode) : null}
        />
      ) : (
        <AssistantMessage
          message={message}
          assistantName={persona.assistantName}
          disclaimer={persona.answerDisclaimer}
          onRequestScroll={(localY) => {
            const top = messageY.current.get(message.id);
            if (top !== undefined) scrollToY(LIST_PADDING_TOP + top + localY);
          }}
        />
      )}
      {message.role === 'assistant' ? <RelatedLesson lesson={relatedByAnswer.get(message.id)} /> : null}
    </View>
  );

  const pendingModeOption = (m: AiMessage) =>
    m.mode && m.mode !== defaultMode(persona) ? modeOption(persona, m.mode) : null;

  let body: ReactNode;
  if (!userId || !chat.ready || (chat.loading && !chat.messages.length && !busy)) {
    body = <LoadingState label={chat.ready ? 'Opening your conversation…' : 'Loading…'} />;
  } else if (chat.loadError && !chat.conversation) {
    body = (
      <View style={styles.errorWrap}>
        <ErrorState error={chat.loadError} title="Couldn't open this conversation" onRetry={chat.reloadConversation} />
        <Button title="Start a new chat" variant="outline" icon="add" onPress={startNewChat} style={styles.center} />
      </View>
    );
  } else {
    body = (
      <ScrollView
        ref={scrollRef}
        style={styles.flex}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        showsVerticalScrollIndicator={Platform.OS === 'web'}
        onContentSizeChange={handleContentSizeChange}
        onScroll={handleScroll}
        scrollEventThrottle={100}
      >
        <View style={styles.column}>
          {isEmpty ? (
            <>
              <View style={styles.welcome}>
                <AppText variant="title2">
                  {role === 'patient' && user ? `Hi ${firstName(user.name)} — ${persona.welcomeTitle.toLowerCase()}` : persona.welcomeTitle}
                </AppText>
                <AppText variant="body" tone="muted">
                  {persona.welcomeText}
                </AppText>
              </View>
              <TrustPanel text={persona.trustText} />
            </>
          ) : null}

          {chat.messages.map(renderMessage)}

          {chat.pending ? (
            <>
              <UserBubble
                message={chat.pending.userMessage}
                modeOption={pendingModeOption(chat.pending.userMessage)}
                status="sending"
              />
              <ThinkingBubble
                startedAt={chat.pending.startedAt}
                assistantName={persona.assistantName}
                onCancel={cancelPending}
              />
            </>
          ) : null}

          {chat.failed ? (
            <>
              <UserBubble
                message={chat.failed.userMessage}
                modeOption={pendingModeOption(chat.failed.userMessage)}
                status="failed"
              />
              <FailedTurnCard
                error={chat.failed.error}
                role={role}
                assistantName={persona.assistantName}
                onRetry={() => {
                  scrollTarget.current = { type: 'end' };
                  void chat.retry();
                }}
                onEdit={editFailed}
              />
            </>
          ) : null}

          {showNotePicker ? (
            <NotePicker
              notes={notes}
              loading={notesQuery.loading}
              error={notesQuery.error}
              onRetry={() => void notesQuery.refresh()}
              onSelect={attachNote}
            />
          ) : null}

          {isEmpty ? (
            <SuggestedPrompts
              prompts={option.prompts}
              onSelect={(prompt) => void submit(prompt)}
              disabled={composerDisabled}
              title={`Try asking · ${option.label}`}
            />
          ) : null}

          {isEmpty && role === 'patient' ? (
            <EmergencyStrip compact title="Emergency? Don't wait for an AI — call now" />
          ) : null}
        </View>
      </ScrollView>
    );
  }

  const header = (
    <View style={styles.headerWrap}>
      <View style={styles.headerColumn}>
        <AiHeader
          persona={persona}
          status={ai.status}
          statusLoading={ai.loading}
          onHistory={() => router.push(persona.historyHref)}
          onNewChat={startNewChat}
          newChatDisabled={isEmpty && !contextItems.length && !chat.conversationId}
        />
        <ModeChips persona={persona} value={mode} onChange={setMode} disabled={busy} />
      </View>
    </View>
  );

  const footer = (
    <View style={styles.footerWrap}>
      <View style={styles.footerColumn}>
        <Composer
          value={draft}
          onChangeText={setDraft}
          onSend={sendDraft}
          placeholder={option.placeholder}
          pending={busy}
          disabled={composerDisabled}
          note={persona.composerNote}
          inputRef={inputRef}
          top={<ContextChips items={contextItems} onRemove={removeContext} disabled={busy} />}
        />
      </View>
    </View>
  );

  return (
    <Screen scroll={false} padded={false} maxWidth={null} gap="none" header={header} footer={footer}>
      {body}
    </Screen>
  );
}

function RelatedLesson({ lesson }: { lesson: Lesson | undefined }) {
  return lesson ? <RelatedLessonCard lesson={lesson} /> : null;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignSelf: 'center' },
  headerWrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerColumn: { width: '100%', maxWidth: maxContentWidth, alignSelf: 'center', gap: spacing.xs },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: LIST_PADDING_TOP,
    paddingBottom: spacing.xl,
  },
  column: { width: '100%', maxWidth: maxContentWidth, alignSelf: 'center', gap: spacing.lg },
  welcome: { gap: spacing.xs },
  errorWrap: { flex: 1, justifyContent: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg },
  footerWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
  footerColumn: { width: '100%', maxWidth: maxContentWidth, alignSelf: 'center' },
});
