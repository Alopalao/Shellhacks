import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { AppText, Badge } from '@/components/ui';
import { formatTime } from '@/lib/format';
import { colors, radius, spacing } from '@/theme';
import type { SlotState } from '../schedule';

export interface DoseSlotRowProps {
  /** Main line, e.g. "Metformin 500 mg" (checklist) or "8:00 AM" (med detail). */
  title: string;
  /** Second line, e.g. "1 tablet · Take with breakfast". */
  subtitle?: string;
  /** The `HH:mm` slot. */
  slot: string;
  state: SlotState;
  /** ISO time the dose was logged (shown as "Taken 8:04 AM"). */
  takenAt?: string;
  /** Request in flight (shows a small spinner, ignores taps). */
  pending?: boolean;
  disabled?: boolean;
  /** Show the slot time on the right (default true). */
  showTime?: boolean;
  onToggle: () => void;
  style?: StyleProp<ViewStyle>;
}

/** One tappable dose: a round checkbox, the med/time and its status. Tap again to undo. */
export function DoseSlotRow({
  title,
  subtitle,
  slot,
  state,
  takenAt,
  pending = false,
  disabled = false,
  showTime = true,
  onToggle,
  style,
}: DoseSlotRowProps) {
  const taken = state === 'taken';
  const time = formatTime(slot);
  const statusText =
    state === 'taken'
      ? takenAt
        ? `Taken ${formatTime(takenAt)}`
        : 'Taken'
      : state === 'due'
        ? 'Due now'
        : state === 'overdue'
          ? 'Not logged yet'
          : '';
  const a11yLabel = [title, showTime && title !== time ? time : null, subtitle, statusText].filter(Boolean).join(', ');

  return (
    <Pressable
      onPress={pending || disabled ? undefined : onToggle}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityLabel={a11yLabel}
      accessibilityHint={taken ? 'Double tap to undo' : 'Double tap to mark as taken'}
      aria-checked={taken}
      aria-busy={pending}
      aria-disabled={disabled}
      style={({ pressed }) => [
        styles.row,
        taken && styles.rowTaken,
        state === 'due' && styles.rowDue,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <View style={[styles.check, taken ? styles.checkOn : styles.checkOff]}>
        {pending ? (
          <ActivityIndicator size="small" color={colors.black} />
        ) : taken ? (
          <Ionicons name="checkmark" size={20} color={colors.textOnYellow} />
        ) : null}
      </View>
      <View style={styles.texts}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="small" tone="muted" numberOfLines={2}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      <View style={styles.right}>
        {showTime && title !== time ? (
          <AppText variant="label" numberOfLines={1}>
            {time}
          </AppText>
        ) : null}
        {state === 'due' ? (
          <Badge label="Due now" tone="yellow" />
        ) : statusText ? (
          <AppText variant="caption" tone={taken ? 'success' : 'warning'} numberOfLines={1}>
            {statusText}
          </AppText>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 60,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  rowTaken: { backgroundColor: colors.yellowLighter, borderColor: colors.yellowBorder },
  rowDue: { borderColor: colors.black },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
  check: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOff: { borderWidth: 2, borderColor: colors.text, backgroundColor: colors.white },
  checkOn: { backgroundColor: colors.yellow, borderWidth: 2, borderColor: colors.yellow },
  texts: { flex: 1, gap: 2 },
  right: { alignItems: 'flex-end', gap: 4, maxWidth: '40%' },
});
