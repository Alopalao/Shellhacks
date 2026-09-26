import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { newId } from '../src/db/ids';
import { createSeedData, DEMO_IDS } from '../src/db/seed';
import { JsonDb } from '../src/db/store';
import { computeAdherence } from '../src/routes/adherence';
import { addDays, toDateKey, toTimeKey } from '../src/db/dates';
import { login, startTestServer } from './helpers';

let dir: string;
let file: string;
const quiet = { warn: () => undefined, error: () => undefined };

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'brian-db-'));
  file = path.join(dir, 'nested', 'db.json');
});

afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

const readFile = (): { users: Array<{ id: string; name: string }>; sessions: unknown[] } =>
  JSON.parse(fs.readFileSync(file, 'utf8'));

describe('JsonDb', () => {
  it('creates folders and seeds a missing file immediately', async () => {
    const db = new JsonDb(file, { logger: quiet });
    expect(db.seeded).toBe(true);
    expect(fs.existsSync(file)).toBe(true);
    expect(readFile().users.map((u) => u.id)).toEqual([DEMO_IDS.doctor, DEMO_IDS.patient, DEMO_IDS.patient2]);
    await db.close();
  });

  it('backs up and re-seeds a corrupt file', async () => {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, '{"version": 1, "users": [');
    const db = new JsonDb(file, { logger: quiet });
    expect(db.seeded).toBe(true);
    expect(db.data.users).toHaveLength(3);
    const backups = fs.readdirSync(path.dirname(file)).filter((f) => f.includes('.corrupt-'));
    expect(backups).toHaveLength(1);
    await db.close();
  });

  it('re-seeds files with the wrong shape but fills in missing collections', async () => {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify({ version: 2, users: [] }));
    const wrong = new JsonDb(file, { logger: quiet });
    expect(wrong.seeded).toBe(true);
    await wrong.close();

    fs.writeFileSync(file, JSON.stringify({ version: 1, users: [] }));
    const partial = new JsonDb(file, { logger: quiet });
    expect(partial.seeded).toBe(false);
    expect(partial.data.aiConversations).toEqual([]);
    await partial.close();
  });

  it('debounces saves and writes atomically', async () => {
    const db = new JsonDb(file, { debounceMs: 20, logger: quiet });
    db.data.users[0]!.name = 'Changed once';
    db.save();
    db.data.users[0]!.name = 'Changed twice';
    db.save();
    expect(readFile().users[0]!.name).not.toBe('Changed twice'); // not yet written
    await db.flush();
    expect(readFile().users[0]!.name).toBe('Changed twice');
    expect(fs.readdirSync(path.dirname(file)).filter((f) => f.endsWith('.tmp'))).toEqual([]);

    db.data.users[0]!.name = 'On close';
    db.save();
    await db.close();
    expect(readFile().users[0]!.name).toBe('On close');

    const reopened = new JsonDb(file, { logger: quiet });
    expect(reopened.seeded).toBe(false);
    expect(reopened.data.users[0]!.name).toBe('On close');
    await reopened.close();
  });

  it('reset() re-seeds in place and keeps only demo-account sessions', async () => {
    const db = new JsonDb(file, { logger: quiet });
    const dataRef = db.data;
    db.data.users.push({ ...db.data.users[1]!, id: 'usr_temp', email: 'temp@example.test' });
    db.data.sessions.push(
      { token: 'keep', userId: DEMO_IDS.patient, createdAt: '' },
      { token: 'drop', userId: 'usr_temp', createdAt: '' },
    );
    db.data.messages.length = 0;
    db.reset();
    expect(db.data).toBe(dataRef);
    expect(db.data.users.map((u) => u.id)).not.toContain('usr_temp');
    expect(db.data.sessions.map((s) => s.token)).toEqual(['keep']);
    expect(db.data.messages.length).toBeGreaterThan(0);
    await db.close();
  });
});

describe('seed data', () => {
  it('is rich, internally consistent, and relative to now', () => {
    const now = new Date();
    const data = createSeedData(now);
    const ids = new Set(data.prescriptions.map((p) => p.id));
    expect(data.doseLogs.every((d) => ids.has(d.prescriptionId))).toBe(true);
    expect(data.doseLogs.every((d) => Date.parse(d.takenAt) <= now.getTime())).toBe(true);
    expect(data.messages.every((m) => Date.parse(m.createdAt) <= now.getTime())).toBe(true);
    expect(data.messages.length).toBeGreaterThanOrEqual(4);
    expect(data.visitNotes.some((n) => n.body.includes('atorvastatin 20 mg PO qhs'))).toBe(true);

    const maya = data.prescriptions.filter((p) => p.patientId === DEMO_IDS.patient);
    expect(maya.find((p) => p.drugName === 'Metformin')?.refillsRemaining).toBe(0);
    expect(maya.find((p) => p.drugName === 'Vitamin D3')).toMatchObject({ selfReported: true, doctorId: null });

    // Roughly 85% adherence over the past week for the demo patient.
    const { rate } = computeAdherence(
      maya,
      data.doseLogs.filter((d) => d.patientId === DEMO_IDS.patient),
      { today: addDays(toDateKey(now), -1), nowTime: toTimeKey(now), days: 13 },
    );
    expect(rate).toBeGreaterThan(0.7);
    expect(rate).toBeLessThan(0.98);
  });

  it('generates short prefixed ids', () => {
    expect(newId('rx')).toMatch(/^rx_[0-9a-z]{12}$/);
    expect(new Set(Array.from({ length: 500 }, () => newId('msg'))).size).toBe(500);
  });
});

describe('POST /api/admin/reset', () => {
  it('re-seeds while keeping demo sessions alive', async () => {
    const server = await startTestServer();
    try {
      const maya = await login(server, 'patient@brian.demo');
      const temp = await login(server, 'temporary@example.test');
      await server.http.patch('/api/me').set(maya.auth).send({ name: 'Renamed' }).expect(200);
      await server.http.post('/api/admin/reset').set(maya.auth).expect(200, { ok: true });
      const me = await server.http.get('/api/me').set(maya.auth).expect(200);
      expect(me.body.user.name).toBe('Maya Johnson');
      await server.http.get('/api/me').set(temp.auth).expect(401);
      await server.http.post('/api/admin/reset').expect(401);
    } finally {
      await server.stop();
    }
  });
});
