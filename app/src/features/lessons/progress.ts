// Lesson progress: completed lessons, quiz results and the last opened lesson.
//
// A tiny module-level store persisted to AsyncStorage (localStorage on web) under
// `brian.lessons.progress`. Every screen reads it through `useLessonProgress()`, so marking a
// lesson complete in the reader instantly updates the Learn home, the category list and the
// progress summary. Writes are serialized; corrupt or foreign data falls back to an empty state.
import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';
import { getJSON, setJSON, STORAGE_PREFIX } from '@/lib/storage';

export const LESSON_PROGRESS_STORAGE_KEY = `${STORAGE_PREFIX}lessons.progress`;
const STORAGE_VERSION = 1;

export interface QuizResult {
  /** Correct answers in the most recent attempt. */
  correct: number;
  /** Number of questions in the most recent attempt. */
  total: number;
  /** Best number of correct answers across attempts. */
  best: number;
  /** How many times the quiz was finished. */
  attempts: number;
  /** ISO timestamp of the most recent attempt. */
  at: string;
}

export interface LastOpenedLesson {
  id: string;
  /** ISO timestamp. */
  at: string;
}

export interface LessonProgressData {
  /** lessonId → ISO timestamp when it was completed. */
  completed: Readonly<Record<string, string>>;
  /** lessonId → latest quiz result. */
  quiz: Readonly<Record<string, QuizResult>>;
  lastOpened: LastOpenedLesson | null;
}

export interface LessonProgress extends LessonProgressData {
  /** false until the stored progress has been read (counts are 0 until then). */
  ready: boolean;
}

interface StoredProgress extends LessonProgressData {
  version: number;
}

const EMPTY: LessonProgressData = { completed: {}, quiz: {}, lastOpened: null };

let state: LessonProgress = { ...EMPTY, ready: false };
let loadPromise: Promise<void> | null = null;
let writeQueue: Promise<void> = Promise.resolve();
let webSyncAttached = false;
const listeners = new Set<() => void>();

// ───────────────────────── Validation ─────────────────────────

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isIsoLike(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && !Number.isNaN(Date.parse(value));
}

function toCount(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : null;
}

/** Turn whatever was stored into a well-formed progress object (drops anything malformed). */
function sanitize(raw: unknown): LessonProgressData {
  if (!isRecord(raw)) return EMPTY;

  const completed: Record<string, string> = {};
  if (isRecord(raw.completed)) {
    for (const [id, at] of Object.entries(raw.completed)) {
      if (id && isIsoLike(at)) completed[id] = at;
    }
  }

  const quiz: Record<string, QuizResult> = {};
  if (isRecord(raw.quiz)) {
    for (const [id, value] of Object.entries(raw.quiz)) {
      if (!id || !isRecord(value)) continue;
      const correct = toCount(value.correct);
      const total = toCount(value.total);
      if (correct === null || total === null || total === 0 || correct > total) continue;
      const best = Math.min(total, Math.max(correct, toCount(value.best) ?? correct));
      quiz[id] = {
        correct,
        total,
        best,
        attempts: Math.max(1, toCount(value.attempts) ?? 1),
        at: isIsoLike(value.at) ? value.at : new Date(0).toISOString(),
      };
    }
  }

  let lastOpened: LastOpenedLesson | null = null;
  if (isRecord(raw.lastOpened) && typeof raw.lastOpened.id === 'string' && raw.lastOpened.id) {
    lastOpened = {
      id: raw.lastOpened.id,
      at: isIsoLike(raw.lastOpened.at) ? raw.lastOpened.at : new Date(0).toISOString(),
    };
  }

  return { completed, quiz, lastOpened };
}

function toStored(data: LessonProgressData): StoredProgress {
  return { version: STORAGE_VERSION, completed: data.completed, quiz: data.quiz, lastOpened: data.lastOpened };
}

// ───────────────────────── Store plumbing ─────────────────────────

function emit(): void {
  listeners.forEach((listener) => listener());
}

function replaceState(data: LessonProgressData): void {
  state = { completed: data.completed, quiz: data.quiz, lastOpened: data.lastOpened, ready: true };
  emit();
}

/** Keep several browser tabs of the same profile in sync (web only). */
function attachWebSync(): void {
  if (webSyncAttached || Platform.OS !== 'web') return;
  if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return;
  webSyncAttached = true;
  window.addEventListener('storage', (event: StorageEvent) => {
    if (event.key !== LESSON_PROGRESS_STORAGE_KEY) return;
    let parsed: unknown = null;
    try {
      parsed = event.newValue ? JSON.parse(event.newValue) : null;
    } catch {
      parsed = null;
    }
    replaceState(sanitize(parsed));
  });
}

/** Read stored progress once (subsequent calls reuse the same promise). Never rejects. */
export function loadLessonProgress(): Promise<void> {
  if (!loadPromise) {
    loadPromise = getJSON<unknown>(LESSON_PROGRESS_STORAGE_KEY)
      .then((raw) => replaceState(sanitize(raw)))
      .catch(() => replaceState(EMPTY));
  }
  return loadPromise;
}

function persist(): Promise<void> {
  writeQueue = writeQueue.then(async () => {
    // Always write the latest state, so a queued write never stores stale data.
    await setJSON(LESSON_PROGRESS_STORAGE_KEY, toStored(state));
  });
  return writeQueue;
}

/** Apply a change after the stored progress has loaded. Return `null` for "no change". */
async function update(recipe: (current: LessonProgressData) => LessonProgressData | null): Promise<void> {
  await loadLessonProgress();
  const next = recipe(state);
  if (!next) return;
  replaceState(next);
  await persist();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  attachWebSync();
  void loadLessonProgress();
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): LessonProgress {
  return state;
}

// ───────────────────────── Public API ─────────────────────────

/** Current progress snapshot (outside React). */
export function getLessonProgress(): LessonProgress {
  return state;
}

/** Live lesson progress; every screen using it re-renders when anything changes. */
export function useLessonProgress(): LessonProgress {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** Mark a lesson as completed (no-op if it already is). */
export function markLessonComplete(lessonId: string): Promise<void> {
  return update((current) => {
    if (!lessonId || current.completed[lessonId]) return null;
    return { ...current, completed: { ...current.completed, [lessonId]: new Date().toISOString() } };
  });
}

/** Undo "completed" for a lesson. Quiz results are kept. */
export function markLessonIncomplete(lessonId: string): Promise<void> {
  return update((current) => {
    if (!current.completed[lessonId]) return null;
    const completed = { ...current.completed };
    delete completed[lessonId];
    return { ...current, completed };
  });
}

/** Save a finished quiz attempt. Finishing the quiz also completes the lesson. */
export function recordQuizResult(lessonId: string, correct: number, total: number): Promise<void> {
  return update((current) => {
    if (!lessonId || total <= 0) return null;
    const safeCorrect = Math.max(0, Math.min(total, Math.floor(correct)));
    const previous = current.quiz[lessonId];
    const now = new Date().toISOString();
    const result: QuizResult = {
      correct: safeCorrect,
      total,
      best: Math.min(total, Math.max(safeCorrect, previous?.best ?? 0)),
      attempts: (previous?.attempts ?? 0) + 1,
      at: now,
    };
    return {
      ...current,
      quiz: { ...current.quiz, [lessonId]: result },
      completed: current.completed[lessonId] ? current.completed : { ...current.completed, [lessonId]: now },
    };
  });
}

/** Remember the lesson the user is reading (powers "Continue reading"). */
export function setLastOpenedLesson(lessonId: string): Promise<void> {
  return update((current) => {
    if (!lessonId) return null;
    return { ...current, lastOpened: { id: lessonId, at: new Date().toISOString() } };
  });
}

/** Forget all lesson progress on this device. */
export function resetLessonProgress(): Promise<void> {
  return update(() => EMPTY);
}

// ───────────────────────── Selectors ─────────────────────────

export function isLessonComplete(progress: LessonProgressData, lessonId: string): boolean {
  return !!progress.completed[lessonId];
}

/** How many of `lessons` are completed (ignores stale ids of lessons that no longer exist). */
export function countCompleted(progress: LessonProgressData, lessons: readonly { id: string }[]): number {
  let count = 0;
  for (const lesson of lessons) if (progress.completed[lesson.id]) count += 1;
  return count;
}
