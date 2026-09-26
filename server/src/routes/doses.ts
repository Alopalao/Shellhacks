// /api/doses — the patient's dose checklist log.
import { Router } from 'express';
import { requireRole } from '../auth/middleware';
import { currentUser, type ServerContext } from '../context';
import { addDays, todayKey } from '../db/dates';
import { newId } from '../db/ids';
import type { DoseLog } from '../shared/contracts';
import { assertDateRange, findPrescriptionOr404, patientScope } from './access';
import { emitTo } from './events';
import { badRequest, forbidden, notFound } from './http';
import { dosesQuerySchema, logDoseSchema } from './schemas';

/** Newest first (by day, then slot). */
const compareDoses = (a: DoseLog, b: DoseLog): number => b.date.localeCompare(a.date) || b.slot.localeCompare(a.slot);

export function createDosesRouter(ctx: ServerContext): Router {
  const router = Router();

  router.get('/', (req, res) => {
    const viewer = currentUser(res);
    const query = dosesQuerySchema.parse(req.query);
    assertDateRange(query.from, query.to);
    const ids = new Set(patientScope(ctx.db.data, viewer, query.patientId));
    const doseLogs = ctx.db.data.doseLogs
      .filter(
        (d) =>
          ids.has(d.patientId) &&
          (!query.prescriptionId || d.prescriptionId === query.prescriptionId) &&
          (!query.from || d.date >= query.from) &&
          (!query.to || d.date <= query.to),
      )
      .sort(compareDoses);
    res.json({ doseLogs });
  });

  router.post('/', requireRole('patient'), (req, res) => {
    const viewer = currentUser(res);
    const input = logDoseSchema.parse(req.body);
    const data = ctx.db.data;
    const rx = findPrescriptionOr404(data, input.prescriptionId);
    if (rx.patientId !== viewer.id) throw forbidden('You can only log your own doses.');
    if (rx.status === 'discontinued') throw badRequest(`${rx.drugName} has been discontinued, so doses can't be logged.`);
    if (rx.times.length > 0 && !rx.times.includes(input.slot)) {
      throw badRequest(`${input.slot} isn't one of the scheduled times for ${rx.drugName} (${rx.times.join(', ')}).`);
    }
    // Allow one day of slack for patients whose local date is ahead of the server's.
    if (input.date > addDays(todayKey(), 1)) throw badRequest("You can't log a dose for a future date.");

    const existing = data.doseLogs.find(
      (d) => d.prescriptionId === rx.id && d.date === input.date && d.slot === input.slot,
    );
    if (existing) {
      res.json({ doseLog: existing });
      return;
    }

    const doseLog: DoseLog = {
      id: newId('dose'),
      prescriptionId: rx.id,
      patientId: viewer.id,
      date: input.date,
      slot: input.slot,
      takenAt: new Date().toISOString(),
    };
    data.doseLogs.push(doseLog);
    ctx.db.save();
    emitTo(ctx, [viewer.id, viewer.doctorId], 'dose:logged', doseLog);
    res.status(201).json({ doseLog });
  });

  router.delete('/:id', requireRole('patient'), (req, res) => {
    const viewer = currentUser(res);
    const data = ctx.db.data;
    const doseLog = data.doseLogs.find((d) => d.id === req.params.id);
    if (!doseLog) throw notFound('Dose');
    if (doseLog.patientId !== viewer.id) throw forbidden('You can only change your own doses.');

    data.doseLogs = data.doseLogs.filter((d) => d.id !== doseLog.id);
    ctx.db.save();
    emitTo(ctx, [viewer.id, viewer.doctorId], 'dose:removed', {
      id: doseLog.id,
      prescriptionId: doseLog.prescriptionId,
      patientId: doseLog.patientId,
    });
    res.json({ ok: true });
  });

  return router;
}
