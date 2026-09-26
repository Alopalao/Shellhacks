import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, radius, spacing } from '@/theme';
import { AppText } from './AppText';

export type IoniconName = ComponentProps<typeof Ionicons>['name'];

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  title: string;
  onPress?: (e: GestureResponderEvent) => void;
  /** primary = yellow/black (default), secondary = black/white, outline, ghost, danger = red. */
  variant?: ButtonVariant;
  /** sm 40 · md 48 (default) · lg 56 px tall. All keep a ≥44 pt touch target. */
  size?: ButtonSize;
  /** Shows a spinner and blocks presses. */
  loading?: boolean;
  disabled?: boolean;
  /** Ionicons name shown before (or after) the title. */
  icon?: IoniconName;
  iconPosition?: 'left' | 'right';
  /** Stretch to the container width. */
  fullWidth?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const HEIGHT: Record<ButtonSize, number> = { sm: 40, md: 48, lg: 56 };
const FONT: Record<ButtonSize, 'label' | 'bodyStrong'> = { sm: 'label', md: 'bodyStrong', lg: 'bodyStrong' };
const ICON: Record<ButtonSize, number> = { sm: 16, md: 18, lg: 20 };

interface VariantStyle {
  bg: string;
  /** Pressed background; when omitted the button dims instead. */
  bgPressed?: string;
  fg: string;
  border: string;
}

const VARIANTS: Record<ButtonVariant, VariantStyle> = {
  primary: { bg: colors.yellow, bgPressed: colors.yellowPressed, fg: colors.textOnYellow, border: colors.yellow },
  secondary: { bg: colors.black, fg: colors.textOnBlack, border: colors.black },
  outline: { bg: colors.white, bgPressed: colors.surfaceMuted, fg: colors.text, border: colors.borderStrong },
  ghost: { bg: 'transparent', bgPressed: colors.yellowLighter, fg: colors.text, border: 'transparent' },
  danger: { bg: colors.danger, fg: colors.white, border: colors.danger },
};

/** The design-system button. Yellow with a black label by default. */
export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  accessibilityLabel,
  accessibilityHint,
  style,
  testID,
}: ButtonProps) {
  const v = VARIANTS[variant];
  const inactive = disabled || loading;
  const iconEl = icon ? <Ionicons name={icon} size={ICON[size]} color={v.fg} /> : null;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      hitSlop={size === 'sm' ? 4 : 0}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: HEIGHT[size],
          paddingHorizontal: size === 'sm' ? spacing.md : spacing.xl,
          backgroundColor: pressed && !inactive && v.bgPressed ? v.bgPressed : v.bg,
          borderColor: v.border,
        },
        pressed && !inactive && !v.bgPressed && styles.pressedDim,
        fullWidth && styles.fullWidth,
        disabled && !loading && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} size="small" />
      ) : (
        <View style={styles.content}>
          {iconPosition === 'left' && iconEl}
          <AppText variant={FONT[size]} color={v.fg} numberOfLines={1} style={styles.label}>
            {title}
          </AppText>
          {iconPosition === 'right' && iconEl}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  fullWidth: { alignSelf: 'stretch' },
  content: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  label: { textAlign: 'center' },
  disabled: { opacity: 0.45 },
  pressedDim: { opacity: 0.82 },
});
