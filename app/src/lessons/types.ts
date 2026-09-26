// Lesson content model. Content lives in src/lessons/content/<category>.ts.
//
// Text format ("markdown-lite", rendered by the shared <Markdown> component):
//   - Paragraphs are separated by a blank line ("\n\n").
//   - Lines starting with "- " are bullets; lines starting with "1. ", "2. " … are numbered steps.
//   - **bold** for emphasis. No headings inside a section body (the section heading is separate), no HTML, no links inline.

import type { Ionicons } from '@expo/vector-icons';

export type IoniconName = keyof typeof Ionicons.glyphMap;

export type LessonCategoryId =
  | 'healthcare-system'
  | 'insurance'
  | 'rights-liability'
  | 'emergencies'
  | 'illness'
  | 'cosmetic'
  | 'medications'
  | 'wellness';

export interface LessonCategory {
  id: LessonCategoryId;
  title: string;
  description: string;
  icon: IoniconName;
}

export interface LessonSection {
  heading: string;
  body: string; // markdown-lite, ~60–180 words
}

export interface QuizQuestion {
  question: string;
  options: string[]; // 3–4 options
  answerIndex: number; // index into options
  explanation: string; // shown after answering
}

export interface LessonSource {
  title: string; // page title as published
  publisher: string; // e.g. "NIH MedlinePlus", "CDC", "HealthCare.gov", "FDA"
  url: string; // real, stable URL (verified to resolve)
}

export interface LessonCallout {
  kind: 'emergency' | 'warning' | 'tip';
  text: string;
}

export interface Lesson {
  id: string; // kebab-case, globally unique, e.g. "stroke-be-fast"
  categoryId: LessonCategoryId;
  title: string;
  summary: string; // one or two sentences for list cards
  readMinutes: number;
  level: 'Basics' | 'Intermediate';
  icon: IoniconName;
  callout?: LessonCallout; // shown at the top (emergency lessons MUST have kind 'emergency' with 911 guidance)
  sections: LessonSection[]; // 4–7
  keyTakeaways: string[]; // 3–5 short bullets
  quiz: QuizQuestion[]; // exactly 3
  sources: LessonSource[]; // 2–5
  askBrianPrompts: string[]; // 2–3 follow-up questions the user can send to BRIAN AI
  tags: string[]; // search keywords
  lastReviewed?: string; // 'YYYY-MM' when time-sensitive figures (costs, limits, deadlines) were last checked
}
