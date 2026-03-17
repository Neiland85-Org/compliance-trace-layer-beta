/**
 * Deploy Routes — Container deployment API
 *
 * POST /deploy          — Deploy single container
 * POST /deploy-manifest — Deploy stack from manifest
 * DELETE /service/:name — Remove a service
 */

import { Router } from "express";
import { z } from "zod";
import { runContainer, stopContainer, IMAGE_ALLOWLIST } from "../../deployment/docker-adapter.js";
import {
  registerService,
  removeService,
  allocatePort,
  releasePort,
  getService,
  logEvent,
} from "../../deployment/state-store.js";

const router = Router();

// ─── Schemas ──────────────────────────────────────────────────────

const DeployRequestSchema = z.object({
  name: z.string().regex(/^[a-zA-Z0-9_-]+$/, "Invalid container name"),
  image: z.string().min(1),
  port: z.number().int().min(1).max(65535).optional().default(80),
  env: z.record(z.string(), z.string()).optional(),
  manifestId: z.string().uuid().optional(),
});

// ─── POST /deploy ─────────────────────────────────────────────────

router.post("/deploy", async (req, res, next) => {
  try {
    const body = DeployRequestSchema.parse(req.body);
    const hostPort = allocatePort(body.name);
    const containerName = `${body.name}-${hostPort}`;

    await runContainer({
      containerName,
      image: body.image,
      hostPort,
      containerPort: body.port,
      env: body.env,
      restart: "on-failure",
    });

    const service = {
      name: body.name,
      containerName,
      image: body.image,
      hostPort,
      containerPort: body.port,
      url: `http://localhost:${hostPort}`,
      manifestId: body.manifestId || null,
      status: "running" as const,
      restartCount: 0,
      createdAt: new Date().toISOString(),
    };

    registerService(service);
    logEvent("deployed", { service: body.name, containerName, port: hostPort }, body.manifestId);

    console.log(`[deploy] ${containerName} → :${hostPort} (${body.image})`);

    res.json({
      status: "running",
      container: containerName,
      service: service.url,
      port: hostPort,
      correlationId: req.correlationId,
    });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /service/:name ────────────────────────────────────────

router.delete("/service/:name", async (req, res, next) => {
  try {
    const name = req.params.name;

    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      res.status(400).json({ error: "Invalid service name" });
      return;
    }

    const svc = getService(name);

    // Try to stop Docker container (best effort)
    try {
      if (svc) {
        await stopContainer(svc.containerName);
        releasePort(svc.hostPort);
      } else {
        // Try with the raw name as container name
        await stopContainer(name);
      }
    } catch {
      // Container might already be gone
    }

    removeService(name);
    logEvent("removed", { service: name });

    console.log(`[deploy] removed ${name}`);

    res.json({
      status: "removed",
      correlationId: req.correlationId,
    });
  } catch (err) {
    next(err);
  }
});

export { router as deployRoutes };
