import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { AppText } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

export type TagVariant = 'condition' | 'allergy' | 'muted';

export interface TagProps {
  label: string;
  variant?: TagVariant;
  size?: 'sm' | 'md';
}

/** Non-interactive label pill. Allergies use a red outline (safety-critical information). */
export function Tag({ label, variant = 'condition', size = 'md' }: TagProps) {
  const allergy = variant === 'allergy';
  return (
    <View
      accessible
      accessibilityLabel={allergy ? `Allergy: ${label}` : label}
      style={[
        styles.base,
        size === 'sm' ? styles.sm : styles.md,
        allergy ? styles.allergy : variant === 'muted' ? styles.muted : styles.condition,
      ]}
    >
      {allergy ? <Ionicons name="warning-outline" size={size === 'sm' ? 12 : 14} color={colors.danger} /> : null}
      <AppText
        variant={size === 'sm' ? 'caption' : 'label'}
        color={allergy ? colors.danger : colors.text}
        weight={allergy ? 'bold' : undefined}
        numberOfLines={1}
      >
        {label}
      </AppText>
    </View>
  );
}

export interface TagListProps {
  items: readonly string[];
  variant?: TagVariant;
  size?: 'sm' | 'md';
  /** Shown (muted) when there are no items. */
  emptyText?: string;
  /** Show at most this many, then "+N". */
  max?: number;
  style?: StyleProp<ViewStyle>;
}

/** Wrapping row of tags with an optional empty text and "+N more" overflow. */
export function TagList({ items, variant = 'condition', size = 'md', emptyText, max, style }: TagListProps) {
  if (!items.length) {
    return emptyText ? (
      <AppText variant="small" tone="muted" style={style}>
        {emptyText}
      </AppText>
    ) : null;
  }
  const shown = max != null ? items.slice(0, max) : items;
  const hidden = items.length - shown.length;
  return (
    <View style={[styles.list, style]}>
      {shown.map((item) => (
        <Tag key={item} label={item} variant={variant} size={size} />
      ))}
      {hidden > 0 ? <Tag label={`+${hidden} more`} variant="muted" size={size} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs + 2 },
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    alignSelf: 'flex-start',
  },
  sm: { paddingHorizontal: spacing.sm, minHeight: 24 },
  md: { paddingHorizontal: spacing.md, minHeight: 30 },
  condition: { backgroundColor: colors.yellowLighter, borderColor: colors.yellowBorder },
  allergy: { backgroundColor: colors.white, borderColor: colors.danger },
  muted: { backgroundColor: colors.surfaceMuted, borderColor: colors.surfaceMuted },
});
