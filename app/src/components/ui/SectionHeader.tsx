import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, spacing } from '@/theme';
import { AppText } from './AppText';
import type { IoniconName } from './Button';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: IoniconName;
  /** Optional right-side text action ("See all"). */
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

/** Heading for a group of content, with an optional "See all"-style action. */
export function SectionHeader({ title, subtitle, icon, actionLabel, onAction, style }: SectionHeaderProps) {
  return (
    <View style={[styles.row, style]}>
      <View style={styles.titles}>
        <View style={styles.titleRow}>
          {icon ? <Ionicons name={icon} size={18} color={colors.text} /> : null}
          <AppText variant="title3" numberOfLines={1} style={styles.flex}>
            {title}
          </AppText>
        </View>
        {subtitle ? (
          <AppText variant="small" tone="muted">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={`${actionLabel}: ${title}`}
          hitSlop={8}
          style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
        >
          <AppText variant="label">{actionLabel}</AppText>
          <Ionicons name="chevron-forward" size={14} color={colors.text} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: spacing.md },
  titles: { flex: 1, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flexShrink: 1 },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minHeight: 36,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
  },
  actionPressed: { backgroundColor: colors.yellowLighter },
});
