import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DEMO_ACCOUNTS, DEMO_IDS } from '../src/db/seed';
import type { HealthResponse, LoginResponse, User } from '../src/shared/contracts';
import { login, startTestServer, uniqueEmail, type TestServer } from './helpers';

let server: TestServer;

beforeAll(async () => {
  server = await startTestServer();
});

afterAll(async () => {
  await server.stop();
});

describe('POST /api/auth/login (lgtm)', () => {
  it('signs in a seeded account with any password, normalising the email', async () => {
    const res = await server.http
      .post('/api/auth/login')
      .send({ email: '  Patient@BRIAN.demo ', password: 'literally anything', role: 'doctor' })
      .expect(200);
    const body = res.body as LoginResponse;
    expect(body.status).toBe('lgtm');
    expect(body.isNewUser).toBe(false);
    expect(body.token).toMatch(/^[\w-]{40,}$/);
    // Role is ignored for existing accounts.
    expect(body.user).toMatchObject({ id: DEMO_IDS.patient, email: DEMO_ACCOUNTS.patient, role: 'patient' });
  });

  it('creates new patients assigned to the demo doctor, with a name from the email', async () => {
    const res = await server.http
      .post('/api/auth/login')
      .send({ email: 'Sam.Rivera42@Example.com', password: 'pw' })
      .expect(200);
    const body = res.body as LoginResponse;
    expect(body.isNewUser).toBe(true);
    expect(body.user).toMatchObject({
      email: 'sam.rivera42@example.com',
      name: 'Sam Rivera',
      role: 'patient',
      avatar: null,
      doctorId: DEMO_IDS.doctor,
      patient: { allergies: [], conditions: [] },
    });
    expect(body.user.id).toMatch(/^usr_[a-z0-9]+$/);

    // Signing in again finds the same account.
    const again = await login(server, 'sam.rivera42@example.com');
    expect(again.user.id).toBe(body.user.id);
  });

  it('creates new doctors with a default doctor profile', async () => {
    const res = await server.http
      .post('/api/auth/login')
      .send({ email: uniqueEmail('doc'), password: 'pw', role: 'doctor', name: 'Dr. Alex Kim' })
      .expect(200);
    const user = (res.body as LoginResponse).user;
    expect(user).toMatchObject({
      role: 'doctor',
      name: 'Dr. Alex Kim',
      avatar: null,
      doctor: { specialty: 'General Practice', credentials: 'MD' },
    });
    expect(user.patient).toBeUndefined();
  });

  it.each([
    [{ email: '', password: 'x' }, 'email'],
    [{ email: '   ', password: 'x' }, 'email'],
    [{ email: 'a@b.c', password: '' }, 'password'],
    [{ email: 'a@b.c', password: '   ' }, 'password'],
    [{ email: 'a@b.c' }, 'password'],
    [{}, 'email'],
  ])('rejects %j with 400', async (payload, field) => {
    const res = await server.http.post('/api/auth/login').send(payload).expect(400);
    expect(res.body.error).toEqual(expect.any(String));
    expect(res.body.details).toEqual(expect.arrayContaining([expect.objectContaining({ path: field })]));
  });

  it('rejects malformed JSON with a JSON 400', async () => {
    const res = await server.http
      .post('/api/auth/login')
      .set('content-type', 'application/json')
      .send('{"email":')
      .expect(400);
    expect(res.body).toEqual({ error: expect.any(String) });
  });
});

describe('sessions', () => {
  it('requires a bearer token on protected routes', async () => {
    await server.http.get('/api/me').expect(401);
    await server.http.get('/api/me').set('Authorization', 'Bearer not-a-real-token').expect(401);
    await server.http.get('/api/prescriptions').set('Authorization', 'Basic abc').expect(401);
    const res = await server.http.get('/api/threads').expect(401);
    expect(res.body).toEqual({ error: expect.any(String) });
  });

  it('returns the current user from /api/me', async () => {
    const { auth } = await login(server, DEMO_ACCOUNTS.doctor);
    const res = await server.http.get('/api/me').set(auth).expect(200);
    expect((res.body as { user: User }).user).toMatchObject({ id: DEMO_IDS.doctor, avatar: 'doctor-photo' });
  });

  it('logout revokes only that session', async () => {
    const a = await login(server, DEMO_ACCOUNTS.patient);
    const b = await login(server, DEMO_ACCOUNTS.patient);
    await server.http.post('/api/auth/logout').set(a.auth).expect(200, { ok: true });
    await server.http.get('/api/me').set(a.auth).expect(401);
    await server.http.get('/api/me').set(b.auth).expect(200);
  });
});

describe('profile', () => {
  it('updates the patient profile and trims/dedupes lists', async () => {
    const { auth } = await login(server, uniqueEmail('profile'));
    const res = await server.http
      .patch('/api/me')
      .set(auth)
      .send({
        name: '  Riley Park ',
        patient: { allergies: [' Sulfa ', 'sulfa', ''], conditions: ['Asthma'], dateOfBirth: '1990-02-03', pharmacy: 'CVS' },
      })
      .expect(200);
    expect(res.body.user).toMatchObject({
      name: 'Riley Park',
      patient: { allergies: ['Sulfa'], conditions: ['Asthma'], dateOfBirth: '1990-02-03', pharmacy: 'CVS' },
    });
    await server.http.patch('/api/me').set(auth).send({ doctor: { specialty: 'X' } }).expect(400);
    await server.http.patch('/api/me').set(auth).send({ patient: { dateOfBirth: '1990-02-31' } }).expect(400);
  });

  it('lets a patient choose a doctor from /api/doctors', async () => {
    const patient = await login(server, uniqueEmail('switch'));
    const newDoc = await login(server, uniqueEmail('newdoc'), { role: 'doctor' });
    const doctors = await server.http.get('/api/doctors').set(patient.auth).expect(200);
    expect((doctors.body.doctors as User[]).map((d) => d.id)).toEqual(
      expect.arrayContaining([DEMO_IDS.doctor, newDoc.user.id]),
    );
    const res = await server.http.put('/api/me/doctor').set(patient.auth).send({ doctorId: newDoc.user.id }).expect(200);
    expect(res.body.user.doctorId).toBe(newDoc.user.id);
    await server.http.put('/api/me/doctor').set(patient.auth).send({ doctorId: DEMO_IDS.patient }).expect(404);
    await server.http.put('/api/me/doctor').set(newDoc.auth).send({ doctorId: DEMO_IDS.doctor }).expect(403);
  });
});

describe('misc', () => {
  it('serves /api/health without auth', async () => {
    const res = await server.http.get('/api/health').expect(200);
    const body = res.body as HealthResponse;
    expect(body).toMatchObject({ ok: true, name: 'BRIAN', ai: { provider: 'mock', model: null } });
    expect(body.ai.evidence).toEqual({ pubmed: false, medlineplus: false, openfda: false, rxnorm: false });
  });

  it('answers unknown /api routes with JSON 404', async () => {
    const res = await server.http.get('/api/definitely-not-here').expect(404);
    expect(res.body).toEqual({ error: expect.stringContaining('/api/definitely-not-here') });
  });
});
