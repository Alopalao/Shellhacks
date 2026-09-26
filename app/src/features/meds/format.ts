// Display helpers and form presets for medications.
import type { IoniconName } from '@/components/ui';
import type { Prescription, RefillRequest } from '@/lib/contracts';
import { formatTime, pluralize } from '@/lib/format';

/** "Lisinopril 10 mg" */
export function medLabel(rx: Pick<Prescription, 'drugName' | 'strength'>): string {
  return `${rx.drugName} ${rx.strength}`.trim();
}

function capitalize(text: string): string {
  return text ? text[0]!.toUpperCase() + text.slice(1) : text;
}

/** "1 tablet by mouth, once daily" (skips empty parts). */
export function doseSummary(rx: Pick<Prescription, 'dose' | 'route' | 'frequency'>): string {
  const how = [rx.dose, rx.route].map((s) => s.trim()).filter(Boolean).join(' ');
  const parts = [how, rx.frequency.trim()].filter(Boolean);
  return capitalize(parts.join(', '));
}

/** "8:00 AM · 7:00 PM", or a fallback when there are no reminder times. */
export function timesSummary(times: readonly string[], empty = 'No set times'): string {
  return times.length ? [...times].sort().map((t) => formatTime(t)).join(' · ') : empty;
}

/** "For blood pressure"; category-like purposes ("Supplement", "To lower …") are shown as written. */
export function purposeLabel(purpose: string | null | undefined): string | null {
  const p = purpose?.trim();
  if (!p) return null;
  if (/^(for|to)\s/i.test(p) || /supplement|vitamin|mineral|probiotic/i.test(p)) return capitalize(p);
  // Keep acronyms ("HTN", "GERD") as written; lower-case the first letter of ordinary words.
  const rest = /^[A-Z]{2,}/.test(p) ? p : `${p.charAt(0).toLowerCase()}${p.slice(1)}`;
  return `For ${rest}`;
}

/** How long a prescription written with 0 refills counts as "just prescribed" rather than "out of refills". */
export const NEW_PRESCRIPTION_DAYS = 7;

/**
 * Where a prescription stands on refills:
 * - `available`: refills remain;
 * - `first-fill`: written in the last week with no refills, so the patient is still on (or hasn't
 *   picked up) the first fill; nothing to warn about yet;
 * - `out`: no refills left, time to ask the doctor to renew it.
 */
export type RefillState = 'available' | 'first-fill' | 'out';

export function refillState(rx: Pick<Prescription, 'refillsRemaining' | 'createdAt'>, now: Date = new Date()): RefillState {
  if (rx.refillsRemaining > 0) return 'available';
  const created = Date.parse(rx.createdAt);
  const ageMs = now.getTime() - created;
  return Number.isFinite(created) && ageMs < NEW_PRESCRIPTION_DAYS * 86_400_000 ? 'first-fill' : 'out';
}

/** "2 refills left" / "No refills left", or "No refills included" for a just-written prescription. */
export function refillsLabel(count: number, state?: RefillState): string {
  if (count > 0) return `${pluralize(count, 'refill')} left`;
  return state === 'first-fill' ? 'No refills included' : 'No refills left';
}

export function formLabel(form: string): string {
  return capitalize(form.trim());
}

/** A friendly icon for a dosage form. */
export function iconForForm(form: string, selfReported = false): IoniconName {
  const f = form.toLowerCase();
  if (/tablet|capsule|caplet|softgel|gummy|chew|lozenge|powder/.test(f)) {
    return selfReported ? 'leaf-outline' : 'medical-outline';
  }
  if (/inhal|spray|aerosol/.test(f)) return 'cloud-outline';
  if (/liquid|syrup|solution|suspension|drop/.test(f)) return 'water-outline';
  if (/cream|ointment|\bgel\b|lotion|patch/.test(f)) return 'hand-left-outline';
  if (/inject|pen|syringe/.test(f)) return 'eyedrop-outline';
  if (selfReported) return 'leaf-outline';
  return 'medical-outline';
}

// ───────────────────────── Refill status ─────────────────────────

export const REFILL_STATUS_LABEL: Record<RefillRequest['status'], string> = {
  pending: 'Pending',
  approved: 'Approved',
  denied: 'Declined',
};

/** The most recent refill request per prescription id. */
export function latestRefillByRx(refills: readonly RefillRequest[] | undefined): Map<string, RefillRequest> {
  const map = new Map<string, RefillRequest>();
  for (const r of refills ?? []) {
    const prev = map.get(r.prescriptionId);
    if (!prev || r.createdAt > prev.createdAt) map.set(r.prescriptionId, r);
  }
  return map;
}

/** Insert or replace a refill request (by id), newest first. */
export function upsertRefill(list: readonly RefillRequest[], refill: RefillRequest): RefillRequest[] {
  return [refill, ...list.filter((r) => r.id !== refill.id)].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Short label for a live prescription change, e.g. "New from Dr. Reyes", "Paused by Dr. Reyes",
 * "Updated by Dr. Reyes". `who` is the prescriber's short name, or null for self-reported medicines.
 */
export function liveChangeLabel(prev: Prescription | undefined, next: Prescription, who: string | null): string {
  if (!prev) return who ? `New from ${who}` : 'Added to your list';
  if (prev.status !== next.status) {
    if (next.status === 'discontinued') return who ? `Stopped by ${who}` : 'Removed from your list';
    if (next.status === 'paused') return who ? `Paused by ${who}` : 'Paused';
    return who ? `Resumed by ${who}` : 'Resumed';
  }
  if (next.refillsRemaining > prev.refillsRemaining) {
    const added = next.refillsRemaining - prev.refillsRemaining;
    return who ? `${who} added ${pluralize(added, 'refill')}` : `${pluralize(added, 'refill')} added`;
  }
  return who ? `Updated by ${who}` : 'Updated just now';
}

/** Insert or replace a prescription (by id), keeping existing order; new ones go first. */
export function upsertPrescription(list: readonly Prescription[], rx: Prescription): Prescription[] {
  const index = list.findIndex((p) => p.id === rx.id);
  if (index === -1) return [rx, ...list];
  const next = [...list];
  next[index] = rx;
  return next;
}

// ───────────────────────── Self-reported form presets ─────────────────────────

export interface FormOption {
  value: string;
  label: string;
  route: string;
  defaultDose: string;
}

export const FORM_OPTIONS: readonly FormOption[] = [
  { value: 'tablet', label: 'Tablet', route: 'by mouth', defaultDose: '1 tablet' },
  { value: 'capsule', label: 'Capsule', route: 'by mouth', defaultDose: '1 capsule' },
  { value: 'softgel', label: 'Softgel', route: 'by mouth', defaultDose: '1 softgel' },
  { value: 'gummy', label: 'Gummy', route: 'by mouth', defaultDose: '1 gummy' },
  { value: 'liquid', label: 'Liquid', route: 'by mouth', defaultDose: '5 mL' },
  { value: 'powder', label: 'Powder', route: 'by mouth', defaultDose: '1 scoop' },
  { value: 'drops', label: 'Drops', route: 'as directed', defaultDose: '1 drop' },
  { value: 'spray', label: 'Spray', route: 'as directed', defaultDose: '1 spray' },
  { value: 'cream', label: 'Cream', route: 'on the skin', defaultDose: 'Thin layer' },
  { value: 'patch', label: 'Patch', route: 'on the skin', defaultDose: '1 patch' },
];

export function formOption(value: string): FormOption | undefined {
  return FORM_OPTIONS.find((f) => f.value === value.trim().toLowerCase());
}

export type FrequencyPresetId = 'once' | 'twice' | 'three' | 'bedtime' | 'prn';

export interface FrequencyPreset {
  id: FrequencyPresetId;
  label: string;
  frequency: string;
  times: readonly string[];
}

export const FREQUENCY_PRESETS: readonly FrequencyPreset[] = [
  { id: 'once', label: 'Once daily', frequency: 'once daily', times: ['08:00'] },
  { id: 'twice', label: 'Twice daily', frequency: 'twice daily', times: ['08:00', '20:00'] },
  { id: 'three', label: '3 times daily', frequency: 'three times daily', times: ['08:00', '14:00', '20:00'] },
  { id: 'bedtime', label: 'At bedtime', frequency: 'at bedtime', times: ['21:00'] },
  { id: 'prn', label: 'As needed', frequency: 'as needed', times: [] },
];

export function frequencyPreset(id: FrequencyPresetId): FrequencyPreset {
  return FREQUENCY_PRESETS.find((p) => p.id === id) ?? FREQUENCY_PRESETS[0]!;
}

const COUNT_WORDS = ['', 'once daily', 'twice daily', 'three times daily', 'four times daily'];

/** Frequency text for the chosen preset, adjusted when the patient edited the number of times. */
export function frequencyFor(presetId: FrequencyPresetId, times: readonly string[]): string {
  const preset = frequencyPreset(presetId);
  if (presetId === 'prn') return preset.frequency;
  if (times.length === preset.times.length) return preset.frequency;
  return COUNT_WORDS[times.length] ?? `${times.length} times daily`;
}

/** Best-guess preset for an existing prescription (edit mode). */
export function presetForPrescription(rx: Pick<Prescription, 'frequency' | 'times'>): FrequencyPresetId {
  const f = rx.frequency.toLowerCase();
  if (/as needed|prn/.test(f) || rx.times.length === 0) return 'prn';
  if (/bedtime|qhs/.test(f)) return 'bedtime';
  if (/three|3 times|tid/.test(f) || rx.times.length === 3) return 'three';
  if (/twice|2 times|bid/.test(f) || rx.times.length === 2) return 'twice';
  return 'once';
}

/** Quick-add reminder times shown under the time editor. */
export const QUICK_TIMES: readonly { label: string; value: string }[] = [
  { label: 'Morning', value: '08:00' },
  { label: 'Noon', value: '12:00' },
  { label: 'Evening', value: '18:00' },
  { label: 'Bedtime', value: '21:00' },
];

/**
 * Parse free-form time input into `HH:mm`: "8", "8:30", "0830", "8:30pm", "8 PM", "20:15".
 * Returns null when it isn't a valid time.
 */
export function parseTimeInput(input: string): string | null {
  const text = input.trim().toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ');
  const m = /^(\d{1,2})(?::?(\d{2}))?\s*(am|pm|a|p)?$/.exec(text);
  if (!m) return null;
  let hours = Number(m[1]);
  const minutes = m[2] ? Number(m[2]) : 0;
  const suffix = m[3];
  if (minutes > 59) return null;
  if (suffix) {
    if (hours < 1 || hours > 12) return null;
    const pm = suffix.startsWith('p');
    if (hours === 12) hours = pm ? 12 : 0;
    else if (pm) hours += 12;
  } else if (hours > 23) {
    return null;
  }
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}
