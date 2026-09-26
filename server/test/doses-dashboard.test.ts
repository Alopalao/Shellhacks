import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { addDays, dateRange, todayKey } from '../src/db/dates';
import { DEMO_ACCOUNTS, DEMO_IDS } from '../src/db/seed';
import { computeAdherence } from '../src/routes/adherence';
import type { DoseLog, PatientDashboard, PatientSummary, Prescription } from '../src/shared/contracts';
import { connectSocket, login, startTestServer, uniqueEmail, type Session, type TestServer } from './helpers';

let server: TestServer;
let reyes: Session;

beforeAll(async () => {
  server = await startTestServer();
  reyes = await login(server, DEMO_ACCOUNTS.doctor);
});

afterAll(async () => {
  await server.stop();
});

async function prescribe(patientId: string, overrides: Record<string, unknown> = {}): Promise<Prescription> {
  const res = await server.http
    .post('/api/prescriptions')
    .set(reyes.auth)
    .send({
      patientId,
      drugName: 'Losartan',
      strength: '25 mg',
      form: 'tablet',
      dose: '1 tablet',
      route: 'by mouth',
      frequency: 'once daily',
      times: ['00:00'],
      instructions: 'Take once a day.',
      ...overrides,
    })
    .expect(201);
  return res.body.prescription as Prescription;
}

describe('dose logging', () => {
  it('is idempotent per prescription + date + slot and pushes events to the doctor', async () => {
    const patient = await login(server, uniqueEmail('doses'));
    const rx = await prescribe(patient.user.id, { times: ['08:00', '20:00'] });
    const doctorSocket = await connectSocket(server, reyes.token);
    const today = todayKey();

    const first = await server.http
      .post('/api/doses')
      .set(patient.auth)
      .send({ prescriptionId: rx.id, date: today, slot: '08:00' })
      .expect(201);
    const dose = first.body.doseLog as DoseLog;
    expect(dose).toMatchObject({ prescriptionId: rx.id, patientId: patient.user.id, date: today, slot: '08:00' });
    await doctorSocket.next('dose:logged', (d) => d.id === dose.id);

    const again = await server.http
      .post('/api/doses')
      .set(patient.auth)
      .send({ prescriptionId: rx.id, date: today, slot: '08:00' })
      .expect(200);
    expect(again.body.doseLog).toEqual(dose);
    const logs = await server.http.get('/api/doses').query({ from: today, to: today }).set(patient.auth).expect(200);
    expect(logs.body.doseLogs).toEqual([dose]);

    // Slot must be one of the scheduled times; dates must be real and not in the future.
    await server.http
      .post('/api/doses')
      .set(patient.auth)
      .send({ prescriptionId: rx.id, date: today, slot: '09:00' })
      .expect(400);
    await server.http
      .post('/api/doses')
      .set(patient.auth)
      .send({ prescriptionId: rx.id, date: addDays(today, 5), slot: '08:00' })
      .expect(400);
    await server.http
      .post('/api/doses')
      .set(patient.auth)
      .send({ prescriptionId: rx.id, date: '2026-13-01', slot: '08:00' })
      .expect(400);

    await server.http.delete(`/api/doses/${dose.id}`).set(patient.auth).expect(200, { ok: true });
    const removed = await doctorSocket.next('dose:removed');
    expect(removed).toEqual({ id: dose.id, prescriptionId: rx.id, patientId: patient.user.id });
    await server.http.delete(`/api/doses/${dose.id}`).set(patient.auth).expect(404);

    // Doctor can read the patient's doses; range filters are validated.
    const doctorView = await server.http.get('/api/doses').query({ patientId: patient.user.id }).set(reyes.auth).expect(200);
    expect(doctorView.body.doseLogs).toEqual([]);
    await server.http.get('/api/doses').query({ from: today, to: addDays(today, -1) }).set(patient.auth).expect(400);
    doctorSocket.close();
  });

  it('accepts any time for as-needed meds and refuses discontinued ones', async () => {
    const patient = await login(server, uniqueEmail('prn'));
    const prn = await prescribe(patient.user.id, { drugName: 'Albuterol', times: [], frequency: 'as needed' });
    await server.http
      .post('/api/doses')
      .set(patient.auth)
      .send({ prescriptionId: prn.id, date: todayKey(), slot: '13:37' })
      .expect(201);
    await server.http.delete(`/api/prescriptions/${prn.id}`).set(reyes.auth).expect(200);
    await server.http
      .post('/api/doses')
      .set(patient.auth)
      .send({ prescriptionId: prn.id, date: todayKey(), slot: '14:00' })
      .expect(400);
  });
});

describe('dashboard', () => {
  it('summarises the seeded patient home screen', async () => {
    const maya = await login(server, DEMO_ACCOUNTS.patient);
    const res = await server.http.get('/api/dashboard').set(maya.auth).expect(200);
    const dash = res.body as PatientDashboard;
    expect(dash.doctor?.id).toBe(DEMO_IDS.doctor);
    expect(typeof dash.doctorOnline).toBe('boolean');
    expect(dash.prescriptions.map((p) => p.drugName).sort()).toEqual(
      ['Atorvastatin', 'Lisinopril', 'Metformin', 'Vitamin D3'].sort(),
    );
    expect(dash.prescriptions.every((p) => p.status !== 'discontinued')).toBe(true);
    expect(dash.todayDoses.every((d) => d.date === todayKey())).toBe(true);
    expect(dash.pendingRefills).toEqual([]);
    expect(dash.latestNote?.title).toBe('Follow-up: blood pressure & diabetes');
    expect(dash.unreadMessages).toBe(1);

    const other = await server.http.get('/api/dashboard').query({ date: addDays(todayKey(), -1) }).set(maya.auth).expect(200);
    expect((other.body as PatientDashboard).todayDoses.every((d) => d.date === addDays(todayKey(), -1))).toBe(true);
    await server.http.get('/api/dashboard').query({ date: 'yesterday' }).set(maya.auth).expect(400);
    await server.http.get('/api/dashboard').set(reyes.auth).expect(403);
  });

  it('reports 7-day adherence in /api/patients summaries', async () => {
    const patient = await login(server, uniqueEmail('adherence'));
    const today = todayKey();
    // One 00:00 slot per day (always due) for the last 7 days → 7 scheduled slots.
    const rx = await prescribe(patient.user.id, { startDate: addDays(today, -6), refillsRemaining: 1 });
    const summaryOf = async (): Promise<PatientSummary> => {
      const res = await server.http.get('/api/patients').set(reyes.auth).expect(200);
      const row = (res.body.patients as PatientSummary[]).find((s) => s.patient.id === patient.user.id);
      if (!row) throw new Error('patient missing from summary');
      return row;
    };

    expect((await summaryOf()).adherence7d).toBe(0);
    for (const daysAgo of [0, 1, 2, 4, 6]) {
      await server.http
        .post('/api/doses')
        .set(patient.auth)
        .send({ prescriptionId: rx.id, date: addDays(today, -daysAgo), slot: '00:00' })
        .expect(201);
    }
    // A dose from before the window doesn't count.
    await server.http
      .post('/api/doses')
      .set(patient.auth)
      .send({ prescriptionId: rx.id, date: addDays(today, -9), slot: '00:00' })
      .expect(201);

    await server.http.post('/api/refills').set(patient.auth).send({ prescriptionId: rx.id }).expect(201);
    const summary = await summaryOf();
    expect(summary.adherence7d).toBeCloseTo(5 / 7, 10);
    expect(summary).toMatchObject({ activePrescriptions: 1, pendingRefills: 1, unreadMessages: 0, lastMessageAt: null });

    // Discontinued meds leave the calculation → nothing scheduled → null.
    await server.http.delete(`/api/prescriptions/${rx.id}`).set(reyes.auth).expect(200);
    const after = await summaryOf();
    expect(after.adherence7d).toBeNull();
    expect(after.pendingRefills).toBe(0); // the pending refill was closed with the prescription
  });
});

describe('computeAdherence', () => {
  const base: Prescription = {
    id: 'rx_a',
    patientId: 'usr_p',
    doctorId: 'usr_d',
    drugName: 'A',
    strength: '',
    form: '',
    dose: '',
    route: '',
    frequency: '',
    times: ['08:00', '20:00'],
    instructions: '',
    purpose: null,
    quantity: null,
    refillsRemaining: 0,
    startDate: '2026-01-01',
    endDate: null,
    status: 'active',
    selfReported: false,
    createdAt: '',
    updatedAt: '',
  };
  const log = (date: string, slot: string, prescriptionId = 'rx_a'): DoseLog => ({
    id: `${prescriptionId}-${date}-${slot}`,
    prescriptionId,
    patientId: 'usr_p',
    date,
    slot,
    takenAt: '',
  });
  const opts = { today: '2026-03-10', nowTime: '12:00' };

  it('counts only due slots today (plus any logged early)', () => {
    // 6 full days × 2 + today's 08:00 = 13 slots.
    expect(computeAdherence([base], [], opts)).toEqual({ scheduled: 13, taken: 0, rate: 0 });
    const early = computeAdherence([base], [log('2026-03-10', '20:00')], opts);
    expect(early).toEqual({ scheduled: 14, taken: 1, rate: 1 / 14 });
  });

  it('respects start/end dates, skips paused, discontinued and as-needed meds', () => {
    const recent = { ...base, startDate: '2026-03-09' }; // yesterday ×2 + today 08:00
    expect(computeAdherence([recent], [log('2026-03-09', '08:00')], opts)).toEqual({ scheduled: 3, taken: 1, rate: 1 / 3 });
    const ended = { ...base, endDate: '2026-03-04' }; // 03-04 only
    expect(computeAdherence([ended], [], opts).scheduled).toBe(2);
    expect(computeAdherence([{ ...base, status: 'discontinued' }], [], opts).rate).toBeNull();
    expect(computeAdherence([{ ...base, times: [] }], [log('2026-03-10', '09:00')], opts).rate).toBeNull();
    // Doses the patient correctly skips while a med is paused are not misses.
    expect(computeAdherence([{ ...base, status: 'paused' }], [], opts).rate).toBeNull();
    const everyDose = dateRange('2026-03-04', '2026-03-10').flatMap((d) => [log(d, '08:00'), log(d, '20:00')]);
    const paused: Prescription = { ...base, id: 'rx_b', status: 'paused' };
    expect(computeAdherence([base, paused], everyDose, opts)).toEqual({ scheduled: 14, taken: 14, rate: 1 });
  });

  it('ignores logs outside the window or for other slots', () => {
    const logs = [log('2026-03-01', '08:00'), log('2026-03-05', '09:00'), log('2026-03-05', '08:00', 'rx_other')];
    expect(computeAdherence([base], logs, opts).taken).toBe(0);
  });
});
