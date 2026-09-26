import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DEMO_ACCOUNTS, DEMO_IDS } from '../src/db/seed';
import type { Prescription, Thread } from '../src/shared/contracts';
import { login, startTestServer, uniqueEmail, type Session, type TestServer } from './helpers';

let server: TestServer;
let maya: Session;
let jordan: Session;
let reyes: Session;
let otherDoctor: Session;
let mayaRx: Prescription[];

beforeAll(async () => {
  server = await startTestServer();
  maya = await login(server, DEMO_ACCOUNTS.patient);
  jordan = await login(server, DEMO_ACCOUNTS.patient2);
  reyes = await login(server, DEMO_ACCOUNTS.doctor);
  otherDoctor = await login(server, uniqueEmail('otherdoc'), { role: 'doctor' });
  const res = await server.http.get('/api/prescriptions').set(maya.auth).expect(200);
  mayaRx = res.body.prescriptions as Prescription[];
});

afterAll(async () => {
  await server.stop();
});

const rxNamed = (name: string): Prescription => {
  const rx = mayaRx.find((p) => p.drugName === name);
  if (!rx) throw new Error(`seed is missing ${name}`);
  return rx;
};

describe('patients only see their own data', () => {
  it('lists only their own prescriptions, notes, doses and refills', async () => {
    for (const path of ['/api/prescriptions', '/api/notes', '/api/doses', '/api/refills']) {
      const res = await server.http.get(path).set(maya.auth).expect(200);
      const items = Object.values(res.body)[0] as Array<{ patientId: string }>;
      expect(items.length).toBeGreaterThan(0);
      expect(items.every((item) => item.patientId === DEMO_IDS.patient)).toBe(true);
    }
  });

  it("gets 403 asking for another patient's records", async () => {
    for (const path of ['/api/prescriptions', '/api/notes', '/api/doses', '/api/refills']) {
      await server.http.get(path).query({ patientId: DEMO_IDS.patient2 }).set(maya.auth).expect(403);
    }
  });

  it('cannot use doctor-only endpoints', async () => {
    await server.http.get('/api/patients').set(maya.auth).expect(403);
    await server.http.get(`/api/patients/${DEMO_IDS.patient}`).set(maya.auth).expect(403);
    await server.http
      .post('/api/notes')
      .set(maya.auth)
      .send({ patientId: DEMO_IDS.patient, title: 'x', body: 'y' })
      .expect(403);
    const refills = await server.http.get('/api/refills').set(jordan.auth).expect(200);
    await server.http
      .patch(`/api/refills/${refills.body.refillRequests[0].id}`)
      .set(jordan.auth)
      .send({ status: 'approved' })
      .expect(403);
  });

  it("cannot change a doctor's prescription or another patient's meds", async () => {
    const lisinopril = rxNamed('Lisinopril');
    await server.http.patch(`/api/prescriptions/${lisinopril.id}`).set(maya.auth).send({ dose: '2 tablets' }).expect(403);
    await server.http.delete(`/api/prescriptions/${lisinopril.id}`).set(maya.auth).expect(403);
    await server.http.patch(`/api/prescriptions/${lisinopril.id}`).set(jordan.auth).send({ dose: '2 tablets' }).expect(403);
    await server.http
      .post('/api/doses')
      .set(jordan.auth)
      .send({ prescriptionId: lisinopril.id, date: '2026-01-01', slot: '08:00' })
      .expect(403);
    await server.http
      .post('/api/prescriptions')
      .set(maya.auth)
      .send({ patientId: DEMO_IDS.patient2, drugName: 'Ibuprofen' })
      .expect(403);
  });

  it('can manage their own self-reported items', async () => {
    const vitaminD = rxNamed('Vitamin D3');
    const res = await server.http
      .patch(`/api/prescriptions/${vitaminD.id}`)
      .set(maya.auth)
      .send({ instructions: 'With lunch.' })
      .expect(200);
    expect(res.body.prescription).toMatchObject({ instructions: 'With lunch.', selfReported: true });

    const created = await server.http
      .post('/api/prescriptions')
      .set(maya.auth)
      .send({ patientId: DEMO_IDS.patient, drugName: 'Fish oil', strength: '1,000 mg', times: ['12:00'] })
      .expect(201);
    expect(created.body.prescription).toMatchObject({ selfReported: true, doctorId: null, status: 'active' });
  });
});

describe('doctors only see assigned patients', () => {
  it('lists only assigned patients', async () => {
    const mine = await server.http.get('/api/patients').set(reyes.auth).expect(200);
    const ids = (mine.body.patients as Array<{ patient: { id: string } }>).map((s) => s.patient.id);
    expect(ids).toEqual(expect.arrayContaining([DEMO_IDS.patient, DEMO_IDS.patient2]));

    const none = await server.http.get('/api/patients').set(otherDoctor.auth).expect(200);
    expect(none.body.patients).toEqual([]);
  });

  it('gets 403 for an unassigned patient and 404 for an unknown one', async () => {
    await server.http.get(`/api/patients/${DEMO_IDS.patient}`).set(otherDoctor.auth).expect(403);
    await server.http.get('/api/prescriptions').query({ patientId: DEMO_IDS.patient }).set(otherDoctor.auth).expect(403);
    await server.http.get('/api/doses').query({ patientId: DEMO_IDS.patient }).set(otherDoctor.auth).expect(403);
    await server.http
      .post('/api/prescriptions')
      .set(otherDoctor.auth)
      .send({ patientId: DEMO_IDS.patient, drugName: 'Aspirin', strength: '81 mg', times: ['08:00'] })
      .expect(403);
    await server.http
      .post('/api/notes')
      .set(otherDoctor.auth)
      .send({ patientId: DEMO_IDS.patient, title: 'Hi', body: 'x' })
      .expect(403);
    await server.http
      .patch(`/api/prescriptions/${rxNamed('Lisinopril').id}`)
      .set(otherDoctor.auth)
      .send({ dose: '2 tablets' })
      .expect(403);
    await server.http.get('/api/patients/usr_nobody').set(reyes.auth).expect(404);
  });

  it('cannot log doses for a patient', async () => {
    await server.http
      .post('/api/doses')
      .set(reyes.auth)
      .send({ prescriptionId: rxNamed('Lisinopril').id, date: '2026-01-01', slot: '08:00' })
      .expect(403);
  });

  it('can read an assigned patient in full', async () => {
    const res = await server.http.get(`/api/patients/${DEMO_IDS.patient}`).set(reyes.auth).expect(200);
    expect(res.body.patient.id).toBe(DEMO_IDS.patient);
    expect(res.body.prescriptions.length).toBeGreaterThanOrEqual(4);
    expect(res.body.notes.length).toBeGreaterThanOrEqual(2);
    expect(res.body.doseLogs.length).toBeGreaterThan(0);
  });
});

describe('threads are private to their participants', () => {
  it('gives each side the right thread', async () => {
    const patientView = await server.http.get('/api/threads').set(maya.auth).expect(200);
    const [thread] = patientView.body.threads as Thread[];
    expect(patientView.body.threads).toHaveLength(1);
    expect(thread).toMatchObject({
      id: `${DEMO_IDS.patient}__${DEMO_IDS.doctor}`,
      counterpart: { id: DEMO_IDS.doctor },
      unreadCount: 1,
    });

    const doctorView = await server.http.get('/api/threads').set(reyes.auth).expect(200);
    const threads = doctorView.body.threads as Thread[];
    expect(threads.map((t) => t.patientId)).toEqual(expect.arrayContaining([DEMO_IDS.patient, DEMO_IDS.patient2]));
    const times = threads.map((t) => t.lastMessage?.createdAt ?? '');
    expect([...times].sort().reverse()).toEqual(times);

    const none = await server.http.get('/api/threads').set(otherDoctor.auth).expect(200);
    expect(none.body.threads).toEqual([]);
  });

  it('blocks outsiders and rejects malformed ids', async () => {
    const mayaThread = `${DEMO_IDS.patient}__${DEMO_IDS.doctor}`;
    await server.http.get(`/api/threads/${mayaThread}/messages`).set(jordan.auth).expect(403);
    await server.http.get(`/api/threads/${mayaThread}/messages`).set(otherDoctor.auth).expect(403);
    await server.http.post(`/api/threads/${mayaThread}/messages`).set(jordan.auth).send({ body: 'hi' }).expect(403);
    await server.http.post(`/api/threads/${mayaThread}/read`).set(otherDoctor.auth).expect(403);
    // A thread with a doctor the patient isn't assigned to doesn't grant access either.
    await server.http
      .get(`/api/threads/${DEMO_IDS.patient}__${otherDoctor.user.id}/messages`)
      .set(maya.auth)
      .expect(403);
    await server.http.get('/api/threads/garbage/messages').set(maya.auth).expect(404);
  });

  it('pages messages in ascending order', async () => {
    const mayaThread = `${DEMO_IDS.patient}__${DEMO_IDS.doctor}`;
    const all = await server.http.get(`/api/threads/${mayaThread}/messages`).set(maya.auth).expect(200);
    const messages = all.body.messages as Array<{ createdAt: string }>;
    expect(messages.length).toBeGreaterThanOrEqual(4);
    expect([...messages].sort((a, b) => a.createdAt.localeCompare(b.createdAt))).toEqual(messages);

    const last = messages.at(-1)!;
    const page = await server.http
      .get(`/api/threads/${mayaThread}/messages`)
      .query({ limit: 2, before: last.createdAt })
      .set(maya.auth)
      .expect(200);
    expect(page.body.messages).toEqual(messages.slice(-3, -1));
    await server.http.get(`/api/threads/${mayaThread}/messages`).query({ limit: 0 }).set(maya.auth).expect(400);
  });
});
