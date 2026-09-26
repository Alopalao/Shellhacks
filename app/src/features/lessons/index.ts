// Lessons feature (patient "Learn" tab). Import from '@/features/lessons'.
export {
  LESSON_PROGRESS_STORAGE_KEY,
  countCompleted,
  getLessonProgress,
  isLessonComplete,
  loadLessonProgress,
  markLessonComplete,
  markLessonIncomplete,
  recordQuizResult,
  resetLessonProgress,
  setLastOpenedLesson,
  useLessonProgress,
  type LastOpenedLesson,
  type LessonProgress,
  type LessonProgressData,
  type QuizResult,
} from './progress';
export {
  LESSONS_HOME_HREF,
  LESSON_DISCLAIMER,
  allCategoryStats,
  askBrianHref,
  categoryHref,
  categoryStats,
  categoryTitle,
  featuredLessons,
  findCategory,
  lessonHref,
  lessonNeighbors,
  lessonPrompts,
  paramValue,
  rankLessonSearch,
  readTimeLabel,
  relatedLesson,
  sourceHost,
  validQuizQuestions,
  type CategoryStats,
  type LessonNeighbors,
} from './helpers';
export {
  ContinueReadingCard,
  FeaturedLessonCard,
  LessonCard,
  LessonIconTile,
  LessonListItem,
  type ContinueReadingCardProps,
  type FeaturedLessonCardProps,
  type LessonCardProps,
  type LessonIconTileProps,
  type LessonListItemProps,
} from './LessonCards';
export { CategoryGrid, CategoryTile, type CategoryGridProps, type CategoryTileProps } from './CategoryGrid';
export { ProgressSummary, type ProgressSummaryProps } from './ProgressSummary';
export { LessonCallout, type LessonCalloutProps } from './LessonCallout';
export { KeyTakeaways, type KeyTakeawaysProps } from './KeyTakeaways';
export { LessonQuiz, type LessonQuizProps } from './LessonQuiz';
export { LessonSources, type LessonSourcesProps } from './LessonSources';
export { AskBrianPrompts, type AskBrianPromptsProps } from './AskBrianPrompts';
export { LessonCompletion, type LessonCompletionProps } from './LessonCompletion';
export { LessonPager, type LessonPagerProps } from './LessonPager';
export { LessonReader, type LessonReaderProps } from './LessonReader';
export { LessonsNotFound, type LessonsNotFoundProps } from './LessonsNotFound';
