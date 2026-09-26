// GET /api/doctors — physicians a patient can choose from.
import { Router } from 'express';
import type { ServerContext } from '../context';
import { listDoctors } from '../db/queries';
import type { User } from '../shared/contracts';

export function createDoctorsRouter(ctx: ServerContext): Router {
  const router = Router();
  router.get('/', (_req, res) => {
    const doctors: User[] = listDoctors(ctx.db.data);
    res.json({ doctors });
  });
  return router;
}
