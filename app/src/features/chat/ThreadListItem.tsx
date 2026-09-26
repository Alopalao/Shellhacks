import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, Avatar } from '@/components/ui';
import type { Thread } from '@/lib/contracts';
import { displayName, formatRelative } from '@/lib/format';
import { usePresence } from '@/lib/socket';
import { colors, radius, spacing } from '@/theme';
import { messagePreview } from './messages';
import { TypingDots } from './TypingDots';
import { UnreadCount } from './UnreadCount';

export interface ThreadListItemProps {
  thread: Thread;
  /** Signed-in user id (for "You:" previews and read ticks). */
  me: string;
  /** Seed for the online dot until the socket reports (e.g. `PatientSummary.online`). */
  onlineFallback?: boolean;
  typing: boolean;
  /** Reference time for relative timestamps. */
  now: Date;
  onPress: () => void;
}

/** Conversation row: avatar + online dot, name, live preview ("typing…"), time and unread count. */
export function ThreadListItem({ thread, me, onlineFallback = false, typing, now, onPress }: ThreadListItemProps) {
  // Per-row subscription: re-renders only this row when this person's presence changes.
  const online = usePresence(thread.counterpart.id, onlineFallback);
  const name = displayName(thread.counterpart);
  const last = thread.lastMessage;
  const unread = thread.unreadCount;
  const time = last ? formatRelative(last.createdAt, now) : '';
  const preview = messagePreview(last, me);
  const mineLast = !!last && last.senderId === me;

  const a11y = [
    name,
    online ? 'online' : 'offline',
    unread ? `${unread} unread ${unread === 1 ? 'message' : 'messages'}` : null,
    typing ? 'typing' : last ? `last message ${time}: ${preview}` : 'no messages yet',
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      accessibilityHint="Opens the conversation"
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <Avatar user={thread.counterpart} size={52} online={online} accessibilityLabel="" />
      <View style={styles.texts}>
        <View style={styles.topLine}>
          <AppText variant={unread ? 'bodyStrong' : 'body'} weight={unread ? 'bold' : 'semibold'} numberOfLines={1} style={styles.name}>
            {name}
          </AppText>
          {time ? (
            <AppText variant="caption" tone={unread ? 'default' : 'subtle'} weight={unread ? 'bold' : undefined}>
              {time}
            </AppText>
          ) : null}
        </View>
        <View style={styles.bottomLine}>
          {typing ? (
            <View style={styles.typing}>
              <TypingDots size={5} color={colors.success} />
              <AppText variant="small" tone="success" weight="semibold">
                typing…
              </AppText>
            </View>
          ) : (
            <View style={styles.previewRow}>
              {mineLast ? (
                <Ionicons
                  name={last?.readAt ? 'checkmark-done' : 'checkmark'}
                  size={15}
                  color={last?.readAt ? colors.success : colors.textSubtle}
                />
              ) : null}
              <AppText
                variant="small"
                tone={unread ? 'default' : 'muted'}
                weight={unread ? 'semibold' : undefined}
                numberOfLines={2}
                style={styles.preview}
              >
                {preview}
              </AppText>
            </View>
          )}
          <UnreadCount count={unread} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 76,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  pressed: { backgroundColor: colors.yellowLighter },
  texts: { flex: 1, gap: 3 },
  topLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { flex: 1 },
  bottomLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  previewRow: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
  preview: { flex: 1 },
  typing: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2, minHeight: 19 },
});
