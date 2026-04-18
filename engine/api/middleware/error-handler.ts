/**
 * Error Handler — Centralized error response formatting
 */

import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const correlationId = req.correlationId || "unknown";

  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Validation failed",
      code: "VALIDATION_ERROR",
      correlationId,
      details: err.errors.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      })),
    });
    return;
  }

  // Known operational errors
  if (err.message.startsWith("Invalid") || err.message.startsWith("Image not allowed")) {
    res.status(400).json({
      error: err.message,
      code: "BAD_REQUEST",
      correlationId,
    });
    return;
  }

  // Unexpected errors
  console.error(`[${correlationId}] Unhandled error:`, err);

  res.status(500).json({
    error: "Internal server error",
    code: "INTERNAL_ERROR",
    correlationId,
  });
}
