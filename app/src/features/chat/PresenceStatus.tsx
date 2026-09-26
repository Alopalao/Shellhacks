import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { AppText, OnlineDot } from '@/components/ui';
import { useNow } from '@/hooks/useInterval';
import { colors, spacing } from '@/theme';
import { formatLastSeen } from './messages';
import { TypingDots } from './TypingDots';

export interface PresenceInfo {
  online: boolean;
  lastSeen: string | null;
  typing?: boolean;
}

/** "typing…" · "Online" · "Last seen 5 min ago" · "Offline". */
export function presenceLabel({ online, lastSeen, typing }: PresenceInfo, now: Date = new Date()): string {
  if (typing) return 'typing…';
  if (online) return 'Online';
  const seen = formatLastSeen(lastSeen, now);
  return seen ? `Last seen ${seen}` : 'Offline';
}

export interface PresenceStatusProps extends PresenceInfo {
  /** Text size (default `small`). */
  variant?: 'small' | 'caption';
  /** Wording for "online" (default "Online"). */
  onlineLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** Dot (or typing dots) + live presence text. Announced politely to screen readers when it changes. */
export function PresenceStatus({ online, lastSeen, typing, variant = 'small', onlineLabel, style }: PresenceStatusProps) {
  const now = useNow(30_000);
  const label = typing ? 'typing…' : online && onlineLabel ? onlineLabel : presenceLabel({ online, lastSeen }, now);
  return (
    <View style={[styles.row, style]} accessible accessibilityLabel={label} accessibilityLiveRegion="polite">
      {typing ? <TypingDots size={5} color={colors.success} /> : <OnlineDot online={online} size={10} />}
      <AppText
        variant={variant}
        tone={typing || online ? 'success' : 'muted'}
        weight={typing || online ? 'semibold' : undefined}
        numberOfLines={1}
        style={styles.text}
      >
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2 },
  text: { flexShrink: 1 },
});
