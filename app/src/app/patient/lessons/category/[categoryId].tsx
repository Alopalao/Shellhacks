// Topic screen: header + description + progress, then every lesson in the topic.
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppText, Card, Disclaimer, EmptyState, ProgressBar, Screen, ScreenHeader } from '@/components/ui';
import {
  LESSONS_HOME_HREF,
  LESSON_DISCLAIMER,
  LessonCard,
  LessonIconTile,
  LessonsNotFound,
  categoryStats,
  findCategory,
  paramValue,
  useLessonProgress,
} from '@/features/lessons';
import { pluralize } from '@/lib/format';
import { colors, spacing } from '@/theme';

export default function LessonCategoryScreen() {
  const params = useLocalSearchParams<{ categoryId?: string | string[] }>();
  const category = findCategory(paramValue(params.categoryId));
  const progress = useLessonProgress();

  if (!category) {
    return (
      <LessonsNotFound
        title="Topic"
        heading="Topic not found"
        message="We couldn't find that topic. It may have been renamed. Browse all topics instead."
      />
    );
  }

  const { lessons, total, completed, totalMinutes } = categoryStats(category, progress);
  const upNext = completed > 0 && completed < total ? lessons.find((l) => !progress.completed[l.id]) : undefined;

  return (
    <Screen header={<ScreenHeader title={category.title} back={LESSONS_HOME_HREF} />} gap="lg">
      <Card variant="yellow" padding="lg" style={styles.intro}>
        <View style={styles.introRow}>
          <LessonIconTile icon={category.icon} size={52} variant="white" />
          <View style={styles.flex}>
            <AppText variant="body">{category.description}</AppText>
          </View>
        </View>
        {total > 0 ? (
          <View style={styles.progress}>
            <View style={styles.progressText}>
              <AppText variant="label">
                {completed} of {pluralize(total, 'lesson')} completed
              </AppText>
              <AppText variant="caption" tone="muted">
                About {totalMinutes} min total
              </AppText>
            </View>
            <ProgressBar
              value={completed / total}
              height={8}
              accessibilityLabel={`${category.title}: ${completed} of ${total} lessons completed`}
              style={styles.track}
            />
          </View>
        ) : null}
      </Card>

      {total === 0 ? (
        <EmptyState
          icon="book-outline"
          title="Lessons coming soon"
          message="We're still writing lessons for this topic. Check back soon, or explore another topic."
          actionLabel="Browse all topics"
          onAction={() => router.dismissTo(LESSONS_HOME_HREF)}
        />
      ) : (
        <View style={styles.list} accessibilityRole="list">
          {lessons.map((lesson) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              completed={!!progress.completed[lesson.id]}
              quiz={progress.quiz[lesson.id]}
              highlight={upNext?.id === lesson.id ? 'Up next' : undefined}
            />
          ))}
        </View>
      )}

      <Disclaimer text={LESSON_DISCLAIMER} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  intro: { gap: spacing.lg },
  introRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  progress: { gap: spacing.sm },
  progressText: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: spacing.sm },
  track: { backgroundColor: colors.white },
  list: { gap: spacing.md },
});
