// The lesson reader body: hero, callout, sections, key takeaways, quiz, sources, Ask BRIAN,
// completion, previous/next and the footer disclaimer. Render it keyed by lesson id so the quiz
// state resets when the lesson changes.
import { StyleSheet, View } from 'react-native';
import { AppText, Badge, Disclaimer, Divider, Markdown, useToast } from '@/components/ui';
import { categoryById, type Lesson } from '@/lessons';
import { spacing } from '@/theme';
import { AskBrianPrompts } from './AskBrianPrompts';
import { KeyTakeaways } from './KeyTakeaways';
import { LESSON_DISCLAIMER, readTimeLabel, reviewedLabel, validQuizQuestions } from './helpers';
import { LessonCallout } from './LessonCallout';
import { LessonIconTile } from './LessonCards';
import { LessonCompletion } from './LessonCompletion';
import { LessonPager } from './LessonPager';
import { LessonQuiz } from './LessonQuiz';
import { LessonSources } from './LessonSources';
import { markLessonComplete, markLessonIncomplete, useLessonProgress } from './progress';

export interface LessonReaderProps {
  lesson: Lesson;
}

export function LessonReader({ lesson }: LessonReaderProps) {
  const progress = useLessonProgress();
  const toast = useToast();
  const completedAt = progress.completed[lesson.id];
  const quizResult = progress.quiz[lesson.id];
  const questions = validQuizQuestions(lesson.quiz);
  const sections = lesson.sections.filter((s) => s.heading.trim() || s.body.trim());

  const complete = () => {
    void markLessonComplete(lesson.id).then(() =>
      toast.success('Lesson complete', 'Nice work! Your progress is saved on this device.'),
    );
  };
  const undo = () => {
    void markLessonIncomplete(lesson.id);
  };

  return (
    <View style={styles.container}>
      <LessonHero lesson={lesson} completed={!!completedAt} />

      {lesson.callout?.text ? <LessonCallout callout={lesson.callout} /> : null}

      <View style={styles.sections}>
        {sections.map((section, i) => (
          <View key={`${i}-${section.heading}`} style={styles.section}>
            {section.heading ? <AppText variant="title2">{section.heading}</AppText> : null}
            <Markdown text={section.body} variant="lead" />
          </View>
        ))}
      </View>

      <KeyTakeaways items={lesson.keyTakeaways} />

      <LessonQuiz lessonId={lesson.id} questions={questions} previous={quizResult} />

      <LessonSources sources={lesson.sources} />

      <AskBrianPrompts lesson={lesson} />

      <LessonCompletion completedAt={completedAt} onComplete={complete} onUndo={undo} />

      <Divider />

      <LessonPager lesson={lesson} />

      <Disclaimer text={LESSON_DISCLAIMER} />
    </View>
  );
}

function LessonHero({ lesson, completed }: { lesson: Lesson; completed: boolean }) {
  const category = categoryById[lesson.categoryId];
  const reviewed = reviewedLabel(lesson.lastReviewed);
  return (
    <View style={styles.hero}>
      <LessonIconTile icon={lesson.icon} size={56} variant="solid" completed={completed} />
      <AppText variant="title1">{lesson.title}</AppText>
      {lesson.summary ? (
        <AppText variant="lead" tone="muted">
          {lesson.summary}
        </AppText>
      ) : null}
      <View style={styles.meta}>
        {category ? (
          <Badge label={category.title} tone="yellow" icon={category.icon} size="md" accessibilityLabel={`Topic: ${category.title}`} />
        ) : null}
        <Badge label={readTimeLabel(lesson.readMinutes)} tone="outline" icon="time-outline" size="md" />
        <Badge label={lesson.level} tone="outline" icon="bar-chart-outline" size="md" accessibilityLabel={`Level: ${lesson.level}`} />
        {completed ? <Badge label="Completed" tone="success" icon="checkmark-circle" size="md" /> : null}
      </View>
      {reviewed ? (
        <AppText variant="caption" tone="muted">
          Figures checked {reviewed}. Costs and limits change every year, so confirm current amounts with the sources below.
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xl },
  hero: { gap: spacing.md },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  sections: { gap: spacing.xl },
  section: { gap: spacing.sm },
});
