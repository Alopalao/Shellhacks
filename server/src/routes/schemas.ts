// zod (v4) request schemas. Output types line up with shared/contracts.ts.
import { z } from 'zod';
import { DATE_KEY_RE, isValidDateKey, TIME_KEY_RE } from '../db/dates';

// ───────────── Primitives ─────────────

export const idSchema = z.string().trim().min(1, 'Required').max(100);

export const dateKeySchema = z
  .string()
  .regex(DATE_KEY_RE, 'Use the YYYY-MM-DD format')
  .refine(isValidDateKey, 'Not a real calendar date');

export const timeKeySchema = z.string().regex(TIME_KEY_RE, 'Use 24-hour HH:mm time');

const isoTimestampSchema = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), 'Use an ISO 8601 timestamp');

/** Trimmed text; empty → null. `undefined` stays undefined so PATCH can tell "unset" apart. */
const nullableText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .optional()
    .transform((value) => (value === undefined ? undefined : value ? value : null));

/** Trimmed, de-duplicated (case-insensitive), non-empty list of short labels. */
const labelList = z
  .array(z.string().trim().max(100))
  .max(50)
  .transform((items) => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const item of items) {
      const key = item.toLowerCase();
      if (!item || seen.has(key)) continue;
      seen.add(key);
      out.push(item);
    }
    return out;
  });

/** Reminder slots: valid HH:mm, de-duplicated and sorted. */
const timesSchema = z
  .array(timeKeySchema)
  .max(12, 'At most 12 reminder times')
  .transform((times) => [...new Set(times)].sort());

// ───────────── Auth & profile ─────────────

export const loginSchema = z.object({
  email: z
    .string({ error: 'Enter your email' })
    .trim()
    .min(1, 'Enter your email')
    .max(254, 'That email is too long')
    .transform((email) => email.toLowerCase()),
  password: z
    .string({ error: 'Enter a password' })
    .max(1000)
    .refine((password) => password.trim().length > 0, 'Enter a password'),
  role: z.enum(['patient', 'doctor']).optional(),
  name: z.string().trim().max(80).optional(),
});

export const updateMeSchema = z.object({
  name: z.string().trim().min(1, 'Name cannot be empty').max(80).optional(),
  patient: z
    .object({
      dateOfBirth: z.union([dateKeySchema, z.literal('')]).nullable().optional(),
      allergies: labelList.optional(),
      conditions: labelList.optional(),
      pharmacy: nullableText(200),
    })
    .optional(),
  doctor: z
    .object({
      specialty: z.string().trim().min(1, 'Specialty cannot be empty').max(100).optional(),
      credentials: z.string().trim().min(1, 'Credentials cannot be empty').max(60).optional(),
      clinic: nullableText(160),
      bio: nullableText(1000),
    })
    .optional(),
});

export const assignDoctorSchema = z.object({ doctorId: idSchema });

// ───────────── Messaging ─────────────

export const sendMessageSchema = z.object({
  body: z.string({ error: 'Message is required' }).trim().min(1, 'Message cannot be empty').max(4000),
  attachment: z
    .discriminatedUnion('type', [
      z.object({ type: z.literal('visit-note'), noteId: idSchema }),
      z.object({ type: z.literal('prescription'), prescriptionId: idSchema }),
    ])
    .nullable()
    .optional(),
});

export const messagesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  before: isoTimestampSchema.optional(),
});

// ───────────── Prescriptions & doses ─────────────

const rxFields = {
  drugName: z.string({ error: 'Drug name is required' }).trim().min(1, 'Drug name is required').max(120),
  strength: z.string().trim().max(80),
  form: z.string().trim().max(60),
  dose: z.string().trim().max(120),
  route: z.string().trim().max(60),
  frequency: z.string().trim().max(120),
  times: timesSchema,
  instructions: z.string().trim().max(2000),
  purpose: nullableText(200),
  quantity: z.number().int().min(0).max(10_000).nullable().optional(),
  refillsRemaining: z.number().int().min(0).max(99).optional(),
  startDate: dateKeySchema.optional(),
  endDate: dateKeySchema.nullable().optional(),
  status: z.enum(['active', 'paused', 'discontinued']).optional(),
};

export const createPrescriptionSchema = z.object({
  ...rxFields,
  patientId: idSchema,
  // Lenient defaults for descriptive fields (self-reported OTC items often lack them).
  strength: rxFields.strength.default(''),
  form: rxFields.form.default(''),
  dose: rxFields.dose.default(''),
  route: rxFields.route.default('by mouth'),
  frequency: rxFields.frequency.default(''),
  times: timesSchema.default([]),
  instructions: rxFields.instructions.default(''),
});

export const updatePrescriptionSchema = z.object(rxFields).partial();
export type PrescriptionPatch = z.output<typeof updatePrescriptionSchema>;

export const patientScopeQuerySchema = z.object({ patientId: idSchema.optional() });

export const dosesQuerySchema = patientScopeQuerySchema.extend({
  from: dateKeySchema.optional(),
  to: dateKeySchema.optional(),
  prescriptionId: idSchema.optional(),
});

export const logDoseSchema = z.object({
  prescriptionId: idSchema,
  date: dateKeySchema,
  slot: timeKeySchema,
});

// ───────────── Refills ─────────────

export const refillsQuerySchema = patientScopeQuerySchema.extend({
  status: z.enum(['pending', 'approved', 'denied']).optional(),
});

export const createRefillSchema = z.object({
  prescriptionId: idSchema,
  patientNote: nullableText(500),
});

export const resolveRefillSchema = z.object({
  status: z.enum(['approved', 'denied'], { error: "Status must be 'approved' or 'denied'" }),
  doctorNote: nullableText(1000),
  refillsAdded: z.number().int().min(1, 'Add at least 1 refill').max(12, 'At most 12 refills at a time').optional(),
});

// ───────────── Notes & dashboard ─────────────

export const createNoteSchema = z.object({
  patientId: idSchema,
  title: z.string({ error: 'Title is required' }).trim().min(1, 'Title is required').max(200),
  body: z.string({ error: 'Note text is required' }).trim().min(1, 'Note text is required').max(20_000),
});

export const dashboardQuerySchema = z.object({ date: dateKeySchema.optional() });
