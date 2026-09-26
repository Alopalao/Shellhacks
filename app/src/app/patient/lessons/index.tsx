// Learn home: progress, search, continue reading, "Start here", topic grid.
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  AppText,
  Disclaimer,
  EmptyState,
  IconButton,
  Input,
  Screen,
  ScreenHeader,
  SectionHeader,
} from '@/components/ui';
import {
  CategoryGrid,
  ContinueReadingCard,
  FeaturedLessonCard,
  LESSON_DISCLAIMER,
  LessonListItem,
  ProgressSummary,
  allCategoryStats,
  countCompleted,
  featuredLessons,
  rankLessonSearch,
  useLessonProgress,
} from '@/features/lessons';
import { useBreakpoint, useDebounced } from '@/hooks';
import { allLessons, getLesson, lessonCategories } from '@/lessons';
import { pluralize } from '@/lib/format';
import { spacing } from '@/theme';

/** Wider than reading screens so the topic grid can use 3–4 columns on tablets/desktop. */
const MAX_WIDTH = 1040;

export default function LessonsHomeScreen() {
  const progress = useLessonProgress();
  const { width } = useBreakpoint();
  const [query, setQuery] = useState('');
  const trimmed = query.trim();
  const debounced = useDebounced(trimmed, 250);
  const searching = trimmed.length > 0;
  const pending = trimmed !== debounced;
  const results = useMemo(() => rankLessonSearch(debounced), [debounced]);

  const stats = useMemo(() => allCategoryStats(progress), [progress]);
  const featured = useMemo(() => featuredLessons(), []);
  const totalLessons = allLessons.length;
  const completed = countCompleted(progress, allLessons);
  const quizStats = useMemo(() => {
    const known = Object.entries(progress.quiz).filter(([id]) => !!getLesson(id));
    return { taken: known.length, perfect: known.filter(([, r]) => r.best === r.total).length };
  }, [progress.quiz]);
  const lastLesson = progress.lastOpened ? getLesson(progress.lastOpened.id) : undefined;

  const contentWidth = Math.min(width, MAX_WIDTH) - spacing.lg * 2;
  const columns = contentWidth >= 820 ? 4 : contentWidth >= 540 ? 3 : 2;
  const featuredInline = contentWidth >= 620;
  const featuredCardWidth = Math.min(300, Math.max(220, Math.round(contentWidth * 0.78)));

  return (
    <Screen
      maxWidth={MAX_WIDTH}
      gap="xl"
      header={<ScreenHeader title="Learn" subtitle="Short, plain-language guides to your health, care and costs." />}
    >
      <ProgressSummary
        ready={progress.ready}
        completed={completed}
        total={totalLessons}
        quizzesTaken={quizStats.taken}
        perfectQuizzes={quizStats.perfect}
      />

      <Input
        value={query}
        onChangeText={setQuery}
        placeholder="Search lessons, e.g. stroke, deductible, acne"
        accessibilityLabel="Search lessons"
        leftIcon="search"
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        inputMode="search"
        right={
          query ? (
            <IconButton icon="close-circle" accessibilityLabel="Clear search" size={36} onPress={() => setQuery('')} />
          ) : null
        }
      />

      {searching ? (
        <View style={styles.block}>
          {debounced ? (
            <SectionHeader
              title={`${pluralize(results.length, 'result')} for “${debounced}”`}
              subtitle={results.length ? 'Tap a lesson to start reading.' : undefined}
            />
          ) : null}
          {!debounced && pending ? (
            <AppText variant="small" tone="muted" accessibilityLiveRegion="polite">
              Searching…
            </AppText>
          ) : results.length ? (
            <View accessibilityRole="list">
              {results.map((lesson) => (
                <LessonListItem key={lesson.id} lesson={lesson} completed={!!progress.completed[lesson.id]} />
              ))}
            </View>
          ) : pending ? null : (
            <EmptyState
              compact
              icon="search-outline"
              title="No lessons found"
              message="Try a simpler word, like “insurance”, “fever” or “stroke”."
              actionLabel="Clear search"
              onAction={() => setQuery('')}
            />
          )}
        </View>
      ) : (
        <>
          {lastLesson ? (
            <ContinueReadingCard lesson={lastLesson} completed={!!progress.completed[lastLesson.id]} />
          ) : null}

          {totalLessons === 0 ? (
            <EmptyState
              compact
              icon="book-outline"
              title="Lessons are on the way"
              message="We're still writing BRIAN's health lessons. Check back soon."
            />
          ) : (
            <View style={styles.block}>
              <SectionHeader title="Start here" icon="flag-outline" subtitle="Three essentials everyone should know." />
              {featuredInline ? (
                <View style={styles.featuredRow}>
                  {featured.map((lesson) => (
                    <FeaturedLessonCard
                      key={lesson.id}
                      lesson={lesson}
                      completed={!!progress.completed[lesson.id]}
                      style={styles.featuredInline}
                    />
                  ))}
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.featuredScroll}
                  contentContainerStyle={styles.featuredScrollContent}
                  snapToInterval={featuredCardWidth + spacing.md}
                  decelerationRate="fast"
                  accessibilityRole="list"
                >
                  {featured.map((lesson) => (
                    <FeaturedLessonCard
                      key={lesson.id}
                      lesson={lesson}
                      completed={!!progress.completed[lesson.id]}
                      style={{ width: featuredCardWidth }}
                    />
                  ))}
                </ScrollView>
              )}
            </View>
          )}

          <View style={styles.block}>
            <SectionHeader
              title="Browse by topic"
              icon="grid-outline"
              subtitle={`${pluralize(lessonCategories.length, 'topic')} · ${pluralize(totalLessons, 'lesson')}`}
            />
            <CategoryGrid stats={stats} columns={columns} />
          </View>

        </>
      )}

      <Disclaimer text={LESSON_DISCLAIMER} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: { gap: spacing.md },
  featuredRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'stretch' },
  featuredInline: { flex: 1 },
  featuredScroll: { marginHorizontal: -spacing.lg },
  featuredScrollContent: { paddingHorizontal: spacing.lg, gap: spacing.md },
});
