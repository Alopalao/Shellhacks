import type { RequestHandler, Response } from 'express';
import type { Db } from '../context';
import type { Role } from '../shared/contracts';
import { parseBearer, userForToken } from './sessions';

/**
 * `Authorization: Bearer <token>` guard. On success sets `res.locals.user` (the full user)
 * and `res.locals.sessionToken`; otherwise responds 401 JSON.
 */
export function createRequireAuth(db: Db): RequestHandler {
  return (req, res, next) => {
    const token = parseBearer(req.get('authorization'));
    if (!token) {
      res.status(401).json({ error: 'Please sign in to continue.' });
      return;
    }
    const user = userForToken(db, token);
    if (!user) {
      res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
      return;
    }
    res.locals.user = user;
    res.locals.sessionToken = token;
    next();
  };
}

const ROLE_LABEL: Record<Role, string> = { patient: 'patients', doctor: 'doctors' };

/** Must run after requireAuth. Responds 403 unless the signed-in user has one of `roles`. */
export function requireRole(...roles: Role[]): RequestHandler {
  return (_req, res, next) => {
    const role = (res.locals.user as { role?: Role } | undefined)?.role;
    if (role && roles.includes(role)) {
      next();
      return;
    }
    const who = roles.map((r) => ROLE_LABEL[r]).join(' or ');
    res.status(403).json({ error: `This is only available to ${who}.` });
  };
}

/** The bearer token of the current request (set by requireAuth). */
export function sessionToken(res: Response): string | undefined {
  const token: unknown = res.locals.sessionToken;
  return typeof token === 'string' ? token : undefined;
}
