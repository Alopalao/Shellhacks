import { StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import { TypingDots } from './TypingDots';

/** "…" bubble on the other person's side while they are typing. */
export function TypingIndicator({ name }: { name: string }) {
  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={`${name} is typing`}
      accessibilityLiveRegion="polite"
    >
      <View style={styles.bubble}>
        <TypingDots size={7} color={colors.textMuted} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'flex-start', marginTop: spacing.sm, marginBottom: spacing.xs },
  bubble: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.lg + 2,
    borderBottomLeftRadius: 6,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
