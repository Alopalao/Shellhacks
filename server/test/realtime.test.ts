import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { DEMO_ACCOUNTS, DEMO_IDS } from '../src/db/seed';
import type { ChatMessage, Presence, Prescription } from '../src/shared/contracts';
import {
  connectSocket,
  login,
  roundTrip,
  sleep,
  startTestServer,
  uniqueEmail,
  type RecordingClient,
  type Session,
  type TestServer,
} from './helpers';

let server: TestServer;
let maya: Session;
let reyes: Session;
const open: RecordingClient[] = [];

const connect = async (session: Session): Promise<RecordingClient> => {
  const client = await connectSocket(server, session.token);
  open.push(client);
  return client;
};

beforeAll(async () => {
  server = await startTestServer();
  maya = await login(server, DEMO_ACCOUNTS.patient);
  reyes = await login(server, DEMO_ACCOUNTS.doctor);
});

afterEach(async () => {
  for (const client of open.splice(0)) client.close();
  await sleep(30);
});

afterAll(async () => {
  await server.stop();
});

describe('socket auth', () => {
  it("rejects a bad token with 'unauthorized'", async () => {
    await expect(connectSocket(server, 'nope')).rejects.toThrow('unauthorized');
  });

  it('disconnects a socket when its session is logged out', async () => {
    const session = await login(server, DEMO_ACCOUNTS.patient);
    const client = await connect(session);
    const disconnected = new Promise<string>((resolve) => client.socket.once('disconnect', resolve));
    await server.http.post('/api/auth/logout').set(session.auth).expect(200);
    await expect(disconnected).resolves.toBe('io server disconnect');
  });
});

describe('prescriptions', () => {
  it('doctor prescribes → patient gets prescription:upsert and a notify deep link', async () => {
    const patientSocket = await connect(maya);
    const doctorSocket = await connect(reyes);

    const res = await server.http
      .post('/api/prescriptions')
      .set(reyes.auth)
      .send({
        patientId: DEMO_IDS.patient,
        drugName: 'Amlodipine',
        strength: '5 mg',
        form: 'tablet',
        dose: '1 tablet',
        route: 'by mouth',
        frequency: 'once daily',
        times: ['08:00'],
        instructions: 'Take in the morning.',
        refillsRemaining: 3,
      })
      .expect(201);
    const rx = res.body.prescription as Prescription;
    expect(rx).toMatchObject({ doctorId: DEMO_IDS.doctor, selfReported: false, status: 'active', refillsRemaining: 3 });

    await expect(patientSocket.next('prescription:upsert', (p) => p.id === rx.id)).resolves.toEqual(rx);
    await expect(doctorSocket.next('prescription:upsert', (p) => p.id === rx.id)).resolves.toEqual(rx);
    const note = await patientSocket.next('notify', (n) => n.kind === 'prescription');
    expect(note).toMatchObject({ href: `/patient/meds/${rx.id}`, title: 'New prescription' });
    expect(note.body).toContain('Dr. Reyes prescribed Amlodipine 5 mg');
    expect(doctorSocket.received('notify')).toEqual([]);

    // Pausing is announced in plain words, and DELETE discontinues.
    patientSocket.clear();
    await server.http.patch(`/api/prescriptions/${rx.id}`).set(reyes.auth).send({ status: 'paused' }).expect(200);
    const paused = await patientSocket.next('notify');
    expect(paused).toMatchObject({ title: 'Medication paused', href: `/patient/meds/${rx.id}` });

    const del = await server.http.delete(`/api/prescriptions/${rx.id}`).set(reyes.auth).expect(200);
    expect(del.body.prescription).toMatchObject({ status: 'discontinued' });
    await patientSocket.next('prescription:upsert', (p) => p.id === rx.id && p.status === 'discontinued');
  });

  it('patient self-reports → doctor is notified with a patient link', async () => {
    const doctorSocket = await connect(reyes);
    await server.http
      .post('/api/prescriptions')
      .set(maya.auth)
      .send({ patientId: DEMO_IDS.patient, drugName: 'Magnesium', strength: '250 mg' })
      .expect(201);
    const note = await doctorSocket.next('notify', (n) => n.kind === 'prescription');
    expect(note.href).toBe(`/doctor/patients/${DEMO_IDS.patient}`);
    expect(note.body).toContain('Maya Johnson added Magnesium 250 mg');
  });
});

describe('messaging', () => {
  it('delivers message:new to both sides, notifies the recipient, and syncs read receipts', async () => {
    const patientSocket = await connect(maya);
    const doctorSocket = await connect(reyes);
    const threadId = `${DEMO_IDS.patient}__${DEMO_IDS.doctor}`;

    const sent = await server.http
      .post(`/api/threads/${threadId}/messages`)
      .set(maya.auth)
      .send({ body: '  Quick question about my blood pressure readings.  ' })
      .expect(201);
    const message = sent.body.message as ChatMessage;
    expect(message).toMatchObject({
      threadId,
      senderId: DEMO_IDS.patient,
      body: 'Quick question about my blood pressure readings.',
      readAt: null,
      attachment: null,
    });

    await expect(doctorSocket.next('message:new', (m) => m.id === message.id)).resolves.toEqual(message);
    await expect(patientSocket.next('message:new', (m) => m.id === message.id)).resolves.toEqual(message);
    const note = await doctorSocket.next('notify', (n) => n.kind === 'message');
    expect(note).toMatchObject({ title: 'Maya Johnson', href: `/doctor/messages/${threadId}` });
    expect(patientSocket.received('notify', (n) => n.kind === 'message')).toEqual([]);

    const threads = await server.http.get('/api/threads').set(reyes.auth).expect(200);
    const thread = (threads.body.threads as Array<{ id: string; unreadCount: number; lastMessage: ChatMessage }>).find(
      (t) => t.id === threadId,
    );
    expect(thread?.unreadCount).toBeGreaterThanOrEqual(1);
    expect(thread?.lastMessage.id).toBe(message.id);

    // Doctor opens the chat → both sides learn the messages were read.
    await server.http.post(`/api/threads/${threadId}/read`).set(reyes.auth).expect(200, { ok: true });
    const receipt = await patientSocket.next('message:read');
    expect(receipt).toMatchObject({ threadId, readerId: DEMO_IDS.doctor, readAt: expect.any(String) });
    await doctorSocket.next('message:read');
    const after = await server.http.get(`/api/threads/${threadId}/messages`).set(maya.auth).expect(200);
    const stored = (after.body.messages as ChatMessage[]).find((m) => m.id === message.id);
    expect(stored?.readAt).toBe(receipt.readAt);

    // Doctor replies with an attachment → patient's toast opens the chat.
    const notes = await server.http.get('/api/notes').query({ patientId: DEMO_IDS.patient }).set(reyes.auth).expect(200);
    const reply = await server.http
      .post(`/api/threads/${threadId}/messages`)
      .set(reyes.auth)
      .send({ body: 'Happy to help — see my note.', attachment: { type: 'visit-note', noteId: notes.body.notes[0].id } })
      .expect(201);
    expect(reply.body.message.attachment).toEqual({ type: 'visit-note', noteId: notes.body.notes[0].id });
    const toast = await patientSocket.next('notify', (n) => n.kind === 'message');
    expect(toast).toMatchObject({ title: 'Dr. Daniel Reyes', href: '/patient/care/chat' });

    // Attachments must belong to the thread's patient.
    await server.http
      .post(`/api/threads/${threadId}/messages`)
      .set(reyes.auth)
      .send({ body: 'x', attachment: { type: 'visit-note', noteId: 'note_missing' } })
      .expect(400);
    await server.http.post(`/api/threads/${threadId}/messages`).set(maya.auth).send({ body: '   ' }).expect(400);
  });

  it('relays typing to the other participant only', async () => {
    const patientSocket = await connect(maya);
    const doctorSocket = await connect(reyes);
    const jordan = await connect(await login(server, DEMO_ACCOUNTS.patient2));
    const threadId = `${DEMO_IDS.patient}__${DEMO_IDS.doctor}`;

    patientSocket.socket.emit('typing', { threadId, isTyping: true });
    await expect(doctorSocket.next('typing')).resolves.toEqual({ threadId, userId: DEMO_IDS.patient, isTyping: true });

    // Outsiders and malformed payloads are ignored.
    jordan.socket.emit('typing', { threadId, isTyping: true });
    (jordan.socket.emit as (event: string, payload: unknown) => void)('typing', { threadId: 42 });
    await roundTrip(jordan);
    await sleep(50);
    expect(doctorSocket.received('typing')).toHaveLength(1);
    expect(patientSocket.received('typing')).toEqual([]);
  });
});

describe('presence', () => {
  it('announces online/offline to counterparts and answers presence:query', async () => {
    const doctorSocket = await connect(reyes);
    const newcomer = await login(server, uniqueEmail('presence'));
    expect(newcomer.user.doctorId).toBe(DEMO_IDS.doctor);

    const patientSocket = await connect(newcomer);
    const online = await doctorSocket.next('presence', (p) => p.userId === newcomer.user.id);
    expect(online).toMatchObject({ userId: newcomer.user.id, online: true });

    // A second device doesn't re-announce; closing one of two keeps the user online.
    const second = await connect(newcomer);
    second.close();
    await sleep(80);
    expect(doctorSocket.received('presence', (p) => p.userId === newcomer.user.id)).toHaveLength(1);

    const answer = await new Promise<Presence[]>((resolve) => {
      patientSocket.socket.emit('presence:query', [DEMO_IDS.doctor, newcomer.user.id, DEMO_IDS.patient2], resolve);
    });
    expect(answer).toEqual([
      expect.objectContaining({ userId: DEMO_IDS.doctor, online: true }),
      expect.objectContaining({ userId: newcomer.user.id, online: true }),
    ]);

    const dashboard = await server.http.get('/api/dashboard').set(newcomer.auth).expect(200);
    expect(dashboard.body.doctorOnline).toBe(true);

    patientSocket.close();
    const offline = await doctorSocket.next('presence', (p) => p.userId === newcomer.user.id && !p.online);
    expect(offline.lastSeen).toEqual(expect.any(String));
    const summary = await server.http.get('/api/patients').set(reyes.auth).expect(200);
    const row = (summary.body.patients as Array<{ patient: { id: string }; online: boolean }>).find(
      (s) => s.patient.id === newcomer.user.id,
    );
    expect(row?.online).toBe(false);
  });

  it('tells a doctor when a new patient joins', async () => {
    const doctorSocket = await connect(reyes);
    const joined = await login(server, uniqueEmail('joiner'));
    const note = await doctorSocket.next('notify', (n) => n.href === `/doctor/patients/${joined.user.id}`);
    expect(note).toMatchObject({ kind: 'system', title: 'New patient' });
    await doctorSocket.next('user:updated', (u) => u.id === joined.user.id);
  });
});

describe('visit notes', () => {
  it('notifies the patient with a link to the note', async () => {
    const patientSocket = await connect(maya);
    const res = await server.http
      .post('/api/notes')
      .set(reyes.auth)
      .send({ patientId: DEMO_IDS.patient, title: 'Phone check-in', body: 'BP log reviewed. Cont current regimen.' })
      .expect(201);
    const note = res.body.note as { id: string };
    await patientSocket.next('note:new', (n) => n.id === note.id);
    const toast = await patientSocket.next('notify', (n) => n.kind === 'note');
    expect(toast.href).toBe(`/patient/care/notes/${note.id}`);
  });
});
