// Lesson list/grid building blocks: icon tile, lesson card, compact list row, featured card,
// "continue reading" card.
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { AppText, Badge, Card, ListItem, type IoniconName } from '@/components/ui';
import type { Lesson } from '@/lessons';
import { colors, radius, spacing } from '@/theme';
import { categoryTitle, lessonHref, readTimeLabel } from './helpers';
import type { QuizResult } from './progress';

// ───────────────────────── Icon tile ─────────────────────────

export interface LessonIconTileProps {
  icon: IoniconName;
  /** Tile edge in px (default 44). */
  size?: number;
  /** yellow = light-yellow tile (default) · white = for use on yellow surfaces · solid = sunny yellow. */
  variant?: 'yellow' | 'white' | 'solid';
  /** Shows a small green check in the corner. */
  completed?: boolean;
  style?: StyleProp<ViewStyle>;
}

const TILE_BG: Record<NonNullable<LessonIconTileProps['variant']>, string> = {
  yellow: colors.yellowLight,
  white: colors.white,
  solid: colors.yellow,
};

/** Rounded icon square used for lessons and topics. Decorative (hidden from screen readers). */
export function LessonIconTile({ icon, size = 44, variant = 'yellow', completed, style }: LessonIconTileProps) {
  return (
    <View
      style={[styles.tile, { width: size, height: size, backgroundColor: TILE_BG[variant] }, style]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Ionicons name={icon} size={Math.round(size * 0.5)} color={colors.text} />
      {completed ? (
        <View style={styles.tileCheck}>
          <Ionicons name="checkmark" size={11} color={colors.white} />
        </View>
      ) : null}
    </View>
  );
}

// ───────────────────────── Meta line ─────────────────────────

function MetaItem({ icon, label }: { icon: IoniconName; label: string }) {
  return (
    <View style={styles.metaItem}>
      <Ionicons name={icon} size={13} color={colors.textMuted} />
      <AppText variant="caption" tone="muted" numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}

function lessonA11yLabel(lesson: Lesson, completed: boolean, quiz?: QuizResult, showCategory?: boolean): string {
  return [
    lesson.title,
    showCategory ? categoryTitle(lesson.categoryId) : null,
    readTimeLabel(lesson.readMinutes),
    lesson.level,
    completed ? 'Completed' : null,
    quiz ? `Best quiz score ${quiz.best} of ${quiz.total}` : null,
  ]
    .filter(Boolean)
    .join('. ');
}

// ───────────────────────── Lesson card ─────────────────────────

export interface LessonCardProps {
  lesson: Lesson;
  completed?: boolean;
  quiz?: QuizResult;
  /** Show the topic name in the meta line (search results, mixed lists). */
  showCategory?: boolean;
  /** Small yellow tag above the title, e.g. "Up next". */
  highlight?: string;
  /** Defaults to opening the lesson. */
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

/** Full lesson card: icon, title, summary, read time, level, completed ✓. */
export function LessonCard({ lesson, completed = false, quiz, showCategory, highlight, onPress, style }: LessonCardProps) {
  return (
    <Card
      onPress={onPress ?? (() => router.push(lessonHref(lesson.id)))}
      accessibilityLabel={lessonA11yLabel(lesson, completed, quiz, showCategory)}
      accessibilityHint="Opens the lesson"
      style={style}
    >
      <View style={styles.cardRow}>
        <LessonIconTile icon={lesson.icon} completed={completed} />
        <View style={styles.cardBody}>
          {highlight ? <Badge label={highlight} tone="yellow" icon="arrow-forward" /> : null}
          <AppText variant="title3" numberOfLines={3}>
            {lesson.title}
          </AppText>
          <AppText variant="small" tone="muted" numberOfLines={3}>
            {lesson.summary}
          </AppText>
          <View style={styles.metaRow}>
            {showCategory ? <MetaItem icon="folder-open-outline" label={categoryTitle(lesson.categoryId)} /> : null}
            <MetaItem icon="time-outline" label={readTimeLabel(lesson.readMinutes)} />
            <MetaItem icon="bar-chart-outline" label={lesson.level} />
            {quiz ? <MetaItem icon="ribbon-outline" label={`Quiz ${quiz.best}/${quiz.total}`} /> : null}
          </View>
          {completed ? <Badge label="Completed" tone="success" icon="checkmark-circle" /> : null}
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} style={styles.chevron} />
      </View>
    </Card>
  );
}

// ───────────────────────── Compact row ─────────────────────────

export interface LessonListItemProps {
  lesson: Lesson;
  completed?: boolean;
  /** Show the topic name in the subtitle (default true). */
  showCategory?: boolean;
  onPress?: () => void;
}

/** Compact lesson row for search results. */
export function LessonListItem({ lesson, completed = false, showCategory = true, onPress }: LessonListItemProps) {
  const subtitle = [showCategory ? categoryTitle(lesson.categoryId) : null, readTimeLabel(lesson.readMinutes), lesson.level]
    .filter(Boolean)
    .join(' · ');
  return (
    <ListItem
      title={lesson.title}
      titleLines={2}
      subtitle={subtitle}
      left={<LessonIconTile icon={lesson.icon} size={40} completed={completed} />}
      right={
        completed ? (
          <Ionicons name="checkmark-circle" size={20} color={colors.success} accessibilityElementsHidden />
        ) : undefined
      }
      onPress={onPress ?? (() => router.push(lessonHref(lesson.id)))}
      accessibilityLabel={lessonA11yLabel(lesson, completed, undefined, showCategory)}
      accessibilityHint="Opens the lesson"
    />
  );
}

// ───────────────────────── Featured card ─────────────────────────

export interface FeaturedLessonCardProps {
  lesson: Lesson;
  completed?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Light-yellow "Start here" card. */
export function FeaturedLessonCard({ lesson, completed = false, style }: FeaturedLessonCardProps) {
  return (
    <Card
      variant="yellow"
      onPress={() => router.push(lessonHref(lesson.id))}
      accessibilityLabel={`Start here: ${lessonA11yLabel(lesson, completed, undefined, true)}`}
      accessibilityHint="Opens the lesson"
      style={[styles.featured, style]}
    >
      <View style={styles.featuredTop}>
        <LessonIconTile icon={lesson.icon} size={48} variant="white" completed={completed} />
        {completed ? <Badge label="Done" tone="success" icon="checkmark" /> : null}
      </View>
      <View style={styles.featuredBody}>
        <AppText variant="caption" tone="muted" numberOfLines={1}>
          {categoryTitle(lesson.categoryId).toUpperCase()}
        </AppText>
        <AppText variant="title3" numberOfLines={3}>
          {lesson.title}
        </AppText>
      </View>
      <View style={styles.featuredFooter}>
        <MetaItem icon="time-outline" label={readTimeLabel(lesson.readMinutes)} />
        <View style={styles.featuredCta}>
          <AppText variant="label">{completed ? 'Review' : 'Start'}</AppText>
          <Ionicons name="arrow-forward" size={14} color={colors.text} />
        </View>
      </View>
    </Card>
  );
}

// ───────────────────────── Continue reading ─────────────────────────

export interface ContinueReadingCardProps {
  lesson: Lesson;
  completed?: boolean;
}

/** Big dark card that jumps back into the last opened lesson. */
export function ContinueReadingCard({ lesson, completed = false }: ContinueReadingCardProps) {
  const eyebrow = completed ? 'Recently read' : 'Continue reading';
  return (
    <Card
      variant="dark"
      onPress={() => router.push(lessonHref(lesson.id))}
      accessibilityLabel={`${eyebrow}: ${lesson.title}. ${categoryTitle(lesson.categoryId)}. ${readTimeLabel(lesson.readMinutes)}`}
      accessibilityHint="Opens the lesson"
    >
      <View style={styles.cardRow}>
        <LessonIconTile icon={lesson.icon} size={48} variant="solid" completed={completed} />
        <View style={styles.cardBody}>
          <AppText variant="caption" color={colors.yellow} numberOfLines={1}>
            {eyebrow.toUpperCase()}
          </AppText>
          <AppText variant="title3" tone="inverse" numberOfLines={2}>
            {lesson.title}
          </AppText>
          <AppText variant="small" color={colors.border} numberOfLines={2}>
            {categoryTitle(lesson.categoryId)} · {readTimeLabel(lesson.readMinutes)}
          </AppText>
        </View>
        <View style={styles.continueArrow}>
          <Ionicons name="arrow-forward" size={20} color={colors.textOnYellow} />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  tile: { borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  tileCheck: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  cardBody: { flex: 1, gap: spacing.xs + 2 },
  chevron: { alignSelf: 'center' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: spacing.md, rowGap: spacing.xs },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  featured: { gap: spacing.md, minHeight: 200 },
  featuredTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  featuredBody: { flex: 1, gap: spacing.xs },
  featuredFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  featuredCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    minHeight: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.yellow,
  },
  continueArrow: {
    alignSelf: 'center',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
