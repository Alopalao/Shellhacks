// Prescribe form model: presets, validation and conversion to the API contract.
import type { Prescription, PrescriptionInput } from '@/lib/contracts';
import { isValidDateKey, sortTimes, todayKey } from '@/lib/format';

export const DOSAGE_FORMS = ['tablet', 'capsule', 'liquid', 'inhaler', 'injection', 'cream', 'drops'] as const;

export const ROUTES = [
  'by mouth',
  'inhaled',
  'subcutaneous',
  'intramuscular',
  'topical',
  'in the eye',
  'in the ear',
  'nasal',
] as const;

/** Sensible default route when the form changes (only applied while the route is untouched). */
export const DEFAULT_ROUTE_FOR_FORM: Record<string, string> = {
  tablet: 'by mouth',
  capsule: 'by mouth',
  liquid: 'by mouth',
  inhaler: 'inhaled',
  injection: 'subcutaneous',
  cream: 'topical',
  drops: 'in the eye',
};

/** Example dose text per form (used as the placeholder). */
export const DOSE_EXAMPLE_FOR_FORM: Record<string, string> = {
  tablet: '1 tablet',
  capsule: '1 capsule',
  liquid: '5 mL',
  inhaler: '2 puffs',
  injection: '10 units',
  cream: 'Apply a thin layer',
  drops: '1 drop',
};

export interface FrequencyPreset {
  id: string;
  label: string;
  /** Text saved as `frequency` (what the patient sees). */
  frequency: string;
  /** Default reminder slots (HH:mm). Empty = as needed. */
  times: readonly string[];
}

export const FREQUENCY_PRESETS: readonly FrequencyPreset[] = [
  { id: 'once', label: 'Once daily', frequency: 'once daily', times: ['08:00'] },
  { id: 'twice', label: 'Twice daily', frequency: 'twice daily', times: ['08:00', '20:00'] },
  { id: 'three', label: 'Three times daily', frequency: 'three times daily', times: ['08:00', '14:00', '20:00'] },
  { id: 'bedtime', label: 'At bedtime', frequency: 'once daily at bedtime', times: ['21:00'] },
  { id: 'q8h', label: 'Every 8 hours', frequency: 'every 8 hours', times: ['06:00', '14:00', '22:00'] },
  { id: 'prn', label: 'As needed', frequency: 'as needed', times: [] },
];

export const CUSTOM_FREQUENCY = 'custom';

export const MAX_TIMES = 12;
export const MAX_REFILLS = 11;

export interface PrescriptionFormValues {
  drugName: string;
  strength: string;
  form: string;
  dose: string;
  route: string;
  /** A preset id or `custom`. */
  frequencyPreset: string;
  /** Free text used when `frequencyPreset === 'custom'`. */
  customFrequency: string;
  times: string[];
  instructions: string;
  purpose: string;
  quantity: string;
  refills: number;
  startDate: string;
}

export type PrescriptionField = keyof PrescriptionFormValues | 'allergy';
export type PrescriptionErrors = Partial<Record<PrescriptionField, string>>;

/** Match a stored frequency to a preset (case-insensitive, by saved text or label). */
export function presetForFrequency(frequency: string): FrequencyPreset | undefined {
  const f = frequency.trim().toLowerCase();
  return FREQUENCY_PRESETS.find((p) => p.frequency === f || p.label.toLowerCase() === f);
}

export function initialFormValues(rx?: Prescription | null): PrescriptionFormValues {
  if (!rx) {
    const preset = FREQUENCY_PRESETS[0]!;
    return {
      drugName: '',
      strength: '',
      form: 'tablet',
      dose: '',
      route: 'by mouth',
      frequencyPreset: preset.id,
      customFrequency: '',
      times: [...preset.times],
      instructions: '',
      purpose: '',
      quantity: '',
      refills: 0,
      startDate: todayKey(),
    };
  }
  const preset = presetForFrequency(rx.frequency);
  return {
    drugName: rx.drugName,
    strength: rx.strength,
    form: rx.form,
    dose: rx.dose,
    route: rx.route,
    frequencyPreset: preset?.id ?? CUSTOM_FREQUENCY,
    customFrequency: preset ? '' : rx.frequency,
    times: sortTimes(rx.times),
    instructions: rx.instructions,
    purpose: rx.purpose ?? '',
    quantity: rx.quantity == null ? '' : String(rx.quantity),
    refills: Math.min(Math.max(rx.refillsRemaining, 0), 99),
    startDate: rx.startDate,
  };
}

export function frequencyText(values: PrescriptionFormValues): string {
  if (values.frequencyPreset === CUSTOM_FREQUENCY) return values.customFrequency.trim();
  return FREQUENCY_PRESETS.find((p) => p.id === values.frequencyPreset)?.frequency ?? '';
}

/**
 * Parse loose time input into `HH:mm`: `8`, `8:30`, `08:30`, `830`, `8am`, `8:30 pm`, `20:15`.
 * Returns null when it can't be understood.
 */
export function parseTimeInput(raw: string): string | null {
  const text = raw.trim().toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ');
  if (!text) return null;
  const m = /^(\d{1,2})(?::?(\d{2}))?\s*(am|pm|a|p)?$/.exec(text);
  if (!m) return null;
  let hours = Number(m[1]);
  const minutes = m[2] ? Number(m[2]) : 0;
  const meridiem = m[3];
  if (minutes > 59) return null;
  if (meridiem) {
    if (hours < 1 || hours > 12) return null;
    const pm = meridiem.startsWith('p');
    if (hours === 12) hours = pm ? 12 : 0;
    else if (pm) hours += 12;
  } else if (hours > 23) {
    return null;
  }
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/** Client-side validation (the server validates again). */
export function validatePrescription(values: PrescriptionFormValues): PrescriptionErrors {
  const errors: PrescriptionErrors = {};
  if (!values.drugName.trim()) errors.drugName = 'Enter the medication name.';
  else if (values.drugName.trim().length > 120) errors.drugName = 'Keep the name under 120 characters.';
  if (!values.strength.trim()) errors.strength = 'Add the strength, e.g. 10 mg.';
  if (!values.form.trim()) errors.form = 'Choose a form.';
  if (!values.dose.trim()) errors.dose = 'Add the dose, e.g. 1 tablet.';
  if (!values.route.trim()) errors.route = 'Choose a route.';
  if (values.frequencyPreset === CUSTOM_FREQUENCY && !values.customFrequency.trim()) {
    errors.frequencyPreset = 'Describe how often to take it.';
  }
  const prn = values.frequencyPreset === 'prn';
  if (!prn && values.frequencyPreset !== CUSTOM_FREQUENCY && values.times.length === 0) {
    errors.times = 'Add at least one reminder time, or choose "As needed".';
  }
  if (values.times.length > MAX_TIMES) errors.times = `At most ${MAX_TIMES} reminder times.`;
  const quantity = values.quantity.trim();
  if (quantity && !/^\d{1,5}$/.test(quantity)) errors.quantity = 'Use a whole number, e.g. 30.';
  else if (quantity && Number(quantity) > 10_000) errors.quantity = 'That quantity looks too large.';
  if (!isValidDateKey(values.startDate.trim())) errors.startDate = 'Use the YYYY-MM-DD format, e.g. 2026-09-26.';
  return errors;
}

/** Convert form values to the API input. Assumes `validatePrescription` passed. */
export function toPrescriptionInput(values: PrescriptionFormValues): PrescriptionInput {
  const quantity = values.quantity.trim();
  return {
    drugName: values.drugName.trim(),
    strength: values.strength.trim(),
    form: values.form.trim(),
    dose: values.dose.trim(),
    route: values.route.trim(),
    frequency: frequencyText(values),
    times: values.frequencyPreset === 'prn' ? [] : sortTimes([...new Set(values.times)]),
    instructions: values.instructions.trim(),
    purpose: values.purpose.trim() || null,
    quantity: quantity ? Number(quantity) : null,
    refillsRemaining: values.refills,
    startDate: values.startDate.trim(),
  };
}

const SERVER_FIELD_MAP: Record<string, PrescriptionField> = {
  drugName: 'drugName',
  strength: 'strength',
  form: 'form',
  dose: 'dose',
  route: 'route',
  frequency: 'frequencyPreset',
  times: 'times',
  instructions: 'instructions',
  purpose: 'purpose',
  quantity: 'quantity',
  refillsRemaining: 'refills',
  startDate: 'startDate',
  endDate: 'startDate',
};

/** Map server zod issues (`details: [{ path, message }]`) onto form fields. */
export function serverFieldErrors(details: unknown): PrescriptionErrors {
  if (!Array.isArray(details)) return {};
  const errors: PrescriptionErrors = {};
  for (const issue of details) {
    if (!issue || typeof issue !== 'object') continue;
    const { path, message } = issue as { path?: unknown; message?: unknown };
    if (typeof path !== 'string' || typeof message !== 'string') continue;
    const field = SERVER_FIELD_MAP[path.split('.')[0] ?? ''];
    if (field && !errors[field]) errors[field] = message;
  }
  return errors;
}
