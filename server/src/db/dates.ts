// Date helpers for the store. "Date keys" are local calendar dates (YYYY-MM-DD) and
// "time keys" are local wall-clock times (HH:mm). Arithmetic on date keys is done in UTC
// so daylight-saving transitions can never skip or repeat a day.

export const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;
export const TIME_KEY_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const pad = (n: number): string => String(n).padStart(2, '0');

/** Local calendar date of `d` as YYYY-MM-DD. */
export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Local wall-clock time of `d` as HH:mm. */
export function toTimeKey(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function todayKey(now: Date = new Date()): string {
  return toDateKey(now);
}

function parseDateKey(key: string): { y: number; m: number; d: number } {
  const [y, m, d] = key.split('-').map(Number) as [number, number, number];
  return { y, m, d };
}

/** True when `key` is a well-formed YYYY-MM-DD that names a real calendar day. */
export function isValidDateKey(key: string): boolean {
  if (!DATE_KEY_RE.test(key)) return false;
  const { y, m, d } = parseDateKey(key);
  const probe = new Date(Date.UTC(y, m - 1, d));
  return probe.getUTCFullYear() === y && probe.getUTCMonth() === m - 1 && probe.getUTCDate() === d;
}

/** `key` shifted by `days` calendar days (negative = earlier). */
export function addDays(key: string, days: number): string {
  const { y, m, d } = parseDateKey(key);
  const shifted = new Date(Date.UTC(y, m - 1, d + days));
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`;
}

/** Inclusive list of date keys from `from` to `to` (empty when from > to). */
export function dateRange(from: string, to: string): string[] {
  const out: string[] = [];
  for (let key = from; key <= to; key = addDays(key, 1)) out.push(key);
  return out;
}

/** A Date for local `dateKey` at local `timeKey` (HH:mm). */
export function atLocalTime(dateKey: string, timeKey: string): Date {
  const { y, m, d } = parseDateKey(dateKey);
  const [hh, mm] = timeKey.split(':').map(Number) as [number, number];
  return new Date(y, m - 1, d, hh, mm, 0, 0);
}

export const maxKey = (a: string, b: string): string => (a > b ? a : b);
export const minKey = (a: string, b: string): string => (a < b ? a : b);
