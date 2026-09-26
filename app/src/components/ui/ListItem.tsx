import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import { AppText } from './AppText';
import type { IoniconName } from './Button';

export interface ListItemProps {
  title: string;
  subtitle?: string;
  /** Small text on the right (time, count…). */
  meta?: string;
  /** Custom left element (e.g. <Avatar />). Overrides `leftIcon`. */
  left?: ReactNode;
  /** Ionicons name rendered in a light-yellow rounded tile. */
  leftIcon?: IoniconName;
  /** Custom right element (e.g. <Badge />). Rendered before the chevron. */
  right?: ReactNode;
  onPress?: () => void;
  /** Show a chevron (defaults to true when `onPress` is set). */
  chevron?: boolean;
  /** Bold title + dot (unread). */
  emphasized?: boolean;
  disabled?: boolean;
  titleLines?: number;
  subtitleLines?: number;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}

/** A row for lists and settings. Minimum height 56 px. */
export function ListItem({
  title,
  subtitle,
  meta,
  left,
  leftIcon,
  right,
  onPress,
  chevron,
  emphasized,
  disabled,
  titleLines = 1,
  subtitleLines = 2,
  accessibilityLabel,
  accessibilityHint,
  style,
}: ListItemProps) {
  const showChevron = chevron ?? !!onPress;
  const body = (
    <>
      {left ??
        (leftIcon ? (
          <View style={styles.iconTile}>
            <Ionicons name={leftIcon} size={20} color={colors.text} />
          </View>
        ) : null)}
      <View style={styles.texts}>
        <View style={styles.titleRow}>
          <AppText variant={emphasized ? 'bodyStrong' : 'body'} numberOfLines={titleLines} style={styles.title}>
            {title}
          </AppText>
          {meta ? (
            <AppText variant="caption" tone={emphasized ? 'default' : 'subtle'} numberOfLines={1}>
              {meta}
            </AppText>
          ) : null}
        </View>
        {subtitle ? (
          <AppText variant="small" tone="muted" numberOfLines={subtitleLines}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right}
      {emphasized ? <View style={styles.unreadDot} /> : null}
      {showChevron ? <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} /> : null}
    </>
  );
  const label = accessibilityLabel ?? [title, subtitle, meta].filter(Boolean).join(', ');
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: !!disabled }}
        style={({ pressed }) => [styles.row, pressed && styles.pressed, disabled && styles.disabled, style]}
      >
        {body}
      </Pressable>
    );
  }
  return (
    <View style={[styles.row, style]} accessible accessibilityLabel={label}>
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 56,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
  },
  pressed: { backgroundColor: colors.yellowLighter },
  disabled: { opacity: 0.5 },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.yellowLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: { flex: 1, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { flex: 1 },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.yellow, borderWidth: 1.5, borderColor: colors.black },
});
