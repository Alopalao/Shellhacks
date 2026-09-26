// Date/time/name formatting helpers. All dates are handled in the device's local time zone.
// Deterministic (no Intl dependency) so output matches on iOS, Android and web.
import type { User } from './contracts';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Anything date-like the helpers accept: Date, ISO timestamp, epoch ms, or a `YYYY-MM-DD` key. */
export type DateInput = Date | string | number;

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Parse a date input. `YYYY-MM-DD` keys are parsed as *local* midnight (not UTC).
 * Returns null for invalid input.
 */
export function toDate(input: DateInput | null | undefined): Date | null {
  if (input == null || input === '') return null;
  if (input instanceof Date) return Number.isNaN(input.getTime()) ? null : input;
  if (typeof input === 'string') {
    const key = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input);
    if (key) return new Date(Number(key[1]), Number(key[2]) - 1, Number(key[3]));
  }
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Local `YYYY-MM-DD` for a date (default: now). */
export function dateKey(input: DateInput = new Date()): string {
  const d = toDate(input) ?? new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Today's local date key, e.g. `2026-09-26`. Use for `api.dashboard(todayKey())` and dose logging. */
export function todayKey(): string {
  return dateKey(new Date());
}

/** Shift a `YYYY-MM-DD` key by `days` (negative = past). `addDays('2026-01-01', -1)` → `'2025-12-31'`. */
export function addDays(key: string, days: number): string {
  const d = toDate(key) ?? new Date();
  const shifted = new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
  return dateKey(shifted);
}

/** The last `count` date keys ending today (oldest first). `lastNDays(14)` for a 14-day dose grid. */
export function lastNDays(count: number, end: string = todayKey()): string[] {
  return Array.from({ length: count }, (_, i) => addDays(end, i - (count - 1)));
}

/** True when both inputs fall on the same local calendar day. */
export function isSameDay(a: DateInput, b: DateInput): boolean {
  const da = toDate(a);
  const db = toDate(b);
  return !!da && !!db && dateKey(da) === dateKey(db);
}

/**
 * Format a time. Accepts a Date/ISO string or a `HH:mm` slot.
 * `formatTime('08:00')` → `'8:00 AM'`, `formatTime('2026-09-26T19:05:00Z')` → local `'3:05 PM'`.
 */
export function formatTime(input: DateInput | null | undefined): string {
  if (input == null || input === '') return '';
  let hours: number;
  let minutes: number;
  const slot = typeof input === 'string' ? /^(\d{1,2}):(\d{2})$/.exec(input) : null;
  if (slot) {
    hours = Number(slot[1]);
    minutes = Number(slot[2]);
  } else {
    const d = toDate(input);
    if (!d) return '';
    hours = d.getHours();
    minutes = d.getMinutes();
  }
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${h12}:${pad(minutes)} ${suffix}`;
}

export interface FormatDateOptions {
  /** Include the weekday: `Mon, Apr 12, 2026`. */
  weekday?: boolean;
  /** Use the long month name: `April 12, 2026`. */
  long?: boolean;
  /** Omit the year when it is the current year (default false). */
  omitCurrentYear?: boolean;
}

/** `formatDate('1986-04-12')` → `'Apr 12, 1986'`. Returns '' for invalid input. */
export function formatDate(input: DateInput | null | undefined, options: FormatDateOptions = {}): string {
  const d = toDate(input);
  if (!d) return '';
  const month = (options.long ? MONTHS_LONG : MONTHS)[d.getMonth()];
  const showYear = !(options.omitCurrentYear && d.getFullYear() === new Date().getFullYear());
  const weekday = options.weekday ? `${(options.long ? WEEKDAYS_LONG : WEEKDAYS)[d.getDay()]}, ` : '';
  return `${weekday}${month} ${d.getDate()}${showYear ? `, ${d.getFullYear()}` : ''}`;
}

/** `Apr 12, 2026 · 3:05 PM` (year omitted when current). */
export function formatDateTime(input: DateInput | null | undefined): string {
  const d = toDate(input);
  if (!d) return '';
  return `${formatDate(d, { omitCurrentYear: true })} · ${formatTime(d)}`;
}

/** Short weekday for a date key, e.g. `'Mon'` (for dose grids). */
export function formatWeekday(input: DateInput, long = false): string {
  const d = toDate(input);
  if (!d) return '';
  return (long ? WEEKDAYS_LONG : WEEKDAYS)[d.getDay()] ?? '';
}

/**
 * Human relative time: `just now`, `5 min ago`, `3 h ago`, `Yesterday`, `Mon`, `Apr 3`, `Apr 3, 2024`.
 * Future times read `in 5 min` / `in 3 h`, then fall back to dates.
 */
export function formatRelative(input: DateInput | null | undefined, now: Date = new Date()): string {
  const d = toDate(input);
  if (!d) return '';
  const diffMs = now.getTime() - d.getTime();
  const future = diffMs < 0;
  const abs = Math.abs(diffMs);
  const min = Math.round(abs / 60_000);
  if (abs < 45_000) return 'just now';
  if (min < 60) return future ? `in ${min} min` : `${min} min ago`;
  const hours = Math.round(abs / 3_600_000);
  if (hours < 12 || (hours < 24 && isSameDay(d, now))) return future ? `in ${hours} h` : `${hours} h ago`;
  if (!future && isSameDay(d, addDays(dateKey(now), -1))) return 'Yesterday';
  if (future && isSameDay(d, addDays(dateKey(now), 1))) return 'Tomorrow';
  const days = Math.abs(Math.round((toDate(dateKey(now))!.getTime() - toDate(dateKey(d))!.getTime()) / 86_400_000));
  if (!future && days < 7) return WEEKDAYS[d.getDay()] ?? '';
  return formatDate(d, { omitCurrentYear: true });
}

/** Compact timestamp for chat bubbles/lists: time if today, `Yesterday`, weekday within a week, else date. */
export function formatMessageTime(input: DateInput | null | undefined, now: Date = new Date()): string {
  const d = toDate(input);
  if (!d) return '';
  if (isSameDay(d, now)) return formatTime(d);
  return formatRelative(d, now);
}

/** Age in whole years from a `YYYY-MM-DD` date of birth, or null. */
export function ageFromDob(dob: string | null | undefined, now: Date = new Date()): number | null {
  const d = toDate(dob ?? null);
  if (!d) return null;
  let age = now.getFullYear() - d.getFullYear();
  const beforeBirthday = now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate());
  if (beforeBirthday) age -= 1;
  return age >= 0 && age < 150 ? age : null;
}

/** Validates a `YYYY-MM-DD` string that is a real calendar date. */
export function isValidDateKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = toDate(value);
  return !!d && dateKey(d) === value;
}

/** Up to two initials: `initials('Maya Johnson')` → `'MJ'`, `initials('Dr. Daniel Reyes, MD')` → `'DR'`. */
export function initials(name: string | null | undefined): string {
  const cleaned = (name ?? '')
    .replace(/,.*$/, '')
    .replace(/^(dr|mr|mrs|ms|mx|prof)\.?\s+/i, '')
    .trim();
  if (!cleaned) return '?';
  const parts = cleaned.split(/[\s@._-]+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase() || '?';
}

/** First name for greetings: `firstName('Maya Johnson')` → `'Maya'`; strips a `Dr.` prefix. */
export function firstName(name: string | null | undefined): string {
  const cleaned = (name ?? '').replace(/^(dr|mr|mrs|ms|mx|prof)\.?\s+/i, '').trim();
  return cleaned.split(/\s+/)[0] ?? '';
}

/**
 * Display name with a `Dr.` prefix for doctors (unless already present) and without trailing
 * credentials: `displayName(doctor)` → `'Dr. Daniel Reyes'`; patients unchanged.
 */
export function displayName(user: Pick<User, 'name' | 'role'> | null | undefined): string {
  if (!user) return '';
  const name = user.name.trim();
  if (user.role !== 'doctor') return name;
  const base = name.replace(/,\s*(MD|DO|NP|PA(-C)?|MBBS|FNP(-BC)?|RN|PhD)\.?$/i, '').trim();
  return /^dr\.?\s/i.test(base) ? base : `Dr. ${base}`;
}

/** Time-of-day greeting: `Good morning` / `Good afternoon` / `Good evening`. */
export function greeting(now: Date = new Date()): string {
  const h = now.getHours();
  if (h < 5) return 'Good evening';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/** `formatPercent(0.857)` → `'86%'`; null/undefined → `'—'`. */
export function formatPercent(value: number | null | undefined, digits = 0): string {
  if (value == null || Number.isNaN(value)) return '—';
  return `${(value * 100).toFixed(digits)}%`;
}

/** `pluralize(1, 'refill')` → `'1 refill'`, `pluralize(2, 'refill')` → `'2 refills'`. */
export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/** Truncate to `max` characters with an ellipsis. */
export function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

/** Sort `HH:mm` slots ascending. */
export function sortTimes(times: readonly string[]): string[] {
  return [...times].sort((a, b) => a.localeCompare(b));
}
