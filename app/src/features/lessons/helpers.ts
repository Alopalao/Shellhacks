// Pure helpers for the lessons feature: routes, featured picks, ranked search, category stats.
import type { Href } from 'expo-router';
import {
  allLessons,
  categoryById,
  lessonCategories,
  lessonsInCategory,
  searchLessons,
  type Lesson,
  type LessonCategory,
  type LessonCategoryId,
  type QuizQuestion,
} from '@/lessons';
import { countCompleted, type LessonProgressData } from './progress';

export const LESSONS_HOME_HREF = '/patient/lessons' as const;

/** Footer note on every lesson screen. */
export const LESSON_DISCLAIMER =
  'Educational information, US-focused where noted. Not medical or legal advice.';

export function lessonHref(lessonId: string): Href {
  return `/patient/lessons/${encodeURIComponent(lessonId)}`;
}

export function categoryHref(categoryId: LessonCategoryId): Href {
  return `/patient/lessons/category/${categoryId}`;
}

/** Deep link into BRIAN AI with a lesson follow-up question that is sent automatically. */
export function askBrianHref(lesson: Pick<Lesson, 'id' | 'title'>, prompt: string): Href {
  const params: [string, string][] = [
    ['mode', 'lesson'],
    ['lessonId', lesson.id],
    ['lessonTitle', lesson.title],
    ['prompt', prompt],
    ['autoSend', '1'],
  ];
  const query = params.map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&');
  return `/patient/ai?${query}`;
}

/** Follow-up prompts for a lesson (falls back to a generic question if the lesson has none). */
export function lessonPrompts(lesson: Lesson): string[] {
  const prompts = lesson.askBrianPrompts.map((p) => p.trim()).filter(Boolean);
  return prompts.length ? prompts : [`Can you explain "${lesson.title}" in simple terms?`];
}

/** Normalizes a route param (`string | string[] | undefined`) to a single string. */
export function paramValue(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v ? v : undefined;
}

export function findCategory(categoryId: string | undefined): LessonCategory | undefined {
  if (!categoryId) return undefined;
  return lessonCategories.find((c) => c.id === categoryId);
}

export function categoryTitle(categoryId: LessonCategoryId): string {
  return categoryById[categoryId]?.title ?? 'Lessons';
}

/** Keywords for the "Start here" row, in display order. */
const FEATURED_KEYWORDS = ['stroke', 'insurance', 'where-to-go'] as const;

/**
 * "Start here" picks: the first lesson whose id contains each keyword (stroke, insurance,
 * where-to-go), topped up with the first lessons in the library.
 */
export function featuredLessons(lessons: readonly Lesson[] = allLessons, count = 3): Lesson[] {
  const picked: Lesson[] = [];
  const seen = new Set<string>();
  const add = (lesson: Lesson | undefined) => {
    if (!lesson || seen.has(lesson.id) || picked.length >= count) return;
    picked.push(lesson);
    seen.add(lesson.id);
  };
  for (const keyword of FEATURED_KEYWORDS) add(lessons.find((l) => l.id.includes(keyword)));
  for (const lesson of lessons) add(lesson);
  return picked;
}

/**
 * Registry search with relevance ordering: title matches first, then tag / category matches,
 * then summary and section headings. Returns [] for an empty query.
 */
export function rankLessonSearch(query: string): Lesson[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const matches = new Map<string, Lesson>();
  for (const lesson of searchLessons(q)) matches.set(lesson.id, lesson);
  // Also match the topic name ("insurance", "cosmetic") even when a lesson's own text doesn't.
  for (const category of lessonCategories) {
    if (category.title.toLowerCase().includes(q)) {
      for (const lesson of lessonsInCategory(category.id)) if (!matches.has(lesson.id)) matches.set(lesson.id, lesson);
    }
  }
  const score = (lesson: Lesson): number => {
    const title = lesson.title.toLowerCase();
    if (title.startsWith(q)) return 0;
    if (title.includes(q)) return 1;
    if (lesson.tags.some((t) => t.toLowerCase().includes(q))) return 2;
    if (categoryTitle(lesson.categoryId).toLowerCase().includes(q)) return 3;
    return 4;
  };
  const order = new Map(allLessons.map((l, i) => [l.id, i]));
  return [...matches.values()].sort(
    (a, b) => score(a) - score(b) || (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0),
  );
}

export interface CategoryStats {
  category: LessonCategory;
  lessons: Lesson[];
  total: number;
  completed: number;
  totalMinutes: number;
}

export function categoryStats(category: LessonCategory, progress: LessonProgressData): CategoryStats {
  const lessons = lessonsInCategory(category.id);
  return {
    category,
    lessons,
    total: lessons.length,
    completed: countCompleted(progress, lessons),
    totalMinutes: lessons.reduce((sum, l) => sum + Math.max(0, l.readMinutes || 0), 0),
  };
}

export function allCategoryStats(progress: LessonProgressData): CategoryStats[] {
  return lessonCategories.map((c) => categoryStats(c, progress));
}

export interface LessonNeighbors {
  previous: Lesson | null;
  next: Lesson | null;
  /** 1-based position within the category (0 if not found). */
  position: number;
  total: number;
}

/** Previous/next lesson within the same category. */
export function lessonNeighbors(lesson: Lesson): LessonNeighbors {
  const siblings = lessonsInCategory(lesson.categoryId);
  const index = siblings.findIndex((l) => l.id === lesson.id);
  return {
    previous: index > 0 ? (siblings[index - 1] ?? null) : null,
    next: index >= 0 && index < siblings.length - 1 ? (siblings[index + 1] ?? null) : null,
    position: index + 1,
    total: siblings.length,
  };
}

/** Drops malformed questions so the quiz never shows an unanswerable item. */
export function validQuizQuestions(quiz: readonly QuizQuestion[]): QuizQuestion[] {
  return quiz.filter(
    (q) =>
      q.question.trim().length > 0 &&
      q.options.length >= 2 &&
      Number.isInteger(q.answerIndex) &&
      q.answerIndex >= 0 &&
      q.answerIndex < q.options.length,
  );
}

/** "4 min read" */
export function readTimeLabel(minutes: number): string {
  const m = Math.max(1, Math.round(minutes || 0));
  return `${m} min read`;
}

/** Host name for a source URL ("medlineplus.gov"), or '' if the URL can't be parsed. */
export function sourceHost(url: string): string {
  const match = /^https?:\/\/([^/?#]+)/i.exec(url.trim());
  return match?.[1]?.replace(/^www\./i, '') ?? '';
}
