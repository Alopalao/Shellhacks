// "x of N completed" card with a yellow progress bar (Learn home).
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { AppText, Card, ProgressBar } from '@/components/ui';
import { pluralize } from '@/lib/format';
import { colors, radius, spacing } from '@/theme';

export interface ProgressSummaryProps {
  completed: number;
  total: number;
  /** Quizzes finished at least once. */
  quizzesTaken: number;
  /** Quizzes with a perfect best score. */
  perfectQuizzes: number;
  /** false while stored progress is loading. */
  ready?: boolean;
}

function encouragement(completed: number, total: number): string {
  if (total === 0) return 'New lessons are on the way.';
  if (completed === 0) return 'Pick any lesson below. Most take about 4 minutes.';
  if (completed >= total) return 'You finished every lesson. Great work!';
  const left = total - completed;
  return `Nice progress! ${pluralize(left, 'lesson')} to go.`;
}

export function ProgressSummary({ completed, total, quizzesTaken, perfectQuizzes, ready = true }: ProgressSummaryProps) {
  const value = total > 0 ? completed / total : 0;
  const pct = Math.round(value * 100);
  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <View style={styles.icon} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Ionicons name="school" size={22} color={colors.textOnYellow} />
        </View>
        <View style={styles.texts}>
          <AppText variant="label" tone="muted">
            Your progress
          </AppText>
          <AppText variant="title3" accessibilityRole="text">
            {ready ? `${completed} of ${pluralize(total, 'lesson')} completed` : 'Loading your progress…'}
          </AppText>
        </View>
        {ready && total > 0 ? (
          <AppText variant="title3" accessibilityElementsHidden importantForAccessibility="no">
            {pct}%
          </AppText>
        ) : null}
      </View>
      <ProgressBar
        value={ready ? value : 0}
        height={10}
        accessibilityLabel={`Lessons completed: ${completed} of ${total}`}
        style={styles.track}
      />
      <View style={styles.footer}>
        <AppText variant="small" tone="muted" style={styles.flex}>
          {ready ? encouragement(completed, total) : ' '}
        </AppText>
        {ready && quizzesTaken > 0 ? (
          <View style={styles.quizStat} accessible accessibilityLabel={`${pluralize(quizzesTaken, 'quiz', 'quizzes')} taken, ${perfectQuizzes} with a perfect score`}>
            <Ionicons name="ribbon-outline" size={14} color={colors.text} />
            <AppText variant="caption">
              {perfectQuizzes > 0
                ? `${pluralize(quizzesTaken, 'quiz', 'quizzes')} · ${perfectQuizzes} perfect`
                : `${pluralize(quizzesTaken, 'quiz', 'quizzes')} taken`}
            </AppText>
          </View>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: { flex: 1, gap: 2 },
  track: { backgroundColor: colors.border },
  footer: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm },
  flex: { flex: 1, minWidth: 180 },
  quizStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.yellowLight,
  },
});
