/**
 * Contract: Arch Proposal → Manifest
 * Name: ArchitectureSpec
 * Version: 1-0-0
 *
 * Produced by: Arch Proposal context (after human approval gate)
 * Consumed by: Manifest context (compiled to DeploymentManifest)
 *              Delivery context (wrapped in license envelope)
 *
 * Traceability: snapshotId + analysisId link upstream; specId is this document's identity.
 * This is the PUBLISHED LANGUAGE between the intelligence and engine domains.
 */

import { z } from "zod";

// ─── Sub-schemas ──────────────────────────────────────────────────

const ParameterSchema = z.object({
  key: z.string().regex(/^[A-Z][A-Z0-9_]*$/, "Must be UPPER_SNAKE_CASE"),
  type: z.enum(["string", "number", "boolean", "enum"]),
  default: z.unknown(),
  description: z.string(),
  required: z.boolean(),
  enumValues: z.array(z.string()).optional(),
});

const ServiceDefinitionSchema = z.object({
  name: z
    .string()
    .regex(/^[a-z][a-z0-9-]*$/, "Must be lowercase kebab-case"),
  image: z.string().min(1),
  port: z.number().int().min(1).max(65535),
  exposedPort: z.number().int().min(1).max(65535).optional(),
  env: z.record(z.string(), z.string()).default({}),
  healthCheck: z
    .object({
      path: z.string(),
      interval: z.string().default("30s"),
      timeout: z.string().default("10s"),
    })
    .optional(),
  dependsOn: z.array(z.string()).optional(),
  resources: z
    .object({
      cpuLimit: z.string(),
      memoryLimit: z.string(),
    })
    .optional(),
});

const NetworkDefinitionSchema = z.object({
  name: z.string(),
  driver: z.enum(["bridge", "overlay"]),
  internal: z.boolean().default(false),
});

const VolumeDefinitionSchema = z.object({
  name: z.string(),
  driver: z.literal("local").default("local"),
  mountPath: z.string(),
  service: z.string(),
});

const ServiceContractSchema = z.object({
  consumer: z.string(),
  provider: z.string(),
  protocol: z.enum(["http", "grpc", "tcp", "amqp"]),
  port: z.number().int(),
  healthEndpoint: z.string().optional(),
});

// ─── Main schema ──────────────────────────────────────────────────

export const ArchitectureSpecSchema = z.object({
  schemaVersion: z.literal("1-0-0"),
  specId: z.string().uuid(),
  analysisId: z.string().uuid(),
  snapshotId: z.string().uuid(),
  timestamp: z.string().datetime(),

  metadata: z.object({
    name: z.string().min(1),
    description: z.string(),
    category: z.enum([
      "compliance",
      "observability",
      "event-systems",
      "api-platform",
      "data-pipeline",
    ]),
    targetStack: z.array(z.string()),
    estimatedComplexity: z.enum(["low", "medium", "high"]),
    qualityScore: z.number().min(0).max(1),
  }),

  topology: z.object({
    services: z.array(ServiceDefinitionSchema).min(1),
    networks: z.array(NetworkDefinitionSchema).default([]),
    volumes: z.array(VolumeDefinitionSchema).default([]),
  }),

  contracts: z.array(ServiceContractSchema).default([]),

  parameters: z.array(ParameterSchema).default([]),

  templateRef: z
    .object({
      templateId: z.string(),
      templateVersion: z.string(),
      overrides: z.record(z.string(), z.unknown()).default({}),
    })
    .optional(),
});

// ─── Types ────────────────────────────────────────────────────────

export type ArchitectureSpec = z.infer<typeof ArchitectureSpecSchema>;
export type ServiceDefinition = z.infer<typeof ServiceDefinitionSchema>;
export type NetworkDefinition = z.infer<typeof NetworkDefinitionSchema>;
export type VolumeDefinition = z.infer<typeof VolumeDefinitionSchema>;
export type ServiceContract = z.infer<typeof ServiceContractSchema>;
export type Parameter = z.infer<typeof ParameterSchema>;

// ─── Validation helpers ───────────────────────────────────────────

export function validateArchitectureSpec(data: unknown): ArchitectureSpec {
  return ArchitectureSpecSchema.parse(data);
}

export function isValidArchitectureSpec(
  data: unknown
): data is ArchitectureSpec {
  return ArchitectureSpecSchema.safeParse(data).success;
}
