/**
 * Services Routes — Service registry queries
 *
 * GET /services         — List all registered services
 * GET /services/:name   — Get single service details
 * GET /logs/:name       — Get container logs
 * GET /health/:name     — Check container health
 */

import { Router } from "express";
import { getAllServices, getService } from "../../deployment/state-store.js";
import { getContainerLogs, isContainerRunning } from "../../deployment/docker-adapter.js";

const router = Router();

// ─── GET /services ────────────────────────────────────────────────

router.get("/services", (_req, res) => {
  const services = getAllServices();
  res.json(services);
});

// ─── GET /services/:name ──────────────────────────────────────────

router.get("/services/:name", (req, res) => {
  const svc = getService(req.params.name);
  if (!svc) {
    res.status(404).json({ error: "Service not found" });
    return;
  }
  res.json(svc);
});

// ─── GET /logs/:name ──────────────────────────────────────────────

router.get("/logs/:name", async (req, res, next) => {
  try {
    const name = req.params.name;

    if (!/^[a-zA-Z0-9_.-]+$/.test(name)) {
      res.status(400).json({ error: "Invalid name" });
      return;
    }

    const svc = getService(name);
    const containerName = svc?.containerName || name;

    const logs = await getContainerLogs(containerName);
    res.json({
      service: name,
      logs,
      correlationId: req.correlationId,
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /health/:name ───────────────────────────────────────────

router.get("/health/:name", async (req, res, next) => {
  try {
    const name = req.params.name;
    const svc = getService(name);
    const containerName = svc?.containerName || name;

    const running = await isContainerRunning(containerName);
    res.json({
      service: name,
      running,
      status: svc?.status || (running ? "running" : "unknown"),
      restartCount: svc?.restartCount || 0,
      correlationId: req.correlationId,
    });
  } catch (err) {
    next(err);
  }
});

export { router as servicesRoutes };
