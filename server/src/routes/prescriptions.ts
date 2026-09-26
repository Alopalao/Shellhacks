// /api/prescriptions — doctor-prescribed and patient self-reported medications.
import { Router } from 'express';
import { currentUser, type ServerContext } from '../context';
import { maxKey, todayKey } from '../db/dates';
import { newId } from '../db/ids';
import { comparePrescriptions } from '../db/queries';
import type { Prescription, PrescriptionStatus, RefillRequest, User } from '../shared/contracts';
import {
  assertCanEditPrescription,
  assertPatientAccess,
  findPrescriptionOr404,
  patientScope,
} from './access';
import { emitTo, hrefs, medLabel, notify, shortName } from './events';
import { badRequest, forbidden } from './http';
import {
  createPrescriptionSchema,
  patientScopeQuerySchema,
  updatePrescriptionSchema,
  type PrescriptionPatch,
} from './schemas';

const FIELD_LABELS: Partial<Record<keyof Prescription, string>> = {
  drugName: 'name',
  strength: 'strength',
  form: 'form',
  dose: 'dose',
  route: 'route',
  frequency: 'frequency',
  times: 'schedule',
  instructions: 'instructions',
  purpose: 'purpose',
  quantity: 'quantity',
  refillsRemaining: 'refills',
  startDate: 'start date',
  endDate: 'end date',
};

function joinWords(words: string[]): string {
  if (words.length <= 1) return words.join('');
  return `${words.slice(0, -1).join(', ')} and ${words.at(-1)}`;
}

/** Applies a validated patch in place; returns the names of fields that actually changed. */
function applyPatch(rx: Prescription, patch: PrescriptionPatch): Array<keyof Prescription> {
  const changed: Array<keyof Prescription> = [];
  const set = <K extends keyof Prescription>(key: K, value: Prescription[K] | undefined): void => {
    if (value === undefined) return;
    if (JSON.stringify(rx[key]) === JSON.stringify(value)) return;
    rx[key] = value;
    changed.push(key);
  };
  set('drugName', patch.drugName);
  set('strength', patch.strength);
  set('form', patch.form);
  set('dose', patch.dose);
  set('route', patch.route);
  set('frequency', patch.frequency);
  set('times', patch.times);
  set('instructions', patch.instructions);
  set('purpose', patch.purpose);
  set('quantity', patch.quantity);
  set('refillsRemaining', patch.refillsRemaining);
  set('startDate', patch.startDate);
  set('endDate', patch.endDate);
  set('status', patch.status);
  return changed;
}

interface ChangeSummary {
  title: string;
  /** Sentence fragment after the actor, e.g. "paused Lisinopril 10 mg." */
  action: string;
}

function summarizeChange(rx: Prescription, changed: Array<keyof Prescription>, previous: PrescriptionStatus): ChangeSummary {
  const med = medLabel(rx);
  if (changed.includes('status')) {
    if (rx.status === 'paused') return { title: 'Medication paused', action: `paused ${med}.` };
    if (rx.status === 'discontinued') return { title: 'Medication stopped', action: `discontinued ${med}.` };
    if (previous === 'paused') return { title: 'Medication resumed', action: `resumed ${med}.` };
    return { title: 'Medication restarted', action: `restarted ${med}.` };
  }
  const labels = changed.map((key) => FIELD_LABELS[key]).filter((l): l is string => Boolean(l));
  const what = labels.length > 0 ? `the ${joinWords(labels.slice(0, 3))}${labels.length > 3 ? ' and more' : ''}` : 'details';
  return { title: 'Prescription updated', action: `updated ${what} for ${med}.` };
}

export function createPrescriptionsRouter(ctx: ServerContext): Router {
  const router = Router();

  /** Push the change to both sides and a toast to whoever didn't make it. */
  const broadcast = (actor: User, patient: User, rx: Prescription, summary: ChangeSummary): void => {
    // The acting doctor may be the (former) prescriber rather than the assigned one.
    emitTo(ctx, [patient.id, patient.doctorId, actor.id], 'prescription:upsert', rx);
    if (actor.role === 'doctor') {
      notify(ctx, patient.id, {
        kind: 'prescription',
        title: summary.title,
        body: `${shortName(actor)} ${summary.action}`,
        href: hrefs.patient.med(rx.id),
      });
    } else {
      notify(ctx, patient.doctorId, {
        kind: 'prescription',
        title: summary.title,
        body: `${patient.name} ${summary.action.replace(/\.$/, '')} (self-reported).`,
        href: hrefs.doctor.patient(patient.id),
      });
    }
  };

  /** A pending refill for a stopped medication can't be filled any more: close it. */
  const closePendingRefills = (rx: Prescription): RefillRequest[] => {
    const resolvedAt = new Date().toISOString();
    const closed = ctx.db.data.refillRequests.filter((r) => r.prescriptionId === rx.id && r.status === 'pending');
    for (const refill of closed) {
      refill.status = 'denied';
      refill.doctorNote = 'This medication was discontinued.';
      refill.resolvedAt = resolvedAt;
    }
    return closed;
  };

  const announceClosedRefills = (closed: readonly RefillRequest[]): void => {
    for (const refill of closed) emitTo(ctx, [refill.patientId, refill.doctorId], 'refill:upsert', refill);
  };

  router.get('/', (req, res) => {
    const viewer = currentUser(res);
    const { patientId } = patientScopeQuerySchema.parse(req.query);
    const ids = new Set(patientScope(ctx.db.data, viewer, patientId));
    const prescriptions = ctx.db.data.prescriptions.filter((p) => ids.has(p.patientId)).sort(comparePrescriptions);
    res.json({ prescriptions });
  });

  router.post('/', (req, res) => {
    const viewer = currentUser(res);
    const input = createPrescriptionSchema.parse(req.body);
    const isDoctor = viewer.role === 'doctor';
    if (!isDoctor && input.patientId !== viewer.id) {
      throw forbidden('You can only add medications to your own list.');
    }
    const patient = assertPatientAccess(ctx.db.data, viewer, input.patientId);

    const now = new Date().toISOString();
    const startDate = input.startDate ?? todayKey();
    const endDate = input.endDate ?? null;
    if (endDate && endDate < startDate) throw badRequest('The end date must be on or after the start date.');

    const rx: Prescription = {
      id: newId('rx'),
      patientId: patient.id,
      doctorId: isDoctor ? viewer.id : null,
      drugName: input.drugName,
      strength: input.strength,
      form: input.form,
      dose: input.dose,
      route: input.route,
      frequency: input.frequency,
      times: input.times,
      instructions: input.instructions,
      purpose: input.purpose ?? null,
      quantity: input.quantity ?? null,
      refillsRemaining: input.refillsRemaining ?? 0,
      startDate,
      endDate,
      status: input.status ?? 'active',
      selfReported: !isDoctor,
      createdAt: now,
      updatedAt: now,
    };
    ctx.db.data.prescriptions.push(rx);
    ctx.db.save();

    const med = medLabel(rx);
    broadcast(viewer, patient, rx, {
      title: isDoctor ? 'New prescription' : 'Medication added',
      action: isDoctor ? `prescribed ${med}.` : `added ${med}.`,
    });
    res.status(201).json({ prescription: rx });
  });

  router.patch('/:id', (req, res) => {
    const viewer = currentUser(res);
    const rx = findPrescriptionOr404(ctx.db.data, req.params.id);
    const patient = assertCanEditPrescription(ctx.db.data, viewer, rx);
    const patch = updatePrescriptionSchema.parse(req.body);

    const startDate = patch.startDate ?? rx.startDate;
    const endDate = patch.endDate === undefined ? rx.endDate : patch.endDate;
    if (endDate && endDate < startDate) throw badRequest('The end date must be on or after the start date.');

    const previousStatus = rx.status;
    const changed = applyPatch(rx, patch);
    if (changed.length > 0) {
      rx.updatedAt = new Date().toISOString();
      const closed = rx.status === 'discontinued' ? closePendingRefills(rx) : [];
      ctx.db.save();
      announceClosedRefills(closed);
      broadcast(viewer, patient, rx, summarizeChange(rx, changed, previousStatus));
    }
    res.json({ prescription: rx });
  });

  router.delete('/:id', (req, res) => {
    const viewer = currentUser(res);
    const data = ctx.db.data;
    const rx = findPrescriptionOr404(data, req.params.id);
    const patient = assertCanEditPrescription(data, viewer, rx);
    if (rx.status === 'discontinued') {
      res.json({ prescription: rx });
      return;
    }

    const now = new Date();
    rx.status = 'discontinued';
    rx.endDate ??= maxKey(todayKey(now), rx.startDate);
    rx.updatedAt = now.toISOString();
    const closed = closePendingRefills(rx);
    ctx.db.save();

    announceClosedRefills(closed);
    const med = medLabel(rx);
    broadcast(viewer, patient, rx, {
      title: viewer.role === 'doctor' ? 'Medication stopped' : 'Medication removed',
      action: viewer.role === 'doctor' ? `discontinued ${med}.` : `removed ${med} from their list.`,
    });
    res.json({ prescription: rx });
  });

  return router;
}
