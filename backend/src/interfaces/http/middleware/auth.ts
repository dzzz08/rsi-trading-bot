import type { NextFunction, Request, Response } from 'express';

/**
 * Minimal single-user bearer auth. Present, not absent (docs/02 cross-cutting).
 * The schema is user-scoped so swapping in Auth.js/Supabase multi-tenant auth
 * later is additive. `req.userId` is attached for downstream handlers.
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export function bearerAuth(token: string, defaultUserId: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const header = req.header('authorization') ?? '';
    const provided = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (provided !== token) {
      res.status(401).json({ error: { code: 'unauthorized', message: 'Invalid or missing bearer token' } });
      return;
    }
    req.userId = defaultUserId;
    next();
  };
}

/** Separate token guard for the internal scheduler trigger. */
export function schedulerAuth(token: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const header = req.header('authorization') ?? '';
    const provided = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (provided !== token) {
      res.status(401).json({ error: { code: 'unauthorized', message: 'Invalid scheduler token' } });
      return;
    }
    next();
  };
}
