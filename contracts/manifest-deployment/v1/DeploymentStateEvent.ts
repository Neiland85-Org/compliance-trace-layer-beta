/**
 * Contract: Deployment → Manifest (feedback event)
 * Name: DeploymentStateEvent
 * Version: 1-0-0
 *
 * Produced by: Deployment context (reconciler, drift detector)
 * Consumed by: Manifest context (updates actual-state view)
 *
 * This is a unidirectional event — not a request/response.
 * Events are append-only and immutable once emitted.
 */

import { z } from "zod";

const ServiceStatusSchema = z.object({
  name: z.string(),
  status: z.enum(["running", "stopped", "error", "missing"]),
  containerName: z.string().optional(),
  port: z.number().int().optional(),
  error: z.string().optional(),
  restartCount: z.number().int().nonnegative().default(0),
});

export const DeploymentStateEventSchema = z.object({
  schemaVersion: z.literal("1-0-0"),
  manifestId: z.string().uuid(),
  timestamp: z.string().datetime(),
  type: z.enum([
    "deployed",
    "degraded",
    "failed",
    "removed",
    "drift-detected",
    "reconciled",
  ]),
  services: z.array(ServiceStatusSchema),
});

// ─── Types ────────────────────────────────────────────────────────

export type DeploymentStateEvent = z.infer<typeof DeploymentStateEventSchema>;
export type ServiceStatus = z.infer<typeof ServiceStatusSchema>;

// ─── Validation helpers ───────────────────────────────────────────

export function validateDeploymentStateEvent(
  data: unknown
): DeploymentStateEvent {
  return DeploymentStateEventSchema.parse(data);
}

export function isValidDeploymentStateEvent(
  data: unknown
): data is DeploymentStateEvent {
  return DeploymentStateEventSchema.safeParse(data).success;
}
