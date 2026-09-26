// /api/refills — patients request refills; doctors approve (adding refills) or deny.
import { Router } from 'express';
import { requireRole } from '../auth/middleware';
import { currentUser, type ServerContext } from '../context';
import { newId } from '../db/ids';
import { findUser, newestFirst } from '../db/queries';
import type { RefillRequest } from '../shared/contracts';
import { assertPatientAccess, findPrescriptionOr404 } from './access';
import { displayName, emitTo, hrefs, medLabel, notify, shortName } from './events';
import { badRequest, conflict, forbidden, notFound } from './http';
import { createRefillSchema, refillsQuerySchema, resolveRefillSchema } from './schemas';

export function createRefillsRouter(ctx: ServerContext): Router {
  const router = Router();

  router.get('/', (req, res) => {
    const viewer = currentUser(res);
    const query = refillsQuerySchema.parse(req.query);
    const data = ctx.db.data;
    if (query.patientId) assertPatientAccess(data, viewer, query.patientId);
    const refillRequests = data.refillRequests
      .filter((r) => {
        const visible = viewer.role === 'patient' ? r.patientId === viewer.id : r.doctorId === viewer.id;
        return (
          visible &&
          (!query.patientId || r.patientId === query.patientId) &&
          (!query.status || r.status === query.status)
        );
      })
      .sort(newestFirst);
    res.json({ refillRequests });
  });

  router.post('/', requireRole('patient'), (req, res) => {
    const viewer = currentUser(res);
    const input = createRefillSchema.parse(req.body);
    const data = ctx.db.data;
    const rx = findPrescriptionOr404(data, input.prescriptionId);
    if (rx.patientId !== viewer.id) throw forbidden('You can only request refills for your own prescriptions.');
    if (rx.selfReported) {
      throw badRequest("This is a self-reported medication, so there's no prescription to refill. Ask your pharmacist or doctor.");
    }
    if (rx.status === 'discontinued') throw badRequest(`${rx.drugName} has been discontinued and can't be refilled.`);
    const doctorId = viewer.doctorId ?? rx.doctorId;
    if (!doctorId || !findUser(data, doctorId)) {
      throw badRequest('Choose a physician in your profile before requesting a refill.');
    }
    const pending = data.refillRequests.find((r) => r.prescriptionId === rx.id && r.status === 'pending');
    if (pending) {
      throw conflict(`A refill request for ${rx.drugName} is already pending.`, { refillRequest: pending });
    }

    const refillRequest: RefillRequest = {
      id: newId('ref'),
      prescriptionId: rx.id,
      patientId: viewer.id,
      doctorId,
      status: 'pending',
      patientNote: input.patientNote ?? null,
      doctorNote: null,
      refillsAdded: null,
      createdAt: new Date().toISOString(),
      resolvedAt: null,
    };
    data.refillRequests.push(refillRequest);
    ctx.db.save();

    emitTo(ctx, [viewer.id, doctorId], 'refill:upsert', refillRequest);
    notify(ctx, doctorId, {
      kind: 'refill',
      title: 'Refill request',
      body: `${viewer.name} requested a refill of ${medLabel(rx)}.${refillRequest.patientNote ? ` “${refillRequest.patientNote}”` : ''}`,
      href: hrefs.doctor.inbox,
    });
    res.status(201).json({ refillRequest });
  });

  router.patch('/:id', requireRole('doctor'), (req, res) => {
    const viewer = currentUser(res);
    const data = ctx.db.data;
    const refill = data.refillRequests.find((r) => r.id === req.params.id);
    if (!refill) throw notFound('Refill request');
    const patient = findUser(data, refill.patientId);
    if (refill.doctorId !== viewer.id && patient?.doctorId !== viewer.id) {
      throw forbidden('This refill request is not addressed to you.');
    }
    if (refill.status !== 'pending') {
      throw conflict(`This refill request was already ${refill.status}.`, { refillRequest: refill });
    }
    const input = resolveRefillSchema.parse(req.body);
    const rx = findPrescriptionOr404(data, refill.prescriptionId);
    const now = new Date().toISOString();

    refill.status = input.status;
    refill.doctorNote = input.doctorNote ?? null;
    refill.resolvedAt = now;
    if (input.status === 'approved') {
      const added = input.refillsAdded ?? 1;
      refill.refillsAdded = added;
      rx.refillsRemaining += added;
      rx.updatedAt = now;
    }
    ctx.db.save();

    const parties = [refill.patientId, refill.doctorId, viewer.id];
    emitTo(ctx, parties, 'refill:upsert', refill);
    emitTo(ctx, parties, 'prescription:upsert', rx);

    const med = medLabel(rx);
    const note = refill.doctorNote ? ` Note: “${refill.doctorNote}”` : '';
    const approved = refill.status === 'approved';
    const count = refill.refillsAdded ?? 0;
    notify(ctx, refill.patientId, {
      kind: 'refill',
      title: approved ? 'Refill approved' : 'Refill request declined',
      body: approved
        ? `${shortName(viewer)} approved ${count} refill${count === 1 ? '' : 's'} of ${med}.${note}`
        : `${displayName(viewer)} declined your refill of ${med}.${note || ' Send a message if you have questions.'}`,
      href: hrefs.patient.med(rx.id),
    });
    res.json({ refillRequest: refill, prescription: rx });
  });

  return router;
}
