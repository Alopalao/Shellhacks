// createApp(ctx): the Express application (CORS *, JSON, routes, JSON errors).
import cors from 'cors';
import express, { type ErrorRequestHandler, type Express, type RequestHandler } from 'express';
import { ZodError } from 'zod';
import { createAiRouter } from './ai/router';
import type { ServerContext } from './context';
import { HttpError } from './routes/http';
import { mountCoreRoutes } from './routes';
import type { ApiError } from './shared/contracts';

const AI_PATH = /^\/(ai|drugs|evidence)(\/|$)/;

function describeZodError(error: ZodError): ApiError {
  const details = error.issues.map((issue) => ({
    path: issue.path.map(String).join('.'),
    message: issue.message,
  }));
  const first = details[0];
  const summary = first ? (first.path ? `${first.path}: ${first.message}` : first.message) : 'Invalid request';
  return { error: details.length > 1 ? `${summary} (+${details.length - 1} more)` : summary, details };
}

/** body-parser and friends signal client errors with an http status on the error object. */
function clientErrorStatus(err: unknown): number | null {
  if (typeof err !== 'object' || err === null) return null;
  const { status, statusCode } = err as { status?: unknown; statusCode?: unknown };
  const code = typeof status === 'number' ? status : typeof statusCode === 'number' ? statusCode : null;
  return code !== null && code >= 400 && code < 500 ? code : null;
}

const notFoundHandler: RequestHandler = (req, res) => {
  const body: ApiError = { error: `Not found: ${req.method} ${req.path}` };
  res.status(404).json(body);
};

const errorHandler: ErrorRequestHandler = (err: unknown, req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }
  if (err instanceof ZodError) {
    res.status(400).json(describeZodError(err));
    return;
  }
  if (err instanceof HttpError) {
    const body: ApiError = err.details === undefined ? { error: err.message } : { error: err.message, details: err.details };
    res.status(err.status).json(body);
    return;
  }
  const clientStatus = clientErrorStatus(err);
  if (clientStatus !== null) {
    const { type, message: raw } = err as { type?: unknown; message?: unknown };
    const message =
      type === 'entity.parse.failed'
        ? 'The request body is not valid JSON.'
        : type === 'entity.too.large'
          ? 'The request body is too large.'
          : typeof raw === 'string' && raw
            ? raw
            : 'Bad request.';
    res.status(clientStatus).json({ error: message } satisfies ApiError);
    return;
  }
  console.error(`[api] ${req.method} ${req.originalUrl} failed:`, err);
  res.status(500).json({ error: 'Something went wrong on the BRIAN server. Please try again.' } satisfies ApiError);
};

export function createApp(ctx: ServerContext): Express {
  const app = express();
  app.disable('x-powered-by');
  app.set('etag', false); // live data — never answer 304 to the app's polling/refetches
  app.use(cors({ origin: '*' }));
  app.use(express.json({ limit: '1mb' }));
  // Missing bodies validate as {} so clients get field-level messages ("email: Enter your email").
  app.use((req, _res, next) => {
    if (req.body === undefined) req.body = {};
    next();
  });

  app.get('/', (_req, res) => {
    res.json({ name: 'BRIAN', ok: true, message: 'BRIAN API is running. Try GET /api/health.' });
  });

  mountCoreRoutes(app, ctx);

  // The AI router is mounted at /api (its routes: /api/ai/*, /api/drugs/*, /api/evidence/*).
  // Only its own prefixes are dispatched to it, so router-level middleware inside it (e.g.
  // auth) can never turn the JSON 404 for unknown /api paths into something else.
  const aiRouter = createAiRouter(ctx);
  app.use('/api', (req, res, next) => {
    if (AI_PATH.test(req.path)) aiRouter(req, res, next);
    else next();
  });

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
