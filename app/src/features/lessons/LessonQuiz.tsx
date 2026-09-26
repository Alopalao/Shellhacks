// Lesson quiz: tap an answer to reveal whether it's right plus the explanation. When every
// question is answered the score is saved and the lesson is marked complete. Retry resets.
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, Badge, Button, Card, type IoniconName } from '@/components/ui';
import type { QuizQuestion } from '@/lessons';
import { colors, radius, spacing } from '@/theme';
import { recordQuizResult, type QuizResult } from './progress';

export interface LessonQuizProps {
  lessonId: string;
  /** Exactly the lesson's (valid) questions. */
  questions: readonly QuizQuestion[];
  /** Stored result from earlier attempts. */
  previous?: QuizResult;
  /** Called once per finished attempt, after the result has been saved. */
  onFinished?: (correct: number, total: number) => void;
}

type Answers = readonly (number | null)[];

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

function scoreOf(questions: readonly QuizQuestion[], answers: Answers): number {
  return questions.reduce((n, q, i) => (answers[i] === q.answerIndex ? n + 1 : n), 0);
}

function resultMessage(correct: number, total: number): string {
  if (correct === total) return 'Perfect score! This lesson is marked complete.';
  if (correct === 0) return 'Review the explanations above, then give it another try. This lesson is marked complete.';
  return 'Nice work. Review the explanations above or try again. This lesson is marked complete.';
}

export function LessonQuiz({ lessonId, questions, previous, onFinished }: LessonQuizProps) {
  const [answers, setAnswers] = useState<Answers>(() => questions.map(() => null));
  const total = questions.length;
  if (!total) return null;

  const answered = answers.filter((a) => a !== null && a !== undefined).length;
  const finished = answered === total;
  const correct = scoreOf(questions, answers);

  const choose = (questionIndex: number, optionIndex: number) => {
    if (answers[questionIndex] !== null && answers[questionIndex] !== undefined) return;
    const next = questions.map((_, i) => (i === questionIndex ? optionIndex : (answers[i] ?? null)));
    setAnswers(next);
    if (next.every((a) => a !== null)) {
      const score = scoreOf(questions, next);
      void recordQuizResult(lessonId, score, total).then(() => onFinished?.(score, total));
    }
  };

  const retry = () => setAnswers(questions.map(() => null));

  return (
    <Card padding="lg" style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerIcon} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Ionicons name="help" size={20} color={colors.textOnYellow} />
        </View>
        <View style={styles.flex}>
          <AppText variant="title3">Quick quiz</AppText>
          <AppText variant="small" tone="muted">
            {total === 1 ? '1 question' : `${total} questions`} · tap an answer to check it
          </AppText>
        </View>
        {previous ? (
          <Badge
            label={`Best ${previous.best}/${previous.total}`}
            tone={previous.best === previous.total ? 'success' : 'outline'}
            icon="ribbon-outline"
            accessibilityLabel={`Your best score so far: ${previous.best} of ${previous.total}`}
          />
        ) : null}
      </View>

      {questions.map((q, qi) => (
        <QuestionBlock
          key={`${qi}-${q.question}`}
          index={qi}
          total={total}
          question={q}
          selected={answers[qi] ?? null}
          onSelect={(oi) => choose(qi, oi)}
        />
      ))}

      {finished ? (
        <View style={styles.result} accessibilityLiveRegion="polite" accessibilityRole="summary">
          <View style={styles.resultRow}>
            <Ionicons name={correct === total ? 'trophy' : 'ribbon'} size={24} color={colors.text} />
            <AppText variant="title3" style={styles.flex}>
              You got {correct} of {total} right
            </AppText>
          </View>
          <AppText variant="small" tone="muted">
            {resultMessage(correct, total)}
          </AppText>
          <Button title="Try again" icon="refresh" variant="outline" size="sm" onPress={retry} />
        </View>
      ) : (
        <AppText variant="caption" tone="subtle" accessibilityLiveRegion="polite">
          {answered} of {total} answered
        </AppText>
      )}
    </Card>
  );
}

// ───────────────────────── Question ─────────────────────────

interface QuestionBlockProps {
  index: number;
  total: number;
  question: QuizQuestion;
  selected: number | null;
  onSelect: (optionIndex: number) => void;
}

type OptionState = 'idle' | 'chosen-correct' | 'chosen-wrong' | 'answer' | 'dim';

function QuestionBlock({ index, total, question, selected, onSelect }: QuestionBlockProps) {
  const revealed = selected !== null;
  const isCorrect = revealed && selected === question.answerIndex;

  const stateFor = (oi: number): OptionState => {
    if (!revealed) return 'idle';
    if (oi === selected) return oi === question.answerIndex ? 'chosen-correct' : 'chosen-wrong';
    if (oi === question.answerIndex) return 'answer';
    return 'dim';
  };

  return (
    <View style={styles.question} accessibilityRole="radiogroup" accessibilityLabel={`Question ${index + 1} of ${total}`}>
      <AppText variant="caption" tone="muted">
        QUESTION {index + 1} OF {total}
      </AppText>
      <AppText variant="bodyStrong">{question.question}</AppText>
      <View style={styles.options}>
        {question.options.map((option, oi) => (
          <QuizOption
            key={`${oi}-${option}`}
            letter={LETTERS[oi] ?? String(oi + 1)}
            label={option}
            state={stateFor(oi)}
            disabled={revealed}
            onPress={() => onSelect(oi)}
          />
        ))}
      </View>
      {revealed ? (
        <View
          style={[styles.feedback, isCorrect ? styles.feedbackRight : styles.feedbackWrong]}
          accessibilityLiveRegion="polite"
          accessible
          accessibilityLabel={`${isCorrect ? 'Correct.' : 'Not quite.'} ${question.explanation}`}
        >
          <View style={styles.feedbackHead}>
            <Ionicons
              name={isCorrect ? 'checkmark-circle' : 'information-circle'}
              size={18}
              color={isCorrect ? colors.success : colors.danger}
            />
            <AppText variant="label" tone={isCorrect ? 'success' : 'danger'}>
              {isCorrect ? 'Correct!' : 'Not quite'}
            </AppText>
          </View>
          <AppText variant="small">{question.explanation}</AppText>
        </View>
      ) : null}
    </View>
  );
}

// ───────────────────────── Option ─────────────────────────

interface QuizOptionProps {
  letter: string;
  label: string;
  state: OptionState;
  disabled: boolean;
  onPress: () => void;
}

const OPTION_LOOK: Record<OptionState, { bg: string; border: string; icon?: IoniconName; iconColor?: string; suffix: string }> = {
  idle: { bg: colors.white, border: colors.border, suffix: '' },
  'chosen-correct': {
    bg: colors.successLight,
    border: colors.success,
    icon: 'checkmark-circle',
    iconColor: colors.success,
    suffix: ', your answer, correct',
  },
  'chosen-wrong': {
    bg: colors.dangerLight,
    border: colors.danger,
    icon: 'close-circle',
    iconColor: colors.danger,
    suffix: ', your answer, incorrect',
  },
  answer: {
    bg: colors.white,
    border: colors.success,
    icon: 'checkmark-circle-outline',
    iconColor: colors.success,
    suffix: ', correct answer',
  },
  dim: { bg: colors.white, border: colors.border, suffix: '' },
};

function QuizOption({ letter, label, state, disabled, onPress }: QuizOptionProps) {
  const look = OPTION_LOOK[state];
  const chosen = state === 'chosen-correct' || state === 'chosen-wrong';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityLabel={`${letter}. ${label}${look.suffix}`}
      accessibilityState={{ checked: chosen, disabled }}
      style={({ pressed }) => [
        styles.option,
        { backgroundColor: look.bg, borderColor: look.border },
        pressed && !disabled && styles.optionPressed,
        state === 'dim' && styles.optionDim,
      ]}
    >
      <View style={[styles.letter, chosen && styles.letterChosen]}>
        <AppText variant="caption" weight="bold" color={chosen ? colors.textOnBlack : colors.text}>
          {letter}
        </AppText>
      </View>
      <AppText variant="body" style={styles.flex}>
        {label}
      </AppText>
      {look.icon ? <Ionicons name={look.icon} size={20} color={look.iconColor} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.xl },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  question: { gap: spacing.sm },
  options: { gap: spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1.5,
  },
  optionPressed: { backgroundColor: colors.yellowLighter, borderColor: colors.yellow },
  optionDim: { opacity: 0.55 },
  letter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterChosen: { backgroundColor: colors.black, borderColor: colors.black },
  feedback: { gap: spacing.xs, padding: spacing.md, borderRadius: radius.md },
  feedbackRight: { backgroundColor: colors.successLight },
  feedbackWrong: { backgroundColor: colors.dangerLight },
  feedbackHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2 },
  result: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.yellowLight,
    borderWidth: 1,
    borderColor: colors.yellowBorder,
  },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
