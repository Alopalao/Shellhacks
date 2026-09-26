import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import { AppText } from './AppText';
import type { IoniconName } from './Button';

export type BadgeTone = 'neutral' | 'yellow' | 'dark' | 'success' | 'warning' | 'danger' | 'outline';

export interface BadgeProps {
  label: string | number;
  tone?: BadgeTone;
  icon?: IoniconName;
  size?: 'sm' | 'md';
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

const TONES: Record<BadgeTone, { bg: string; fg: string; border: string }> = {
  neutral: { bg: colors.surfaceMuted, fg: colors.textMuted, border: colors.surfaceMuted },
  yellow: { bg: colors.yellow, fg: colors.textOnYellow, border: colors.yellow },
  dark: { bg: colors.black, fg: colors.textOnBlack, border: colors.black },
  success: { bg: colors.successLight, fg: colors.success, border: colors.successLight },
  warning: { bg: colors.warningLight, fg: colors.warning, border: colors.warningLight },
  danger: { bg: colors.dangerLight, fg: colors.danger, border: colors.dangerLight },
  outline: { bg: colors.white, fg: colors.text, border: colors.border },
};

/** Small status pill: `<Badge label="Paused" tone="warning" />`. Non-interactive. */
export function Badge({ label, tone = 'neutral', icon, size = 'sm', accessibilityLabel, style }: BadgeProps) {
  const t = TONES[tone];
  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel ?? String(label)}
      style={[
        styles.base,
        size === 'md' ? styles.md : styles.sm,
        { backgroundColor: t.bg, borderColor: t.border },
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={size === 'md' ? 14 : 12} color={t.fg} /> : null}
      <AppText variant="caption" weight="semibold" color={t.fg} numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  sm: { paddingHorizontal: spacing.sm, paddingVertical: 2, minHeight: 22 },
  md: { paddingHorizontal: spacing.md - 2, paddingVertical: spacing.xs, minHeight: 28 },
});
