/**
 * Contract: Manifest → Deployment
 * Name: DeploymentManifest
 * Version: 1-0-0
 *
 * Produced by: Manifest context (after parameter resolution and compilation)
 * Consumed by: Deployment context (Docker runtime, supervisor, reconciliation)
 *
 * Traceability: specId links to ArchitectureSpec; manifestId is this document's identity.
 * containerName is deterministic: {manifestId-short}-{serviceName}-{port}
 *
 * ALL parameters are fully resolved — no ${PARAM} references remain.
 */

import { z } from "zod";

// ─── Sub-schemas ──────────────────────────────────────────────────

const HealthCheckSchema = z.object({
  command: z.array(z.string()),
  interval: z.number().int().positive().describe("seconds"),
  timeout: z.number().int().positive().describe("seconds"),
  retries: z.number().int().min(1).max(10),
});

const DeployedServiceSchema = z.object({
  name: z.string(),
  containerName: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/),
  image: z.string().min(1),
  ports: z.array(
    z.object({
      host: z.number().int().min(1).max(65535),
      container: z.number().int().min(1).max(65535),
    })
  ),
  env: z.record(z.string(), z.string()),
  restart: z.enum(["always", "on-failure", "no"]).default("on-failure"),
  healthCheck: HealthCheckSchema.optional(),
});

const NetworkSchema = z.object({
  name: z.string(),
  driver: z.string().default("bridge"),
});

const VolumeSchema = z.object({
  name: z.string(),
  source: z.string(),
  target: z.string(),
});

const ReconciliationSchema = z.object({
  strategy: z.enum(["restart", "recreate", "rolling"]).default("restart"),
  maxRetries: z.number().int().min(0).max(100).default(5),
  backoffSeconds: z.number().int().min(1).max(300).default(10),
  deadlineSeconds: z.number().int().min(30).max(3600).default(300),
});

// ─── Main schema ──────────────────────────────────────────────────

export const DeploymentManifestSchema = z.object({
  schemaVersion: z.literal("1-0-0"),
  manifestId: z.string().uuid(),
  specId: z.string().uuid(),
  timestamp: z.string().datetime(),

  desiredState: z.object({
    services: z.array(DeployedServiceSchema).min(1),
    networks: z.array(NetworkSchema).default([]),
    volumes: z.array(VolumeSchema).default([]),
  }),

  reconciliation: ReconciliationSchema.default({
    strategy: "restart",
    maxRetries: 5,
    backoffSeconds: 10,
    deadlineSeconds: 300,
  }),
});

// ─── Types ────────────────────────────────────────────────────────

export type DeploymentManifest = z.infer<typeof DeploymentManifestSchema>;
export type DeployedService = z.infer<typeof DeployedServiceSchema>;
export type Reconciliation = z.infer<typeof ReconciliationSchema>;

// ─── Validation helpers ───────────────────────────────────────────

export function validateDeploymentManifest(
  data: unknown
): DeploymentManifest {
  return DeploymentManifestSchema.parse(data);
}

export function isValidDeploymentManifest(
  data: unknown
): data is DeploymentManifest {
  return DeploymentManifestSchema.safeParse(data).success;
}
