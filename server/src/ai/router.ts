// AI doctor + evidence routes. Mounted by app.ts at '/api':
//   GET    /ai/status                 anyone      → AiStatus
//   POST   /ai/chat                   auth        → AiChatResponse
//   GET    /ai/conversations          auth        → { conversations }
//   GET    /ai/conversations/:id      owner       → { conversation }
//   DELETE /ai/conversations/:id      owner       → { ok: true }
//   GET    /drugs/info?name=          auth        → DrugInfo
//   GET    /evidence/search?q=        auth        → EvidenceSearchResponse

import { Router, type NextFunction, type Request, type RequestHandler, type Response } from 'express';
import { z } from 'zod';
import { currentUser, type ServerContext } from '../context';
import type { ApiError } from '../shared/contracts';
import { AiHttpError, AiService, chatRequestSchema, type AiServiceOptions } from './service';

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

/** Express 5 forwards rejections, but we answer AiHttpError / zod errors ourselves for a stable shape. */
function handle(fn: AsyncHandler): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch((error: unknown) => {
      if (res.headersSent) return next(error);
      if (error instanceof AiHttpError) {
        const body: ApiError = { error: error.message, ...(error.details !== undefined ? { details: error.details } : {}) };
        res.status(error.status).json(body);
        return;
      }
      if (error instanceof z.ZodError) {
        const body: ApiError = { error: 'Invalid request.', details: z.flattenError(error) };
        res.status(400).json(body);
        return;
      }
      next(error);
    });
  };
}

function validationError(res: Response, error: z.ZodError): void {
  const first = error.issues[0]?.message;
  const body: ApiError = { error: first && !first.startsWith('Invalid') ? first : 'Invalid request.', details: z.flattenError(error) };
  res.status(400).json(body);
}

const idParam = z.string().trim().min(1).max(100);
const nameQuery = z.object({ name: z.string().trim().min(2, 'Add a drug name, e.g. ?name=lisinopril').max(120) });
const searchQuery = z.object({ q: z.string().trim().min(2, 'Add a search term, e.g. ?q=high blood pressure').max(200) });

export function createAiRouter(ctx: ServerContext, overrides: Partial<Omit<AiServiceOptions, 'config' | 'db'>> = {}): Router {
  const service = new AiService({ config: ctx.config, db: ctx.db, ...overrides });
  const router = Router();

  router.get('/ai/status', (_req, res) => {
    res.json(service.status());
  });

  router.post(
    '/ai/chat',
    ctx.requireAuth,
    handle(async (req, res) => {
      const parsed = chatRequestSchema.safeParse(req.body ?? {});
      if (!parsed.success) return validationError(res, parsed.error);
      const response = await service.chat(currentUser(res), parsed.data);
      res.json(response);
    }),
  );

  router.get(
    '/ai/conversations',
    ctx.requireAuth,
    handle(async (_req, res) => {
      res.json({ conversations: service.listConversations(currentUser(res)) });
    }),
  );

  router.get(
    '/ai/conversations/:id',
    ctx.requireAuth,
    handle(async (req, res) => {
      const id = idParam.safeParse(req.params.id);
      if (!id.success) return validationError(res, id.error);
      res.json({ conversation: service.getConversation(currentUser(res), id.data) });
    }),
  );

  router.delete(
    '/ai/conversations/:id',
    ctx.requireAuth,
    handle(async (req, res) => {
      const id = idParam.safeParse(req.params.id);
      if (!id.success) return validationError(res, id.error);
      service.deleteConversation(currentUser(res), id.data);
      res.json({ ok: true });
    }),
  );

  router.get(
    '/drugs/info',
    ctx.requireAuth,
    handle(async (req, res) => {
      const parsed = nameQuery.safeParse({ name: typeof req.query.name === 'string' ? req.query.name : '' });
      if (!parsed.success) return validationError(res, parsed.error);
      res.json(await service.drugInfo(parsed.data.name));
    }),
  );

  router.get(
    '/evidence/search',
    ctx.requireAuth,
    handle(async (req, res) => {
      const parsed = searchQuery.safeParse({ q: typeof req.query.q === 'string' ? req.query.q : '' });
      if (!parsed.success) return validationError(res, parsed.error);
      res.json(await service.evidenceSearch(parsed.data.q));
    }),
  );

  return router;
}
