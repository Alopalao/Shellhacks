// POST /api/admin/reset — wipe and re-seed the demo data (demo convenience).
import { Router } from 'express';
import type { ServerContext } from '../context';
import { isRealtimeServer } from '../realtime';

export function createAdminRouter(ctx: ServerContext): Router {
  const router = Router();
  router.post('/reset', (_req, res) => {
    ctx.db.reset();
    // Accounts created during the demo are gone; drop their live sockets too.
    if (isRealtimeServer(ctx.realtime)) ctx.realtime.disconnectInvalidSessions();
    res.json({ ok: true });
  });
  return router;
}
