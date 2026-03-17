/**
 * Correlation ID Middleware — Request traceability
 *
 * Assigns a unique correlation ID to every request.
 * Propagates existing X-Correlation-ID from upstream callers.
 * Attaches to response headers for end-to-end tracing.
 */

import { randomUUID } from "crypto";
import type { Request, Response, NextFunction } from "express";

const HEADER = "x-correlation-id";

declare global {
  namespace Express {
    interface Request {
      correlationId: string;
    }
  }
}

export function correlationIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const id = (req.headers[HEADER] as string) || randomUUID();

  req.correlationId = id;
  res.setHeader(HEADER, id);

  next();
}
