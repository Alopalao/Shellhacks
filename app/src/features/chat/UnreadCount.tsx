import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { AppText } from '@/components/ui';
import { colors, spacing } from '@/theme';

export interface UnreadCountProps {
  count: number;
  /** `dark` (default): black pill with white digits. `yellow`: yellow pill with black digits. */
  tone?: 'dark' | 'yellow';
  style?: StyleProp<ViewStyle>;
}

/** Compact unread counter ("3", "99+"). Renders nothing for 0. Decorative — include the count in the parent's label. */
export function UnreadCount({ count, tone = 'dark', style }: UnreadCountProps) {
  if (count <= 0) return null;
  const dark = tone === 'dark';
  return (
    <View
      style={[styles.pill, dark ? styles.dark : styles.yellow, style]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <AppText variant="caption" weight="bold" color={dark ? colors.textOnBlack : colors.textOnYellow} style={styles.text}>
        {count > 99 ? '99+' : count}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: spacing.xs + 2,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dark: { backgroundColor: colors.black },
  yellow: { backgroundColor: colors.yellow, borderWidth: 1.5, borderColor: colors.black },
  text: { lineHeight: 14 },
});
