// /api/me — the signed-in user's profile, and a patient's choice of physician.
import { Router } from 'express';
import { requireRole } from '../auth/middleware';
import { currentUser, type ServerContext } from '../context';
import { counterpartIds, findUser } from '../db/queries';
import { isRealtimeServer } from '../realtime';
import { displayName, emitTo, hrefs, notify } from './events';
import { badRequest, notFound } from './http';
import { assignDoctorSchema, updateMeSchema } from './schemas';

const sameList = (a: readonly string[], b: readonly string[]): boolean =>
  a.length === b.length && a.every((item, i) => item === b[i]);

export function createMeRouter(ctx: ServerContext): Router {
  const router = Router();

  router.get('/', (_req, res) => {
    res.json({ user: currentUser(res) });
  });

  router.patch('/', (req, res) => {
    const user = currentUser(res);
    const input = updateMeSchema.parse(req.body);

    if (input.patient && user.role !== 'patient') throw badRequest('Only patients have a patient profile.');
    if (input.doctor && user.role !== 'doctor') throw badRequest('Only doctors have a doctor profile.');

    const changedClinical: string[] = [];
    if (input.name !== undefined) user.name = input.name;

    if (input.patient) {
      const profile = (user.patient ??= { allergies: [], conditions: [] });
      const { dateOfBirth, allergies, conditions, pharmacy } = input.patient;
      if (dateOfBirth !== undefined) {
        if (dateOfBirth) profile.dateOfBirth = dateOfBirth;
        else delete profile.dateOfBirth;
      }
      if (allergies !== undefined) {
        if (!sameList(profile.allergies, allergies)) changedClinical.push('allergies');
        profile.allergies = allergies;
      }
      if (conditions !== undefined) {
        if (!sameList(profile.conditions, conditions)) changedClinical.push('conditions');
        profile.conditions = conditions;
      }
      if (pharmacy !== undefined) {
        if (pharmacy) profile.pharmacy = pharmacy;
        else delete profile.pharmacy;
      }
    }

    if (input.doctor) {
      const profile = (user.doctor ??= { specialty: 'General Practice', credentials: 'MD' });
      const { specialty, credentials, clinic, bio } = input.doctor;
      if (specialty !== undefined) profile.specialty = specialty;
      if (credentials !== undefined) profile.credentials = credentials;
      if (clinic !== undefined) {
        if (clinic) profile.clinic = clinic;
        else delete profile.clinic;
      }
      if (bio !== undefined) {
        if (bio) profile.bio = bio;
        else delete profile.bio;
      }
    }

    ctx.db.save();
    // Counterparts refresh their view of this user; the user's other devices stay in sync too.
    emitTo(ctx, [user.id, ...counterpartIds(ctx.db.data, user)], 'user:updated', user);
    if (user.role === 'patient' && changedClinical.length > 0) {
      notify(ctx, user.doctorId, {
        kind: 'system',
        title: 'Patient profile updated',
        body: `${user.name} updated their ${changedClinical.join(' and ')}.`,
        href: hrefs.doctor.patient(user.id),
      });
    }
    res.json({ user });
  });

  router.put('/doctor', requireRole('patient'), (req, res) => {
    const user = currentUser(res);
    const { doctorId } = assignDoctorSchema.parse(req.body);
    const doctor = findUser(ctx.db.data, doctorId);
    if (!doctor || doctor.role !== 'doctor') throw notFound('Doctor');

    const previousDoctorId = user.doctorId ?? null;
    if (previousDoctorId === doctor.id) {
      res.json({ user });
      return;
    }
    user.doctorId = doctor.id;

    // Hand pending refill requests over to the new physician so none get lost.
    const moved = ctx.db.data.refillRequests.filter(
      (r) => r.patientId === user.id && r.status === 'pending' && r.doctorId === previousDoctorId,
    );
    for (const refill of moved) refill.doctorId = doctor.id;
    ctx.db.save();

    emitTo(ctx, [user.id, previousDoctorId, doctor.id], 'user:updated', user);
    for (const refill of moved) emitTo(ctx, [user.id, previousDoctorId, doctor.id], 'refill:upsert', refill);
    if (isRealtimeServer(ctx.realtime)) ctx.realtime.broadcastPresence(user.id);
    notify(ctx, doctor.id, {
      kind: 'system',
      title: 'New patient',
      body: `${user.name} chose you as their physician.`,
      href: hrefs.doctor.patient(user.id),
    });
    notify(ctx, previousDoctorId, {
      kind: 'system',
      title: 'Patient transferred',
      body: `${user.name} switched their care to ${displayName(doctor)}.`,
      href: hrefs.doctor.inbox,
    });
    res.json({ user });
  });

  return router;
}
