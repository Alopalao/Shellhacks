// /api/patients — the doctor's patient list and patient detail.
import { Router } from 'express';
import { requireRole } from '../auth/middleware';
import { currentUser, type ServerContext } from '../context';
import { addDays, toDateKey, toTimeKey } from '../db/dates';
import {
  comparePrescriptions,
  lastMessageOf,
  newestFirst,
  patientsOf,
  threadIdFor,
  unreadCountFor,
} from '../db/queries';
import type { PatientDetail, PatientSummary, User } from '../shared/contracts';
import { assertPatientAccess } from './access';
import { computeAdherence } from './adherence';

export function createPatientsRouter(ctx: ServerContext): Router {
  const router = Router();
  router.use(requireRole('doctor'));

  const summarize = (doctor: User, patient: User, now: Date): PatientSummary => {
    const data = ctx.db.data;
    const threadId = threadIdFor(patient.id, doctor.id);
    const prescriptions = data.prescriptions.filter((p) => p.patientId === patient.id);
    const doseLogs = data.doseLogs.filter((d) => d.patientId === patient.id);
    return {
      patient,
      online: ctx.realtime.isOnline(patient.id),
      activePrescriptions: prescriptions.filter((p) => p.status === 'active').length,
      adherence7d: computeAdherence(prescriptions, doseLogs, {
        today: toDateKey(now),
        nowTime: toTimeKey(now),
        days: 7,
      }).rate,
      pendingRefills: data.refillRequests.filter((r) => r.patientId === patient.id && r.status === 'pending').length,
      unreadMessages: unreadCountFor(data, threadId, doctor.id),
      lastMessageAt: lastMessageOf(data, threadId)?.createdAt ?? null,
    };
  };

  router.get('/', (_req, res) => {
    const doctor = currentUser(res);
    const now = new Date();
    const patients = patientsOf(ctx.db.data, doctor.id)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((patient) => summarize(doctor, patient, now));
    res.json({ patients });
  });

  router.get('/:id', (req, res) => {
    const doctor = currentUser(res);
    const data = ctx.db.data;
    const patient = assertPatientAccess(data, doctor, req.params.id);
    const since = addDays(toDateKey(new Date()), -13);
    const detail: PatientDetail = {
      patient,
      online: ctx.realtime.isOnline(patient.id),
      prescriptions: data.prescriptions.filter((p) => p.patientId === patient.id).sort(comparePrescriptions),
      doseLogs: data.doseLogs
        .filter((d) => d.patientId === patient.id && d.date >= since)
        .sort((a, b) => b.date.localeCompare(a.date) || b.slot.localeCompare(a.slot)),
      refillRequests: data.refillRequests.filter((r) => r.patientId === patient.id).sort(newestFirst),
      notes: data.visitNotes.filter((n) => n.patientId === patient.id).sort(newestFirst),
    };
    res.json(detail);
  });

  return router;
}
