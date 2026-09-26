// Lesson registry — aggregates every content file. Do not edit content here.
import type { Lesson, LessonCategoryId } from './types';
import { lessonCategories, categoryById } from './categories';
import { lessons as healthcareSystem } from './content/healthcare-system';
import { lessons as insurance } from './content/insurance';
import { lessons as rightsLiability } from './content/rights-liability';
import { lessons as emergencies } from './content/emergencies';
import { lessons as illness } from './content/illness';
import { lessons as cosmetic } from './content/cosmetic';
import { lessons as medications } from './content/medications';
import { lessons as wellness } from './content/wellness';

export * from './types';
export { lessonCategories, categoryById };

export const allLessons: Lesson[] = [
  ...emergencies,
  ...illness,
  ...healthcareSystem,
  ...insurance,
  ...rightsLiability,
  ...medications,
  ...cosmetic,
  ...wellness,
];

const byId = new Map(allLessons.map((l) => [l.id, l]));

export function getLesson(id: string): Lesson | undefined {
  return byId.get(id);
}

export function lessonsInCategory(categoryId: LessonCategoryId): Lesson[] {
  return allLessons.filter((l) => l.categoryId === categoryId);
}

export function searchLessons(query: string): Lesson[] {
  const q = query.trim().toLowerCase();
  if (!q) return allLessons;
  return allLessons.filter((l) =>
    [l.title, l.summary, ...l.tags, ...l.sections.map((s) => s.heading)].some((t) => t.toLowerCase().includes(q)),
  );
}
