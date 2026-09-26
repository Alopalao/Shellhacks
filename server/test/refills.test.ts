import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DEMO_ACCOUNTS, DEMO_IDS } from '../src/db/seed';
import type { Prescription, RefillRequest } from '../src/shared/contracts';
import { connectSocket, login, startTestServer, type RecordingClient, type Session, type TestServer } from './helpers';

let server: TestServer;
let maya: Session;
let reyes: Session;
let patientSocket: RecordingClient;
let doctorSocket: RecordingClient;
let rxList: Prescription[];

beforeAll(async () => {
  server = await startTestServer();
  maya = await login(server, DEMO_ACCOUNTS.patient);
  reyes = await login(server, DEMO_ACCOUNTS.doctor);
  patientSocket = await connectSocket(server, maya.token);
  doctorSocket = await connectSocket(server, reyes.token);
  rxList = (await server.http.get('/api/prescriptions').set(maya.auth).expect(200)).body.prescriptions as Prescription[];
});

afterAll(async () => {
  patientSocket.close();
  doctorSocket.close();
  await server.stop();
});

const rxNamed = (name: string): Prescription => {
  const rx = rxList.find((p) => p.drugName === name);
  if (!rx) throw new Error(`seed is missing ${name}`);
  return rx;
};

describe('refill workflow', () => {
  it('request → 409 on duplicate → approve adds refills, with live events both ways', async () => {
    const metformin = rxNamed('Metformin');
    expect(metformin.refillsRemaining).toBe(0);

    const created = await server.http
      .post('/api/refills')
      .set(maya.auth)
      .send({ prescriptionId: metformin.id, patientNote: '  Almost out  ' })
      .expect(201);
    const refill = created.body.refillRequest as RefillRequest;
    expect(refill).toMatchObject({
      prescriptionId: metformin.id,
      patientId: DEMO_IDS.patient,
      doctorId: DEMO_IDS.doctor,
      status: 'pending',
      patientNote: 'Almost out',
      doctorNote: null,
      refillsAdded: null,
      resolvedAt: null,
    });
    await doctorSocket.next('refill:upsert', (r) => r.id === refill.id);
    const toDoctor = await doctorSocket.next('notify', (n) => n.kind === 'refill');
    expect(toDoctor).toMatchObject({ title: 'Refill request', href: '/doctor/inbox' });
    expect(toDoctor.body).toContain('Maya Johnson requested a refill of Metformin 500 mg');

    const duplicate = await server.http.post('/api/refills').set(maya.auth).send({ prescriptionId: metformin.id }).expect(409);
    expect(duplicate.body.error).toMatch(/already pending/);

    const pending = await server.http.get('/api/refills').query({ status: 'pending' }).set(reyes.auth).expect(200);
    expect((pending.body.refillRequests as RefillRequest[]).map((r) => r.id)).toContain(refill.id);

    const approved = await server.http
      .patch(`/api/refills/${refill.id}`)
      .set(reyes.auth)
      .send({ status: 'approved', refillsAdded: 3, doctorNote: 'Approved for 3 months.' })
      .expect(200);
    expect(approved.body.refillRequest).toMatchObject({
      status: 'approved',
      refillsAdded: 3,
      doctorNote: 'Approved for 3 months.',
      resolvedAt: expect.any(String),
    });
    expect(approved.body.prescription).toMatchObject({ id: metformin.id, refillsRemaining: 3 });

    await patientSocket.next('refill:upsert', (r) => r.id === refill.id && r.status === 'approved');
    await patientSocket.next('prescription:upsert', (p) => p.id === metformin.id && p.refillsRemaining === 3);
    const toPatient = await patientSocket.next('notify', (n) => n.kind === 'refill');
    expect(toPatient).toMatchObject({ title: 'Refill approved', href: `/patient/meds/${metformin.id}` });
    expect(toPatient.body).toContain('approved 3 refills of Metformin 500 mg');

    // Already resolved.
    await server.http.patch(`/api/refills/${refill.id}`).set(reyes.auth).send({ status: 'denied' }).expect(409);
  });

  it('approval defaults to one refill; denial keeps the count', async () => {
    const lisinopril = rxNamed('Lisinopril');
    const first = await server.http.post('/api/refills').set(maya.auth).send({ prescriptionId: lisinopril.id }).expect(201);
    const res = await server.http
      .patch(`/api/refills/${first.body.refillRequest.id}`)
      .set(reyes.auth)
      .send({ status: 'approved' })
      .expect(200);
    expect(res.body.refillRequest.refillsAdded).toBe(1);
    expect(res.body.prescription.refillsRemaining).toBe(lisinopril.refillsRemaining + 1);

    const second = await server.http.post('/api/refills').set(maya.auth).send({ prescriptionId: lisinopril.id }).expect(201);
    const denied = await server.http
      .patch(`/api/refills/${second.body.refillRequest.id}`)
      .set(reyes.auth)
      .send({ status: 'denied', doctorNote: 'Too early — you still have refills left.' })
      .expect(200);
    expect(denied.body.refillRequest).toMatchObject({ status: 'denied', refillsAdded: null });
    expect(denied.body.prescription.refillsRemaining).toBe(lisinopril.refillsRemaining + 1);
    const toast = await patientSocket.next('notify', (n) => n.title === 'Refill request declined');
    expect(toast.body).toContain('Too early');
  });

  it('rejects self-reported meds, bad input and wrong roles', async () => {
    await server.http.post('/api/refills').set(maya.auth).send({ prescriptionId: rxNamed('Vitamin D3').id }).expect(400);
    await server.http.post('/api/refills').set(maya.auth).send({ prescriptionId: 'rx_missing' }).expect(404);
    await server.http.post('/api/refills').set(maya.auth).send({}).expect(400);
    await server.http.post('/api/refills').set(reyes.auth).send({ prescriptionId: rxNamed('Metformin').id }).expect(403);

    const atorvastatin = rxNamed('Atorvastatin');
    const res = await server.http.post('/api/refills').set(maya.auth).send({ prescriptionId: atorvastatin.id }).expect(201);
    await server.http
      .patch(`/api/refills/${res.body.refillRequest.id}`)
      .set(reyes.auth)
      .send({ status: 'maybe' })
      .expect(400);
    await server.http
      .patch(`/api/refills/${res.body.refillRequest.id}`)
      .set(reyes.auth)
      .send({ status: 'approved', refillsAdded: 0 })
      .expect(400);
  });

  it('lists newest first for both sides', async () => {
    const mine = await server.http.get('/api/refills').set(maya.auth).expect(200);
    const list = mine.body.refillRequests as RefillRequest[];
    expect(list.every((r) => r.patientId === DEMO_IDS.patient)).toBe(true);
    expect([...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt))).toEqual(list);

    const doctorView = await server.http.get('/api/refills').set(reyes.auth).expect(200);
    const patients = new Set((doctorView.body.refillRequests as RefillRequest[]).map((r) => r.patientId));
    expect(patients).toEqual(new Set([DEMO_IDS.patient, DEMO_IDS.patient2]));
  });
});
