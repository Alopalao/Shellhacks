// Dose-grid math for the patient detail screen (mirrors the server's adherence rules):
// a slot counts once it is due (earlier day, or today at/after the slot time) or already logged.
import type { DoseLog, Prescription } from '@/lib/contracts';
import { sortTimes } from '@/lib/format';

/** taken = logged · missed = due but not logged · upcoming = later today · inactive = outside the Rx dates. */
export type DoseCellState = 'taken' | 'missed' | 'upcoming' | 'inactive';

export interface DoseCell {
  date: string;
  state: DoseCellState;
  /** ISO timestamp when taken. */
  takenAt?: string;
}

export interface DoseRow {
  slot: string;
  cells: DoseCell[];
  taken: number;
  missed: number;
}

export interface PrescriptionAdherence {
  rows: DoseRow[];
  /** Doses logged for due/taken slots in the window. */
  taken: number;
  /** Slots that were due (or logged) in the window. */
  due: number;
  /** taken / due, or null when nothing was due yet. */
  rate: number | null;
  /** Logged doses in the window regardless of slot (useful for as-needed meds). */
  loggedInWindow: number;
}

/**
 * Build the per-slot grid for one prescription over `days` (oldest first, local YYYY-MM-DD keys).
 * `today` / `nowTime` (HH:mm) decide which of today's slots are already due.
 */
export function buildAdherence(
  rx: Pick<Prescription, 'id' | 'times' | 'startDate' | 'endDate'>,
  doseLogs: readonly DoseLog[],
  days: readonly string[],
  today: string,
  nowTime: string,
): PrescriptionAdherence {
  const first = days[0] ?? today;
  const last = days.at(-1) ?? today;
  const logs = doseLogs.filter((d) => d.prescriptionId === rx.id && d.date >= first && d.date <= last);
  const byKey = new Map(logs.map((d) => [`${d.date}|${d.slot}`, d]));

  let taken = 0;
  let due = 0;
  const rows: DoseRow[] = sortTimes(rx.times).map((slot) => {
    let rowTaken = 0;
    let rowMissed = 0;
    const cells = days.map<DoseCell>((date) => {
      const inRange = date >= rx.startDate && (!rx.endDate || date <= rx.endDate);
      const log = byKey.get(`${date}|${slot}`);
      if (log) {
        rowTaken += 1;
        return { date, state: 'taken', takenAt: log.takenAt };
      }
      if (!inRange) return { date, state: 'inactive' };
      if (date > today || (date === today && slot > nowTime)) return { date, state: 'upcoming' };
      rowMissed += 1;
      return { date, state: 'missed' };
    });
    taken += rowTaken;
    due += rowTaken + rowMissed;
    return { slot, cells, taken: rowTaken, missed: rowMissed };
  });

  return { rows, taken, due, rate: due === 0 ? null : taken / due, loggedInWindow: logs.length };
}
