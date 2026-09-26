// Conversation history for the AI chat: open, start new, delete. Mounted by .../ai/history.tsx.
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import {
  AppText,
  Badge,
  Button,
  Disclaimer,
  EmptyState,
  ErrorState,
  IconButton,
  LoadingState,
  Screen,
  ScreenHeader,
  stripMarkdown,
  useConfirm,
  useToast,
} from '@/components/ui';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useNow } from '@/hooks/useInterval';
import { api, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { AiConversation, Role } from '@/lib/contracts';
import { formatRelative, pluralize, truncate } from '@/lib/format';
import { colors, radius, spacing } from '@/theme';
import { PERSONAS, modeOption, type AiPersona } from './config';
import { setCurrentConversationId, useCurrentConversationId } from './conversationStore';

export interface AiHistoryScreenProps {
  role: Role;
}

function lastPreview(conversation: AiConversation): string {
  const last = conversation.messages[conversation.messages.length - 1];
  if (!last) return '';
  const text = stripMarkdown(last.content).replace(/\s+/g, ' ').trim();
  return truncate(last.role === 'user' ? `You: ${text}` : text, 120);
}

export function AiHistoryScreen({ role }: AiHistoryScreenProps) {
  const persona = PERSONAS[role];
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const current = useCurrentConversationId(userId);
  const confirm = useConfirm();
  const toast = useToast();
  const now = useNow(60_000);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const query = useApiQuery(() => api.aiConversations(), [userId], { enabled: !!userId });
  const conversations = query.data ?? [];

  const backToChat = () => {
    // Pop back to the chat in this tab's stack; otherwise (deep-linked history) replace with it.
    if (router.canDismiss()) router.back();
    else router.replace(persona.chatHref);
  };

  const open = (conversation: AiConversation) => {
    if (userId) setCurrentConversationId(userId, conversation.id);
    backToChat();
  };

  const startNew = () => {
    if (userId) setCurrentConversationId(userId, null);
    backToChat();
  };

  const remove = async (conversation: AiConversation) => {
    const ok = await confirm({
      title: 'Delete this conversation?',
      message: `"${truncate(conversation.title, 80)}" and its answers will be removed. This can't be undone.`,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    setDeletingId(conversation.id);
    try {
      await api.deleteAiConversation(conversation.id);
      query.setData((prev) => prev?.filter((c) => c.id !== conversation.id));
      if (userId && current.id === conversation.id) setCurrentConversationId(userId, null);
      toast.success('Conversation deleted');
    } catch (error) {
      toast.error("Couldn't delete the conversation", errorMessage(error));
    } finally {
      setDeletingId(null);
    }
  };

  let content;
  if (query.loading) {
    content = <LoadingState label="Loading conversations…" />;
  } else if (query.error && !query.data) {
    content = <ErrorState error={query.error} title="Couldn't load your conversations" onRetry={() => void query.refresh()} />;
  } else if (!conversations.length) {
    content = (
      <EmptyState
        icon="chatbubbles-outline"
        title="No conversations yet"
        message={`Questions you ask ${persona.assistantName} are saved here so you can pick up where you left off.`}
        actionLabel="Start a chat"
        onAction={startNew}
      />
    );
  } else {
    content = (
      <View style={styles.list}>
        {conversations.map((conversation) => (
          <ConversationRow
            key={conversation.id}
            persona={persona}
            conversation={conversation}
            current={conversation.id === current.id}
            deleting={deletingId === conversation.id}
            now={now}
            onOpen={() => open(conversation)}
            onDelete={() => void remove(conversation)}
          />
        ))}
      </View>
    );
  }

  return (
    <Screen
      header={
        <ScreenHeader
          title="Conversations"
          subtitle={persona.title}
          back={persona.chatHref}
          right={<Button title="New chat" icon="add" size="sm" onPress={startNew} />}
        />
      }
      refreshing={query.refreshing}
      onRefresh={() => void query.refresh()}
    >
      {content}
      {conversations.length ? (
        <Disclaimer
          compact
          text="Conversations are stored on your BRIAN server. Deleting one removes it for good."
        />
      ) : null}
    </Screen>
  );
}

interface ConversationRowProps {
  persona: AiPersona;
  conversation: AiConversation;
  current: boolean;
  deleting: boolean;
  now: Date;
  onOpen: () => void;
  onDelete: () => void;
}

function ConversationRow({ persona, conversation, current, deleting, now, onOpen, onDelete }: ConversationRowProps) {
  const option = modeOption(persona, conversation.mode);
  const count = conversation.messages.length;
  const when = formatRelative(conversation.updatedAt, now);
  const preview = lastPreview(conversation);
  const meta = `${option.label} · ${pluralize(count, 'message')}`;

  return (
    <View style={[styles.row, current && styles.rowCurrent]}>
      <Pressable
        onPress={onOpen}
        disabled={deleting}
        accessibilityRole="button"
        accessibilityLabel={`${conversation.title}. ${meta}. Updated ${when}.${current ? ' Current conversation.' : ''}`}
        accessibilityHint="Opens this conversation"
        style={({ pressed }) => [styles.open, pressed && styles.pressed]}
      >
        <View style={styles.icon}>
          <Ionicons name={option.icon} size={20} color={colors.text} />
        </View>
        <View style={styles.texts}>
          <View style={styles.titleRow}>
            <AppText variant="bodyStrong" numberOfLines={2} style={styles.flex}>
              {conversation.title || 'Untitled conversation'}
            </AppText>
            <AppText variant="caption" tone="subtle" style={styles.when}>
              {when}
            </AppText>
          </View>
          <View style={styles.metaRow}>
            <AppText variant="caption" tone="muted" numberOfLines={1}>
              {meta}
            </AppText>
            {current ? <Badge label="Current" tone="yellow" /> : null}
          </View>
          {preview ? (
            <AppText variant="small" tone="muted" numberOfLines={2}>
              {preview}
            </AppText>
          ) : null}
        </View>
      </Pressable>
      {deleting ? (
        <View style={styles.deleting} accessibilityLabel="Deleting" accessibilityRole="progressbar">
          <ActivityIndicator color={colors.black} />
        </View>
      ) : (
        <IconButton
          icon="trash-outline"
          accessibilityLabel={`Delete conversation: ${conversation.title}`}
          onPress={onDelete}
          style={styles.delete}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingRight: spacing.xs,
  },
  rowCurrent: { borderColor: colors.yellowBorder, backgroundColor: colors.yellowLighter },
  open: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.md,
    minHeight: 64,
    borderTopLeftRadius: radius.lg,
    borderBottomLeftRadius: radius.lg,
  },
  pressed: { backgroundColor: colors.yellowLighter },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.yellowLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: { flex: 1, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  flex: { flex: 1 },
  when: { marginTop: 3 },
  delete: { alignSelf: 'center' },
  deleting: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
