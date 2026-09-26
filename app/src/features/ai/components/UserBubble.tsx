// The user's question: right-aligned light-yellow bubble with the mode it was asked in.
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui';
import type { AiMessage } from '@/lib/contracts';
import { formatMessageTime } from '@/lib/format';
import { colors, radius, spacing } from '@/theme';
import type { AiModeOption } from '../config';

export interface UserBubbleProps {
  message: AiMessage;
  /** Mode chip shown under the bubble (omit for the default mode). */
  modeOption?: AiModeOption | null;
  /** Visual state for optimistic / failed questions. */
  status?: 'sent' | 'sending' | 'failed';
}

export function UserBubble({ message, modeOption, status = 'sent' }: UserBubbleProps) {
  const time = formatMessageTime(message.createdAt);
  const meta =
    status === 'sending' ? 'Sending…' : status === 'failed' ? 'Not answered' : time;
  return (
    <View style={styles.wrap}>
      <View
        style={[styles.bubble, status === 'failed' && styles.bubbleFailed]}
        accessible
        accessibilityLabel={`You asked: ${message.content}`}
      >
        <AppText variant="body" selectable>
          {message.content}
        </AppText>
      </View>
      <View style={styles.meta}>
        {modeOption ? (
          <View style={styles.mode}>
            <Ionicons name={modeOption.icon} size={12} color={colors.textMuted} />
            <AppText variant="caption" tone="muted" numberOfLines={1}>
              {modeOption.label}
            </AppText>
          </View>
        ) : null}
        {meta ? (
          <AppText variant="caption" tone={status === 'failed' ? 'danger' : 'subtle'}>
            {meta}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'flex-end', gap: spacing.xs, paddingLeft: spacing.xxxl },
  bubble: {
    maxWidth: '100%',
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.lg,
    borderBottomRightRadius: radius.sm,
    backgroundColor: colors.yellowLight,
    borderWidth: 1,
    borderColor: colors.yellowBorder,
  },
  bubbleFailed: { borderColor: colors.danger },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  mode: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
