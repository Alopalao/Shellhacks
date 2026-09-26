// "Related BRIAN lesson" card under an AI answer: a short, sourced lesson on the same topic.
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppText, Card } from '@/components/ui';
import { LessonIconTile, categoryTitle, lessonHref, readTimeLabel } from '@/features/lessons';
import type { Lesson } from '@/lessons';
import { colors, spacing } from '@/theme';

export interface RelatedLessonCardProps {
  lesson: Lesson;
}

export function RelatedLessonCard({ lesson }: RelatedLessonCardProps) {
  const meta = `${categoryTitle(lesson.categoryId)} · ${readTimeLabel(lesson.readMinutes)}`;
  return (
    <Card
      variant="yellow"
      padding="md"
      onPress={() => router.push(lessonHref(lesson.id))}
      accessibilityLabel={`Related BRIAN lesson: ${lesson.title}. ${meta}`}
      accessibilityHint="Opens the lesson"
      style={styles.card}
    >
      <View style={styles.row}>
        <LessonIconTile icon={lesson.icon} size={40} variant="white" />
        <View style={styles.texts}>
          <AppText variant="caption" tone="muted" numberOfLines={1}>
            Related BRIAN lesson
          </AppText>
          <AppText variant="bodyStrong" numberOfLines={2}>
            {lesson.title}
          </AppText>
          <AppText variant="small" tone="muted" numberOfLines={1}>
            {meta}
          </AppText>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.text} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  texts: { flex: 1, gap: 2 },
});
