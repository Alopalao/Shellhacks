import { Ionicons } from '@expo/vector-icons';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { AppText, IconButton } from '@/components/ui';
import type { Role } from '@/lib/contracts';
import { formatMessageTime, formatTime } from '@/lib/format';
import { colors, radius, spacing } from '@/theme';
import { AttachmentCard, describeAttachment } from './AttachmentCard';
import type { ChatRow, Receipt } from './types';
import type { AttachmentLookup } from './useAttachmentLookup';

type MessageRow = Extract<ChatRow, { type: 'message' }>;

export interface MessageBubbleProps {
  row: MessageRow;
  /** Display name of the other participant (for screen-reader labels). */
  counterpartName: string;
  viewerRole: Role;
  patientId: string;
  lookup: AttachmentLookup;
  onRetry: (clientId: string) => void;
  onDiscard: (clientId: string) => void;
}

function receiptText(receipt: Receipt): string {
  return receipt.kind === 'seen' ? `Seen ${formatMessageTime(receipt.at)}` : 'Sent';
}

/** One chat bubble: mine = yellow/black on the right; theirs = white with a border on the left. */
export function MessageBubble({
  row,
  counterpartName,
  viewerRole,
  patientId,
  lookup,
  onRetry,
  onDiscard,
}: MessageBubbleProps) {
  const { message, mine, firstInGroup, receipt } = row;
  const pending = message.status === 'pending';
  const failed = message.status === 'failed';
  const time = formatTime(message.createdAt);
  const clientId = message.clientId;

  const attachmentLabel = message.attachment
    ? `. ${describeAttachment(message.attachment, viewerRole, patientId, lookup).kind} attached`
    : '';
  const statusLabel = pending ? '. Sending' : failed ? '. Not sent' : receipt ? `. ${receiptText(receipt)}` : '';
  const a11yLabel = `${mine ? 'You' : counterpartName}, ${time}: ${message.body}${attachmentLabel}${statusLabel}`;

  // Bubbles in a run share a tight edge on the sender's side; the first one keeps a round top.
  const corners = mine
    ? { borderTopRightRadius: firstInGroup ? BUBBLE_RADIUS : JOINED_RADIUS, borderBottomRightRadius: JOINED_RADIUS }
    : { borderTopLeftRadius: firstInGroup ? BUBBLE_RADIUS : JOINED_RADIUS, borderBottomLeftRadius: JOINED_RADIUS };

  return (
    <View style={[styles.row, mine ? styles.rowMine : styles.rowTheirs, { marginTop: firstInGroup ? spacing.md : 3 }]}>
      <View
        style={[
          styles.bubble,
          mine ? styles.mine : styles.theirs,
          corners,
          pending && styles.pending,
          failed && styles.failed,
        ]}
      >
        {message.attachment ? (
          <AttachmentCard
            attachment={message.attachment}
            viewerRole={viewerRole}
            patientId={patientId}
            lookup={lookup}
            onYellow={mine}
          />
        ) : null}
        <View accessible accessibilityLabel={a11yLabel}>
          <AppText variant="body" color={colors.text} selectable={Platform.OS === 'web'}>
            {message.body}
          </AppText>
          <View style={styles.meta}>
            {pending ? <Ionicons name="time-outline" size={12} color={colors.textMuted} /> : null}
            {failed ? <Ionicons name="alert-circle" size={12} color={colors.danger} /> : null}
            <AppText variant="caption" tone={mine ? 'default' : 'subtle'} style={mine ? styles.metaMine : undefined}>
              {pending ? 'Sending…' : time}
            </AppText>
          </View>
        </View>
      </View>

      {failed && clientId ? (
        <View style={styles.failedRow}>
          <Pressable
            onPress={() => onRetry(clientId)}
            accessibilityRole="button"
            accessibilityLabel="Message not sent. Retry"
            accessibilityHint={message.error}
            hitSlop={4}
            style={({ pressed }) => [styles.retry, pressed && styles.retryPressed]}
          >
            <Ionicons name="refresh" size={14} color={colors.danger} />
            <AppText variant="small" tone="danger" weight="semibold">
              Not sent · Tap to retry
            </AppText>
          </Pressable>
          <IconButton
            icon="trash-outline"
            accessibilityLabel="Delete unsent message"
            size={36}
            iconSize={16}
            variant="plain"
            onPress={() => onDiscard(clientId)}
          />
        </View>
      ) : null}
      {failed && message.error ? (
        <AppText variant="caption" tone="subtle" style={styles.errorText} numberOfLines={2}>
          {message.error}
        </AppText>
      ) : null}

      {receipt && !failed ? (
        <View style={styles.receipt}>
          {receipt.kind === 'seen' ? <Ionicons name="checkmark-done" size={14} color={colors.success} /> : null}
          {receipt.kind === 'sent' ? <Ionicons name="checkmark" size={14} color={colors.textSubtle} /> : null}
          <AppText variant="caption" tone={receipt.kind === 'seen' ? 'success' : 'subtle'}>
            {receiptText(receipt)}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const BUBBLE_RADIUS = radius.lg + 2;
const JOINED_RADIUS = 6;

const styles = StyleSheet.create({
  row: { maxWidth: '100%' },
  rowMine: { alignItems: 'flex-end' },
  rowTheirs: { alignItems: 'flex-start' },
  bubble: {
    maxWidth: '84%',
    paddingHorizontal: spacing.md + 2,
    paddingTop: spacing.sm + 2,
    paddingBottom: spacing.sm,
    borderRadius: BUBBLE_RADIUS,
  },
  mine: { backgroundColor: colors.yellow },
  theirs: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  pending: { opacity: 0.72 },
  failed: { backgroundColor: colors.yellowLight, borderWidth: 1, borderColor: colors.danger },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
    marginTop: 2,
  },
  metaMine: { opacity: 0.72 },
  failedRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 2 },
  retry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 36,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  retryPressed: { backgroundColor: colors.dangerLight },
  errorText: { maxWidth: '84%', textAlign: 'right' },
  receipt: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3, marginRight: 2 },
});
