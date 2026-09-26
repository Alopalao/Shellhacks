// Adherence math: logged doses ÷ scheduled dose slots over a window of local days.
import { addDays, dateRange, maxKey, minKey } from '../db/dates';
import type { DoseLog, Prescription } from '../shared/contracts';

export interface AdherenceOptions {
  /** The last day of the window (local YYYY-MM-DD), usually today. */
  today: string;
  /** Local HH:mm "now" on `today`; later slots only count once due (or already logged). */
  nowTime: string;
  /** Window length in days, including `today` (default 7). */
  days?: number;
}

export interface AdherenceResult {
  scheduled: number;
  taken: number;
  /** taken / scheduled, or null when nothing was scheduled. */
  rate: number | null;
}

/**
 * Counts, for every non-discontinued prescription with reminder times, each slot from
 * max(window start, startDate) to min(today, endDate). On `today` a slot counts only when
 * it's due (slot ≤ nowTime) or already logged, so a morning check doesn't read as missed
 * evening doses. As-needed meds (no times) are never "scheduled".
 */
export function computeAdherence(
  prescriptions: readonly Prescription[],
  doseLogs: readonly DoseLog[],
  options: AdherenceOptions,
): AdherenceResult {
  const { today, nowTime } = options;
  const windowStart = addDays(today, -((options.days ?? 7) - 1));
  const logged = new Set(doseLogs.map((log) => `${log.prescriptionId}|${log.date}|${log.slot}`));

  let scheduled = 0;
  let taken = 0;
  for (const rx of prescriptions) {
    if (rx.status === 'discontinued' || rx.times.length === 0) continue;
    const from = maxKey(windowStart, rx.startDate);
    const to = rx.endDate ? minKey(today, rx.endDate) : today;
    for (const date of dateRange(from, to)) {
      for (const slot of rx.times) {
        const isLogged = logged.has(`${rx.id}|${date}|${slot}`);
        const isDue = date < today || slot <= nowTime;
        if (!isDue && !isLogged) continue;
        scheduled += 1;
        if (isLogged) taken += 1;
      }
    }
  }
  return { scheduled, taken, rate: scheduled === 0 ? null : taken / scheduled };
}
