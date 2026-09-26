import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius } from '@/theme';
import { AppText } from './AppText';
import type { IoniconName } from './Button';

export type IconButtonVariant = 'plain' | 'yellow' | 'outline' | 'dark' | 'muted';

export interface IconButtonProps {
  icon: IoniconName;
  /** Required: screen-reader label ("Back", "Open profile"). */
  accessibilityLabel: string;
  onPress?: () => void;
  variant?: IconButtonVariant;
  /** Diameter in px (default 44 — the minimum touch target). */
  size?: number;
  iconSize?: number;
  /** Small counter badge (hidden when 0/undefined). */
  badge?: number;
  disabled?: boolean;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const VARIANTS: Record<IconButtonVariant, { bg: string; pressed: string; fg: string; border: string }> = {
  plain: { bg: 'transparent', pressed: colors.surfaceMuted, fg: colors.text, border: 'transparent' },
  yellow: { bg: colors.yellow, pressed: colors.yellowPressed, fg: colors.textOnYellow, border: colors.yellow },
  outline: { bg: colors.white, pressed: colors.surfaceMuted, fg: colors.text, border: colors.border },
  dark: { bg: colors.black, pressed: colors.black, fg: colors.textOnBlack, border: colors.black },
  muted: { bg: colors.surfaceMuted, pressed: colors.border, fg: colors.text, border: colors.surfaceMuted },
};

/** Round icon-only button with a 44 pt target. */
export function IconButton({
  icon,
  accessibilityLabel,
  onPress,
  variant = 'plain',
  size = 44,
  iconSize,
  badge,
  disabled,
  accessibilityHint,
  style,
  testID,
}: IconButtonProps) {
  const v = VARIANTS[variant];
  const hitSlop = Math.max(0, (44 - size) / 2);
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={badge ? `${accessibilityLabel}, ${badge} new` : accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
      hitSlop={hitSlop}
      style={({ pressed }) => [
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: radius.pill,
          backgroundColor: pressed ? v.pressed : v.bg,
          borderColor: v.border,
        },
        pressed && variant === 'dark' && styles.pressedDim,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Ionicons name={icon} size={iconSize ?? Math.round(size * 0.5)} color={v.fg} />
      {badge ? (
        <View style={styles.badge} pointerEvents="none">
          <AppText variant="caption" weight="bold" color={colors.textOnBlack} style={styles.badgeText}>
            {badge > 99 ? '99+' : badge}
          </AppText>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  disabled: { opacity: 0.4 },
  pressedDim: { opacity: 0.82 },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 10, lineHeight: 12 },
});
