// Previous / next lesson within the same category.
import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui';
import type { Lesson } from '@/lessons';
import { colors, radius, spacing } from '@/theme';
import { categoryHref, categoryTitle, lessonHref, lessonNeighbors } from './helpers';

export interface LessonPagerProps {
  lesson: Lesson;
}

export function LessonPager({ lesson }: LessonPagerProps) {
  const { previous, next, position, total } = lessonNeighbors(lesson);
  const topic = categoryTitle(lesson.categoryId);
  // Replace (not push) so Back still returns to wherever the reader was opened from.
  const go = (href: Href) => router.replace(href);
  // Pops back to the topic list if it's in the stack, otherwise replaces this screen with it.
  const backToTopic = () => router.dismissTo(categoryHref(lesson.categoryId));

  return (
    <View style={styles.container}>
      {total > 1 && position > 0 ? (
        <AppText variant="caption" tone="muted" align="center">
          Lesson {position} of {total} in {topic}
        </AppText>
      ) : null}
      <View style={styles.row}>
        {previous ? (
          <PagerButton
            direction="previous"
            eyebrow="Previous"
            title={previous.title}
            onPress={() => go(lessonHref(previous.id))}
          />
        ) : null}
        {next ? (
          <PagerButton direction="next" eyebrow="Next lesson" title={next.title} onPress={() => go(lessonHref(next.id))} />
        ) : (
          <PagerButton
            direction="next"
            eyebrow="You reached the end"
            title={`Back to ${topic}`}
            icon="grid-outline"
            onPress={backToTopic}
          />
        )}
      </View>
    </View>
  );
}

interface PagerButtonProps {
  direction: 'previous' | 'next';
  eyebrow: string;
  title: string;
  icon?: 'grid-outline';
  onPress: () => void;
}

function PagerButton({ direction, eyebrow, title, icon, onPress }: PagerButtonProps) {
  const isNext = direction === 'next';
  const arrow = icon ?? (isNext ? 'arrow-forward' : 'arrow-back');
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${eyebrow}: ${title}`}
      style={({ pressed }) => [styles.button, isNext ? styles.next : styles.previous, pressed && styles.pressed]}
    >
      {!isNext ? <Ionicons name={arrow} size={18} color={colors.text} /> : null}
      <View style={[styles.texts, isNext && styles.textsNext]}>
        <AppText variant="caption" tone="muted" numberOfLines={1}>
          {eyebrow}
        </AppText>
        <AppText variant="bodyStrong" numberOfLines={3} align={isNext ? 'right' : 'left'}>
          {title}
        </AppText>
      </View>
      {isNext ? <Ionicons name={arrow} size={18} color={colors.text} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm, alignItems: 'stretch' },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 64,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.lg,
    borderWidth: 1.5,
  },
  previous: { backgroundColor: colors.white, borderColor: colors.border },
  next: { backgroundColor: colors.yellowLight, borderColor: colors.yellowBorder },
  pressed: { opacity: 0.85 },
  texts: { flex: 1, gap: 2 },
  textsNext: { alignItems: 'flex-end' },
});
