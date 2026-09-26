import express, { type RequestHandler } from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createAiRouter } from '../src/ai/router';
import type { ServerContext } from '../src/context';
import type { AiChatResponse, AiConversation, DrugInfo } from '../src/shared/contracts';
import { makeDb, stubEvidence, testConfig } from './ai-fixtures';

/** Minimal app: bearer token = user id (the real app uses sessions from server-core). */
function makeApp(evidence = stubEvidence({ offline: true })) {
  const db = makeDb();
  const requireAuth: RequestHandler = (req, res, next) => {
    const token = req.header('authorization')?.replace(/^Bearer\s+/i, '');
    const user = db.data.users.find((u) => u.id === token);
    if (!user) {
      res.status(401).json({ error: 'Please sign in.' });
      return;
    }
    res.locals.user = user;
    next();
  };
  const ctx: ServerContext = {
    config: testConfig,
    db,
    requireAuth,
    realtime: { emitToUser: () => undefined, isOnline: () => false },
  };
  const app = express();
  app.use(express.json());
  app.use('/api', createAiRouter(ctx, { evidence, claude: null, logger: { warn: () => undefined } }));
  return { app, db };
}

const auth = (id: string) => ({ Authorization: `Bearer ${id}` });

describe('AI router', () => {
  it('serves status without auth', async () => {
    const { app } = makeApp();
    const res = await request(app).get('/api/ai/status');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ provider: 'mock', model: null });
  });

  it('requires auth for chat, conversations, drugs and evidence', async () => {
    const { app } = makeApp();
    for (const [method, path] of [
      ['post', '/api/ai/chat'],
      ['get', '/api/ai/conversations'],
      ['get', '/api/ai/conversations/x'],
      ['delete', '/api/ai/conversations/x'],
      ['get', '/api/drugs/info?name=lisinopril'],
      ['get', '/api/evidence/search?q=stroke'],
    ] as const) {
      const res = await request(app)[method](path);
      expect(res.status, `${method} ${path}`).toBe(401);
    }
  });

  it('validates chat requests', async () => {
    const { app } = makeApp();
    const empty = await request(app).post('/api/ai/chat').set(auth('maya')).send({ message: '   ' });
    expect(empty.status).toBe(400);
    expect(empty.body.error).toMatch(/type a message/i);
    const long = await request(app).post('/api/ai/chat').set(auth('maya')).send({ message: 'x'.repeat(4001) });
    expect(long.status).toBe(400);
    expect(long.body.error).toMatch(/4,000/);
    const badMode = await request(app).post('/api/ai/chat').set(auth('maya')).send({ message: 'hi', mode: 'surgery' });
    expect(badMode.status).toBe(400);
    expect(badMode.body.details).toBeDefined();
  });

  it('chats, lists and deletes conversations for their owner only', async () => {
    const { app, db } = makeApp();
    const chat = await request(app).post('/api/ai/chat').set(auth('maya')).send({ message: 'What does BID mean?' });
    expect(chat.status).toBe(200);
    const body = chat.body as AiChatResponse;
    expect(body.reply).toMatchObject({ role: 'assistant', mocked: true, mode: 'general' });
    expect(body.conversation.userId).toBe('maya');
    const id = body.conversation.id;

    const mine = await request(app).get('/api/ai/conversations').set(auth('maya'));
    expect((mine.body.conversations as AiConversation[]).map((c) => c.id)).toEqual([id]);
    const theirs = await request(app).get('/api/ai/conversations').set(auth('doc'));
    expect(theirs.body.conversations).toEqual([]);

    expect((await request(app).get(`/api/ai/conversations/${id}`).set(auth('maya'))).status).toBe(200);
    expect((await request(app).get(`/api/ai/conversations/${id}`).set(auth('doc'))).status).toBe(403);
    expect((await request(app).get('/api/ai/conversations/missing').set(auth('maya'))).status).toBe(404);
    expect((await request(app).post('/api/ai/chat').set(auth('doc')).send({ message: 'hi', conversationId: id })).status).toBe(403);

    expect((await request(app).delete(`/api/ai/conversations/${id}`).set(auth('doc'))).status).toBe(403);
    const del = await request(app).delete(`/api/ai/conversations/${id}`).set(auth('maya'));
    expect(del.body).toEqual({ ok: true });
    expect(db.data.aiConversations).toHaveLength(0);
  });

  it('checks access to referenced notes and prescriptions', async () => {
    const { app } = makeApp();
    const note = await request(app).post('/api/ai/chat').set(auth('maya')).send({ message: 'Explain', context: { noteId: 'note_jordan' } });
    expect(note.status).toBe(403);
    const rx = await request(app).post('/api/ai/chat').set(auth('otherdoc')).send({ message: 'Explain', context: { prescriptionId: 'rx_lis' } });
    expect(rx.status).toBe(403);
    const missing = await request(app).post('/api/ai/chat').set(auth('maya')).send({ message: 'Explain', context: { noteId: 'nope' } });
    expect(missing.status).toBe(404);
    const own = await request(app).post('/api/ai/chat').set(auth('maya')).send({ message: 'Explain', context: { noteId: 'note_maya' } });
    expect(own.status).toBe(200);
    expect((own.body as AiChatResponse).reply.mode).toBe('explain-note');
  });

  it('accepts note text as long as a visit note body (the app sends it with noteId)', async () => {
    const { app } = makeApp();
    const noteText = 'Pt counseled re: diet. '.repeat(600).slice(0, 12_000); // POST /api/notes allows 20,000
    const ok = await request(app).post('/api/ai/chat').set(auth('maya')).send({ message: 'Explain', context: { noteId: 'note_maya', noteText } });
    expect(ok.status).toBe(200);
    const tooLong = await request(app).post('/api/ai/chat').set(auth('maya')).send({ message: 'Explain', context: { noteText: 'x'.repeat(20_001) } });
    expect(tooLong.status).toBe(400);
  });

  it('returns drug info and evidence search results', async () => {
    const { app } = makeApp(stubEvidence());
    expect((await request(app).get('/api/drugs/info').set(auth('maya'))).status).toBe(400);
    const info = await request(app).get('/api/drugs/info?name=lisinopril').set(auth('maya'));
    expect(info.status).toBe(200);
    expect((info.body as DrugInfo).sections.length).toBeGreaterThan(0);
    const search = await request(app).get('/api/evidence/search?q=stroke').set(auth('doc'));
    expect(search.status).toBe(200);
    expect(search.body.citations[0]).toMatchObject({ id: '1', source: 'MedlinePlus' });
    expect((await request(app).get('/api/evidence/search?q=a').set(auth('doc'))).status).toBe(400);
  });
});
