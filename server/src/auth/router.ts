// POST /api/auth/login — "lgtm" demo login (any email + any non-empty password).
// POST /api/auth/logout — revoke the current session.
import { Router } from 'express';
import type { ServerContext } from '../context';
import { newId } from '../db/ids';
import { findUserByEmail, firstDoctor } from '../db/queries';
import { isRealtimeServer } from '../realtime';
import { emitTo, hrefs, notify } from '../routes/events';
import { loginSchema } from '../routes/schemas';
import type { LoginResponse, Role, User } from '../shared/contracts';
import { sessionToken } from './middleware';
import { createSession, revokeSession } from './sessions';

/** "maya.j_ohnson+test@x.com" → "Maya J Ohnson". */
export function nameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? '';
  const words = local
    .split('+')[0]!
    .split(/[._\-\s]+/)
    .map((w) => w.replace(/\d+/g, ''))
    .filter(Boolean);
  if (words.length === 0) return 'BRIAN User';
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

function buildUser(ctx: ServerContext, email: string, role: Role, name: string | undefined): User {
  const base = {
    id: newId('usr'),
    email,
    name: name || nameFromEmail(email),
    role,
    avatar: null,
    createdAt: new Date().toISOString(),
  } satisfies Partial<User>;
  if (role === 'doctor') {
    return { ...base, doctor: { specialty: 'General Practice', credentials: 'MD' } };
  }
  return {
    ...base,
    patient: { allergies: [], conditions: [] },
    doctorId: firstDoctor(ctx.db.data)?.id ?? null,
  };
}

export function createAuthRouter(ctx: ServerContext): Router {
  const router = Router();

  router.post('/login', (req, res) => {
    const input = loginSchema.parse(req.body);
    let user = findUserByEmail(ctx.db.data, input.email);
    const isNewUser = !user;

    if (!user) {
      user = buildUser(ctx, input.email, input.role ?? 'patient', input.name);
      ctx.db.data.users.push(user);
      // Let the demo doctor's patient list pick up the newcomer live.
      if (user.role === 'patient' && user.doctorId) {
        emitTo(ctx, [user.doctorId], 'user:updated', user);
        notify(ctx, user.doctorId, {
          kind: 'system',
          title: 'New patient',
          body: `${user.name} just joined BRIAN and was added to your patient list.`,
          href: hrefs.doctor.patient(user.id),
        });
      }
    }

    const realtime = isRealtimeServer(ctx.realtime) ? ctx.realtime : undefined;
    const { session, evicted } = createSession(ctx.db, user.id, { isLive: realtime?.hasLiveSocket });
    // A device signed out by the per-user session cap must stop receiving this user's events.
    if (evicted.length > 0) realtime?.disconnectInvalidSessions();
    const body: LoginResponse = { status: 'lgtm', token: session.token, user, isNewUser };
    res.json(body);
  });

  router.post('/logout', ctx.requireAuth, (_req, res) => {
    const token = sessionToken(res);
    if (token) revokeSession(ctx.db, token);
    if (isRealtimeServer(ctx.realtime)) ctx.realtime.disconnectInvalidSessions();
    res.json({ ok: true });
  });

  return router;
}
