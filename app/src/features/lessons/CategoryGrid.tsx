// Topic grid for the Learn home: icon tiles on light yellow with lesson and completion counts.
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppText, Card, ProgressBar } from '@/components/ui';
import { pluralize } from '@/lib/format';
import { colors, spacing } from '@/theme';
import { categoryHref, type CategoryStats } from './helpers';
import { LessonIconTile } from './LessonCards';

export interface CategoryGridProps {
  stats: readonly CategoryStats[];
  /** Tiles per row (default 2). */
  columns?: number;
}

const GUTTER = spacing.md;

/** Responsive grid of topic tiles. Rows share the tallest tile's height. */
export function CategoryGrid({ stats, columns = 2 }: CategoryGridProps) {
  const cols = Math.max(1, Math.floor(columns));
  return (
    <View style={styles.grid} accessibilityRole="list">
      {stats.map((s) => (
        <View key={s.category.id} style={[styles.cell, { width: `${100 / cols}%` }]}>
          <CategoryTile stats={s} />
        </View>
      ))}
    </View>
  );
}

export interface CategoryTileProps {
  stats: CategoryStats;
}

function statusText({ total, completed }: CategoryStats): string {
  if (total === 0) return 'Coming soon';
  if (completed === total) return 'All done';
  if (completed > 0) return `${completed} of ${total} done`;
  return 'Not started';
}

export function CategoryTile({ stats }: CategoryTileProps) {
  const { category, total, completed } = stats;
  const done = total > 0 && completed === total;
  const status = statusText(stats);
  return (
    <Card
      padding="md"
      onPress={() => router.push(categoryHref(category.id))}
      accessibilityLabel={`${category.title}. ${total === 0 ? 'Lessons coming soon' : `${pluralize(total, 'lesson')}, ${completed} completed`}.`}
      accessibilityHint={category.description}
      style={styles.tile}
    >
      <View style={styles.tileTop}>
        <LessonIconTile icon={category.icon} size={48} />
        {done ? (
          <View style={styles.doneBadge}>
            <Ionicons name="checkmark" size={14} color={colors.white} />
          </View>
        ) : null}
      </View>
      <AppText variant="bodyStrong" numberOfLines={2} style={styles.title}>
        {category.title}
      </AppText>
      <View style={styles.footer}>
        <AppText variant="caption" tone="muted" numberOfLines={1}>
          {total === 0 ? 'No lessons yet' : pluralize(total, 'lesson')}
        </AppText>
        <AppText variant="caption" tone={done ? 'success' : 'subtle'} weight="semibold" numberOfLines={1}>
          {status}
        </AppText>
        {total > 0 ? <ProgressBar value={completed / total} height={5} style={styles.bar} /> : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -GUTTER / 2, rowGap: GUTTER },
  cell: { paddingHorizontal: GUTTER / 2 },
  tile: { flex: 1, gap: spacing.sm, minHeight: 176 },
  tileTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  doneBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flexGrow: 1 },
  footer: { gap: 2 },
  bar: { marginTop: spacing.xs, backgroundColor: colors.border },
});
