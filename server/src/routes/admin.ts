// POST /api/admin/reset — wipe and re-seed the demo data (demo convenience).
import { Router } from 'express';
import { sessionToken } from '../auth/middleware';
import { currentUser, type ServerContext } from '../context';
import { newId } from '../db/ids';
import { isRealtimeServer } from '../realtime';
import { displayName } from './events';

export function createAdminRouter(ctx: ServerContext): Router {
  const router = Router();
  router.post('/reset', (_req, res) => {
    const by = currentUser(res);
    ctx.db.reset();
    // Every id changed, so every open screen is stale: tell the other devices and drop all
    // sockets. Clients reconnect and refetch; accounts created during the demo are gone, so
    // their sockets fail to reconnect and sign out.
    if (isRealtimeServer(ctx.realtime)) {
      ctx.realtime.resyncAll(
        {
          id: newId('ntf'),
          kind: 'system',
          title: 'Demo data was reset',
          body: `${displayName(by)} restored the original demo data.`,
          createdAt: new Date().toISOString(),
        },
        sessionToken(res),
      );
    }
    res.json({ ok: true });
  });
  return router;
}
