import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius, shadow, spacing } from '@/theme';

export type CardVariant = 'default' | 'yellow' | 'outline' | 'muted' | 'dark';

export interface CardProps {
  children?: ReactNode;
  /** default = white + hairline border + soft shadow; yellow = light-yellow surface; outline = border only; muted = grey well; dark = black. */
  variant?: CardVariant;
  /** Inner padding (spacing token or px). Default `lg` (16). */
  padding?: keyof typeof spacing | number;
  /** Makes the whole card a button. Provide `accessibilityLabel` too. */
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const VARIANTS: Record<CardVariant, ViewStyle> = {
  default: { backgroundColor: colors.surface, borderColor: colors.border, ...shadow.card },
  yellow: { backgroundColor: colors.yellowLight, borderColor: colors.yellowBorder },
  outline: { backgroundColor: colors.surface, borderColor: colors.border },
  muted: { backgroundColor: colors.surfaceMuted, borderColor: colors.surfaceMuted },
  dark: { backgroundColor: colors.black, borderColor: colors.black },
};

/** Surface container. Pass `onPress` to make it tappable. */
export function Card({
  children,
  variant = 'default',
  padding = 'lg',
  onPress,
  accessibilityLabel,
  accessibilityHint,
  style,
  testID,
}: CardProps) {
  const pad = typeof padding === 'number' ? padding : spacing[padding];
  const base = [styles.base, VARIANTS[variant], { padding: pad }];
  if (onPress) {
    return (
      <Pressable
        testID={testID}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        style={({ pressed }) => [...base, pressed && styles.pressed, style]}
      >
        {children}
      </Pressable>
    );
  }
  return (
    <View testID={testID} style={[...base, style]} accessibilityLabel={accessibilityLabel}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.lg, borderWidth: 1 },
  pressed: { opacity: 0.88, transform: [{ scale: 0.995 }] },
});
