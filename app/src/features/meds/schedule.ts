// Pure scheduling logic for medications: time-of-day periods, today's dose checklist,
// the next upcoming dose and the 14-day adherence grid. No React, no I/O — easy to reason about.
import type { DoseLog, Prescription } from '@/lib/contracts';
import { addDays, dateKey, lastNDays, sortTimes } from '@/lib/format';
import type { IoniconName } from '@/components/ui';

// ───────────────────────── Keys & lookups ─────────────────────────

/** Identity of one scheduled dose: a prescription, a local date and an `HH:mm` slot. */
export function doseKey(prescriptionId: string, date: string, slot: string): string {
  return `${prescriptionId}|${date}|${slot}`;
}

export function doseKeyOf(dose: Pick<DoseLog, 'prescriptionId' | 'date' | 'slot'>): string {
  return doseKey(dose.prescriptionId, dose.date, dose.slot);
}

/** Index dose logs by `doseKey` for O(1) "was this taken?" lookups. */
export function indexDoses(doses: readonly DoseLog[] | undefined): ReadonlyMap<string, DoseLog> {
  const map = new Map<string, DoseLog>();
  for (const d of doses ?? []) map.set(doseKeyOf(d), d);
  return map;
}

/** Insert or replace a dose log (matched by id or by prescription + date + slot). Returns a new array. */
export function upsertDose(list: readonly DoseLog[], dose: DoseLog): DoseLog[] {
  const key = doseKeyOf(dose);
  const next = list.filter((d) => d.id !== dose.id && doseKeyOf(d) !== key);
  next.push(dose);
  return next.sort((a, b) => a.date.localeCompare(b.date) || a.slot.localeCompare(b.slot));
}

/** Current local time as a sortable `HH:mm`. */
export function timeKey(now: Date): string {
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

/** Minutes since midnight for an `HH:mm` slot (NaN for malformed input). */
export function slotMinutes(slot: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(slot);
  return m ? Number(m[1]) * 60 + Number(m[2]) : Number.NaN;
}

// ───────────────────────── Periods of the day ─────────────────────────

export type DayPeriod = 'morning' | 'afternoon' | 'evening' | 'bedtime';

export interface DayPeriodInfo {
  id: DayPeriod;
  label: string;
  icon: IoniconName;
}

export const DAY_PERIODS: readonly DayPeriodInfo[] = [
  { id: 'morning', label: 'Morning', icon: 'sunny-outline' },
  { id: 'afternoon', label: 'Afternoon', icon: 'partly-sunny-outline' },
  { id: 'evening', label: 'Evening', icon: 'cloudy-night-outline' },
  { id: 'bedtime', label: 'Bedtime', icon: 'moon-outline' },
];

/** Morning 4:00–11:59 · Afternoon 12:00–16:59 · Evening 17:00–20:59 · Bedtime 21:00–3:59. */
export function periodForSlot(slot: string): DayPeriod {
  const minutes = slotMinutes(slot);
  if (Number.isNaN(minutes)) return 'morning';
  const h = Math.floor(minutes / 60);
  if (h >= 4 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 21) return 'evening';
  return 'bedtime';
}

export function periodInfo(period: DayPeriod): DayPeriodInfo {
  return DAY_PERIODS.find((p) => p.id === period) ?? DAY_PERIODS[0]!;
}

// ───────────────────────── Status helpers ─────────────────────────

/** True when the prescription covers `date` (between its start and end dates). */
export function isScheduledOn(rx: Pick<Prescription, 'startDate' | 'endDate'>, date: string): boolean {
  if (rx.startDate && date < rx.startDate) return false;
  if (rx.endDate && date > rx.endDate) return false;
  return true;
}

/** Past = discontinued, or its end date has passed. */
export function isPastPrescription(rx: Pick<Prescription, 'status' | 'endDate'>, today: string): boolean {
  return rx.status === 'discontinued' || (!!rx.endDate && rx.endDate < today);
}

export type MedFilter = 'active' | 'paused' | 'past';

export function medFilterOf(rx: Pick<Prescription, 'status' | 'endDate'>, today: string): MedFilter {
  if (isPastPrescription(rx, today)) return 'past';
  return rx.status === 'paused' ? 'paused' : 'active';
}

/** Should this prescription show up in today's checklist? */
export function isDueToday(rx: Prescription, today: string): boolean {
  return rx.status === 'active' && rx.times.length > 0 && isScheduledOn(rx, today) && !isPastPrescription(rx, today);
}

// ───────────────────────── Today's checklist ─────────────────────────

/** Taken · due within the next hour or up to an hour late · overdue · later today. */
export type SlotState = 'taken' | 'due' | 'overdue' | 'upcoming';

/** Minutes either side of a slot during which it counts as "due now". */
export const DUE_WINDOW_MIN = 60;

export function slotState(slot: string, taken: boolean, now: Date): SlotState {
  if (taken) return 'taken';
  const diff = slotMinutes(slot) - (now.getHours() * 60 + now.getMinutes());
  if (Number.isNaN(diff)) return 'upcoming';
  if (diff > DUE_WINDOW_MIN) return 'upcoming';
  if (diff >= -DUE_WINDOW_MIN) return 'due';
  return 'overdue';
}

export interface ChecklistItem {
  key: string;
  rx: Prescription;
  date: string;
  slot: string;
  period: DayPeriod;
  /** The matching dose log when taken. */
  dose: DoseLog | undefined;
  state: SlotState;
}

export interface ChecklistGroup {
  period: DayPeriodInfo;
  items: ChecklistItem[];
}

export interface TodayChecklist {
  groups: ChecklistGroup[];
  items: ChecklistItem[];
  total: number;
  taken: number;
  /** The next untaken slot that isn't overdue yet (grouped: all meds at that time). */
  next: { slot: string; items: ChecklistItem[] } | null;
  /** Untaken slots more than an hour late. */
  overdue: number;
}

/** Build today's dose checklist from active prescriptions' reminder times and today's dose logs. */
export function buildChecklist(
  prescriptions: readonly Prescription[],
  doses: readonly DoseLog[] | undefined,
  today: string,
  now: Date,
): TodayChecklist {
  const taken = indexDoses(doses);
  const items: ChecklistItem[] = [];
  for (const rx of prescriptions) {
    if (!isDueToday(rx, today)) continue;
    for (const slot of sortTimes(rx.times)) {
      const key = doseKey(rx.id, today, slot);
      const dose = taken.get(key);
      items.push({ key, rx, date: today, slot, period: periodForSlot(slot), dose, state: slotState(slot, !!dose, now) });
    }
  }
  items.sort((a, b) => a.slot.localeCompare(b.slot) || a.rx.drugName.localeCompare(b.rx.drugName));

  // Bedtime slots after midnight (e.g. 00:30) still belong at the end of the day.
  const order = (item: ChecklistItem) =>
    DAY_PERIODS.findIndex((p) => p.id === item.period) * 10_000 + ((slotMinutes(item.slot) + 20 * 60) % (24 * 60));
  const groups: ChecklistGroup[] = DAY_PERIODS.map((period) => ({
    period,
    items: items.filter((i) => i.period === period.id).sort((a, b) => order(a) - order(b)),
  })).filter((g) => g.items.length > 0);

  const pending = items.filter((i) => i.state === 'due' || i.state === 'upcoming');
  const nextSlot = pending[0]?.slot;
  return {
    groups,
    items,
    total: items.length,
    taken: items.filter((i) => i.state === 'taken').length,
    next: nextSlot ? { slot: nextSlot, items: pending.filter((i) => i.slot === nextSlot) } : null,
    overdue: items.filter((i) => i.state === 'overdue').length,
  };
}

// ───────────────────────── 14-day adherence grid ─────────────────────────

/** taken · missed · pending (later today) · off (not scheduled that day). */
export type GridCell = 'taken' | 'missed' | 'pending' | 'off';

export interface AdherenceGrid {
  days: string[];
  rows: { slot: string; cells: GridCell[] }[];
  taken: number;
  /** Slots that were due (excludes slots later today and unscheduled days). */
  due: number;
  /** 0..1, or null when nothing was due. */
  rate: number | null;
  /** False for paused/discontinued meds: their doses aren't counted (rate is null). */
  tracked: boolean;
}

/** Dose history for one prescription over the last `count` days (oldest first). */
export function buildAdherenceGrid(
  rx: Prescription,
  doses: readonly DoseLog[] | undefined,
  now: Date,
  count = 14,
): AdherenceGrid {
  const today = dateKey(now);
  const days = lastNDays(count, today);
  const taken = indexDoses(doses);
  const nowKey = timeKey(now);
  let takenCount = 0;
  let due = 0;
  const rows = sortTimes(rx.times).map((slot) => ({
    slot,
    cells: days.map((day): GridCell => {
      const wasTaken = taken.has(doseKey(rx.id, day, slot));
      if (!isScheduledOn(rx, day)) {
        return wasTaken ? 'taken' : 'off';
      }
      // Paused/discontinued meds aren't scheduled (matches the server's adherence rules). The contract
      // has no pausedAt, so the whole history reads as "off" rather than a row of red misses.
      if (rx.status !== 'active') return wasTaken ? 'taken' : 'off';
      if (wasTaken) {
        takenCount += 1;
        due += 1;
        return 'taken';
      }
      if (day === today && slot > nowKey) return 'pending';
      due += 1;
      return 'missed';
    }),
  }));
  return { days, rows, taken: takenCount, due, rate: due > 0 ? takenCount / due : null, tracked: rx.status === 'active' };
}

/** `from`/`to` date keys covering the last `count` days, for `api.doses`. */
export function historyRange(today: string, count = 14): { from: string; to: string } {
  return { from: addDays(today, -(count - 1)), to: today };
}
