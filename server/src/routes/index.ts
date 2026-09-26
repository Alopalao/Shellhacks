// Mounts every core REST router under /api. Each router is mounted at its own prefix with
// requireAuth, so public endpoints (health, login, the AI router's /ai/status) and the JSON
// 404 for unknown /api paths are unaffected by auth.
import type { Express } from 'express';
import { createAuthRouter } from '../auth/router';
import type { ServerContext } from '../context';
import { createAdminRouter } from './admin';
import { createDashboardRouter } from './dashboard';
import { createDoctorsRouter } from './doctors';
import { createDosesRouter } from './doses';
import { createHealthRouter } from './health';
import { createMeRouter } from './me';
import { createNotesRouter } from './notes';
import { createPatientsRouter } from './patients';
import { createPrescriptionsRouter } from './prescriptions';
import { createRefillsRouter } from './refills';
import { createThreadsRouter } from './threads';

export function mountCoreRoutes(app: Express, ctx: ServerContext): void {
  const auth = ctx.requireAuth;
  app.use('/api/health', createHealthRouter(ctx));
  app.use('/api/auth', createAuthRouter(ctx));
  app.use('/api/me', auth, createMeRouter(ctx));
  app.use('/api/doctors', auth, createDoctorsRouter(ctx));
  app.use('/api/dashboard', auth, createDashboardRouter(ctx));
  app.use('/api/threads', auth, createThreadsRouter(ctx));
  app.use('/api/prescriptions', auth, createPrescriptionsRouter(ctx));
  app.use('/api/doses', auth, createDosesRouter(ctx));
  app.use('/api/refills', auth, createRefillsRouter(ctx));
  app.use('/api/notes', auth, createNotesRouter(ctx));
  app.use('/api/patients', auth, createPatientsRouter(ctx));
  app.use('/api/admin', auth, createAdminRouter(ctx));
}
