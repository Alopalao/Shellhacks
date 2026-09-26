import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

/** Centered "Today" / "Yesterday" / "Mon, Apr 12" pill between days. */
export function DaySeparator({ label }: { label: string }) {
  return (
    <View style={styles.row} accessible accessibilityRole="header" accessibilityLabel={label}>
      <View style={styles.line} />
      <View style={styles.pill}>
        <AppText variant="caption" tone="muted" weight="semibold">
          {label}
        </AppText>
      </View>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  line: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
  },
});
