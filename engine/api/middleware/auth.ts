/**
 * Auth Middleware — API key authentication for deploy engine
 *
 * Reads API key from TRACE_ENGINE_API_KEY env variable.
 * Clients must send: Authorization: Bearer <key>
 *
 * In development, if TRACE_ENGINE_API_KEY is not set, auth is bypassed
 * with a warning. In production (NODE_ENV=production), it's mandatory.
 */

import type { Request, Response, NextFunction } from "express";

const API_KEY = process.env.TRACE_ENGINE_API_KEY;
const IS_PROD = process.env.NODE_ENV === "production";

if (!API_KEY && IS_PROD) {
  console.error("FATAL: TRACE_ENGINE_API_KEY must be set in production");
  process.exit(1);
}

if (!API_KEY && !IS_PROD) {
  console.warn("⚠️  TRACE_ENGINE_API_KEY not set — auth disabled in dev mode");
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Health and metrics always accessible
  if (req.path === "/health" || req.path === "/metrics") {
    return next();
  }

  // If no API key configured (dev only), bypass auth
  if (!API_KEY) {
    return next();
  }

  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({
      error: "Authentication required",
      code: "AUTH_MISSING",
    });
    return;
  }

  const token = header.slice(7);

  if (token !== API_KEY) {
    res.status(403).json({
      error: "Invalid API key",
      code: "AUTH_INVALID",
    });
    return;
  }

  next();
}
