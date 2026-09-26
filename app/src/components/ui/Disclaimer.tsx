import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import { AppText } from './AppText';

export const DEFAULT_DISCLAIMER =
  'BRIAN shares general health information. It is not a substitute for professional medical care. In an emergency, call 911.';

export interface DisclaimerProps {
  /** Override the default "not a substitute for professional care" text. */
  text?: string;
  /** Plain one-line style without the surface (for footers). */
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** The "not a substitute for professional care" note every medical screen carries. */
export function Disclaimer({ text = DEFAULT_DISCLAIMER, compact, style }: DisclaimerProps) {
  return (
    <View
      style={[compact ? styles.compact : styles.box, style]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`Note: ${text}`}
    >
      <Ionicons name="information-circle-outline" size={compact ? 14 : 18} color={colors.textMuted} />
      <AppText variant={compact ? 'caption' : 'small'} tone="muted" style={styles.flex}>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  compact: { flexDirection: 'row', gap: spacing.xs + 2, alignItems: 'flex-start' },
  flex: { flex: 1 },
});
