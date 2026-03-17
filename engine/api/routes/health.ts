/**
 * Health & Metrics Routes — Engine observability
 */

import { Router } from "express";
import { getAllServices } from "../../deployment/state-store.js";
import { isReconcilerRunning } from "../../supervisor/reconciliation-loop.js";

const router = Router();

router.get("/health", (_req, res) => {
  const services = getAllServices();
  const degraded = services.filter((s) => s.status === "error" || s.status === "missing");

  res.json({
    status: degraded.length > 0 ? "degraded" : "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    reconciler: isReconcilerRunning() ? "running" : "stopped",
    services: {
      total: services.length,
      running: services.filter((s) => s.status === "running").length,
      degraded: degraded.length,
    },
  });
});

router.get("/metrics", (_req, res) => {
  const services = getAllServices();
  res.json({
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    services: {
      total: services.length,
      byStatus: {
        running: services.filter((s) => s.status === "running").length,
        stopped: services.filter((s) => s.status === "stopped").length,
        error: services.filter((s) => s.status === "error").length,
        missing: services.filter((s) => s.status === "missing").length,
      },
    },
  });
});

export { router as healthRoutes };
