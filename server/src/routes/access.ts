// Authorization rules shared by the route handlers:
//  • patients may only touch their own data;
//  • doctors may only touch patients currently assigned to them;
//  • threads are visible to their two participants only.
import type { DbData } from '../context';
import { findUser, patientsOf, resolveThreadAccess } from '../db/queries';
import type { Prescription, User } from '../shared/contracts';
import { badRequest, forbidden, notFound } from './http';

/** The patient `patientId` if `viewer` may access their records (else 403/404). */
export function assertPatientAccess(data: DbData, viewer: User, patientId: string): User {
  if (viewer.role === 'patient') {
    if (viewer.id !== patientId) throw forbidden("You can only access your own health records.");
    return viewer;
  }
  const patient = findUser(data, patientId);
  if (!patient || patient.role !== 'patient') throw notFound('Patient');
  if (patient.doctorId !== viewer.id) throw forbidden('This patient is not assigned to you.');
  return patient;
}

/**
 * Patient ids a list endpoint should cover: a patient → themselves; a doctor → the
 * requested (assigned) patient, or all their patients when none is requested.
 */
export function patientScope(data: DbData, viewer: User, requestedPatientId?: string): string[] {
  if (requestedPatientId) return [assertPatientAccess(data, viewer, requestedPatientId).id];
  if (viewer.role === 'patient') return [viewer.id];
  return patientsOf(data, viewer.id).map((p) => p.id);
}

export function findPrescriptionOr404(data: DbData, id: string): Prescription {
  const rx = data.prescriptions.find((p) => p.id === id);
  if (!rx) throw notFound('Prescription');
  return rx;
}

/**
 * Who may change a prescription: the prescribing doctor or the patient's assigned doctor;
 * the patient only for items they self-reported.
 */
export function assertCanEditPrescription(data: DbData, viewer: User, rx: Prescription): User {
  const patient = findUser(data, rx.patientId);
  if (!patient) throw notFound('Patient');
  if (viewer.role === 'patient') {
    if (rx.patientId !== viewer.id) throw forbidden("You can only change your own medications.");
    if (!rx.selfReported) {
      throw forbidden('Only your doctor can change this prescription. Send them a message if something needs updating.');
    }
    return patient;
  }
  if (rx.doctorId !== viewer.id && patient.doctorId !== viewer.id) {
    throw forbidden('This patient is not assigned to you.');
  }
  return patient;
}

/** A thread the viewer participates in (404 malformed/unknown, 403 not a participant). */
export function assertThreadAccess(data: DbData, viewer: User, threadId: string) {
  const access = resolveThreadAccess(data, viewer.id, threadId);
  if (access.ok) return access;
  if (access.reason === 'forbidden') throw forbidden("You're not part of this conversation.");
  throw notFound('Conversation');
}

/** Validates an inclusive YYYY-MM-DD range. */
export function assertDateRange(from?: string, to?: string): void {
  if (from && to && from > to) throw badRequest("'from' must be on or before 'to'.");
}
