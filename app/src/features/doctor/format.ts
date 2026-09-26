// Small presentation helpers for the doctor screens.
import type { Prescription, PrescriptionStatus, User } from '@/lib/contracts';
import { ageFromDob, displayName, formatRelative, formatTime, sortTimes, type DateInput } from '@/lib/format';
import type { BadgeTone } from '@/components/ui';

/** `Dr. Reyes` — title + last name, for greetings. Falls back to the full display name. */
export function doctorShortName(user: Pick<User, 'name' | 'role'> | null | undefined): string {
  const full = displayName(user ? { ...user, role: 'doctor' } : null);
  const bare = full.replace(/^dr\.?\s+/i, '').trim();
  const last = bare.split(/\s+/).filter(Boolean).at(-1);
  return last ? `Dr. ${last}` : full;
}

/** `Lisinopril 10 mg`. */
export function medLabel(rx: Pick<Prescription, 'drugName' | 'strength'>): string {
  return `${rx.drugName} ${rx.strength}`.trim();
}

/** `1 tablet by mouth · once daily` (skips empty parts). */
export function rxDirections(rx: Pick<Prescription, 'dose' | 'route' | 'frequency'>): string {
  const doseRoute = [rx.dose, rx.route].map((s) => s.trim()).filter(Boolean).join(' ');
  return [doseRoute, rx.frequency.trim()].filter(Boolean).join(' · ');
}

/** `8:00 AM, 8:00 PM`, or `As needed` when there are no reminder slots. */
export function rxTimesLabel(times: readonly string[]): string {
  return times.length ? sortTimes(times).map(formatTime).join(', ') : 'As needed';
}

/** Thread id convention from SPEC §3. */
export function threadIdFor(patientId: string, doctorId: string): string {
  return `${patientId}__${doctorId}`;
}

/** `40 years` (or null when the DOB is unknown). */
export function ageLabel(patient: Pick<User, 'patient'>, now: Date = new Date()): string | null {
  const age = ageFromDob(patient.patient?.dateOfBirth, now);
  return age == null ? null : `${age} ${age === 1 ? 'year' : 'years'}`;
}

export const STATUS_BADGE: Record<PrescriptionStatus, { label: string; tone: BadgeTone }> = {
  active: { label: 'Active', tone: 'success' },
  paused: { label: 'Paused', tone: 'warning' },
  discontinued: { label: 'Discontinued', tone: 'neutral' },
};

/** Title-case a lowercase generic name from a drug label: `amoxicillin` → `Amoxicillin`. */
export function titleCase(text: string): string {
  return text
    .toLowerCase()
    .split(/(\s+|-)/)
    .map((part) => (part.trim() && part !== '-' ? part[0]!.toUpperCase() + part.slice(1) : part))
    .join('');
}

/** Replace an item by id, or insert it (at the start by default). Returns a new array. */
export function upsertById<T extends { id: string }>(list: readonly T[], item: T, position: 'start' | 'end' = 'start'): T[] {
  const index = list.findIndex((x) => x.id === item.id);
  if (index === -1) return position === 'start' ? [item, ...list] : [...list, item];
  return list.map((x, i) => (i === index ? item : x));
}

/** Remove an item by id. Returns a new array. */
export function removeById<T extends { id: string }>(list: readonly T[], id: string): T[] {
  return list.filter((x) => x.id !== id);
}

/** Local `HH:mm` for a date. */
export function timeKey(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * `formatRelative` phrased to follow a verb: `requested 5 min ago`, `requested yesterday`,
 * `requested on Mon`, `requested on Apr 3`.
 */
export function relativePhrase(input: DateInput | null | undefined, now?: Date): string {
  const r = formatRelative(input, now);
  if (!r) return '';
  if (r === 'Yesterday' || r === 'Tomorrow') return r.toLowerCase();
  if (r === 'just now' || r.endsWith(' ago') || r.startsWith('in ')) return r;
  return `on ${r}`;
}
