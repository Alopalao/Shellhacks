// GET /api/dashboard?date=YYYY-MM-DD — everything the patient home screen needs in one call.
import { Router } from 'express';
import { requireRole } from '../auth/middleware';
import { currentUser, type ServerContext } from '../context';
import { todayKey } from '../db/dates';
import { comparePrescriptions, findUser, newestFirst, threadIdFor, unreadCountFor } from '../db/queries';
import type { PatientDashboard } from '../shared/contracts';
import { dashboardQuerySchema } from './schemas';

export function createDashboardRouter(ctx: ServerContext): Router {
  const router = Router();

  router.get('/', requireRole('patient'), (req, res) => {
    const patient = currentUser(res);
    // `date` is the patient's local "today" (their device may be in another time zone).
    const { date = todayKey() } = dashboardQuerySchema.parse(req.query);
    const data = ctx.db.data;
    const doctor = findUser(data, patient.doctorId) ?? null;

    const dashboard: PatientDashboard = {
      doctor,
      doctorOnline: doctor ? ctx.realtime.isOnline(doctor.id) : false,
      prescriptions: data.prescriptions
        .filter((p) => p.patientId === patient.id && p.status !== 'discontinued')
        .sort(comparePrescriptions),
      todayDoses: data.doseLogs
        .filter((d) => d.patientId === patient.id && d.date === date)
        .sort((a, b) => a.slot.localeCompare(b.slot)),
      pendingRefills: data.refillRequests
        .filter((r) => r.patientId === patient.id && r.status === 'pending')
        .sort(newestFirst),
      latestNote: data.visitNotes.filter((n) => n.patientId === patient.id).sort(newestFirst)[0] ?? null,
      unreadMessages: doctor ? unreadCountFor(data, threadIdFor(patient.id, doctor.id), patient.id) : 0,
    };
    res.json(dashboard);
  });

  return router;
}
