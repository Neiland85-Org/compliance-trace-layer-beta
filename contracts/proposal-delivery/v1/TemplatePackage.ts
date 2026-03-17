/**
 * Contract: Arch Proposal → Delivery
 * Name: TemplatePackage
 * Version: 1-0-0
 *
 * Produced by: Arch Proposal context (wraps ArchitectureSpec for commercialization)
 * Consumed by: Delivery context (licensing, packaging, distribution)
 *
 * The ACL (Anti-Corruption Layer) lives in Delivery — it translates
 * TemplatePackage into its own internal domain model for licensing.
 */

import { z } from "zod";
import { ArchitectureSpecSchema } from "../../proposal-manifest/v1/ArchitectureSpec.js";

// ─── Sub-schemas ──────────────────────────────────────────────────

const LicenseSchema = z.object({
  type: z.enum(["free", "starter", "professional", "enterprise"]),
  restrictions: z.array(z.string()),
  expiresAt: z.string().datetime().optional(),
});

const AssetSchema = z.object({
  path: z.string(),
  type: z.enum([
    "dockerfile",
    "compose",
    "config",
    "migration",
    "readme",
    "source",
  ]),
  contentHash: z.string().regex(/^[a-f0-9]{64}$/),
});

const PresetSchema = z.object({
  name: z.string(),
  values: z.record(z.string(), z.unknown()),
});

// ─── Main schema ──────────────────────────────────────────────────

export const TemplatePackageSchema = z.object({
  schemaVersion: z.literal("1-0-0"),
  templateId: z.string().regex(/^[a-z][a-z0-9-]*$/),
  version: z
    .string()
    .regex(/^\d+\.\d+\.\d+$/, "Must be SemVer (e.g., 1.0.0)"),

  metadata: z.object({
    name: z.string().min(1),
    description: z.string(),
    category: z.string(),
    tags: z.array(z.string()),
    author: z.string(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }),

  license: LicenseSchema,

  spec: ArchitectureSpecSchema,

  assets: z.array(AssetSchema),

  customization: z.object({
    parameters: ArchitectureSpecSchema.shape.parameters,
    presets: z.array(PresetSchema),
  }),
});

// ─── Types ────────────────────────────────────────────────────────

export type TemplatePackage = z.infer<typeof TemplatePackageSchema>;
export type License = z.infer<typeof LicenseSchema>;
export type Asset = z.infer<typeof AssetSchema>;
export type Preset = z.infer<typeof PresetSchema>;

// ─── Validation helpers ───────────────────────────────────────────

export function validateTemplatePackage(data: unknown): TemplatePackage {
  return TemplatePackageSchema.parse(data);
}

export function isValidTemplatePackage(
  data: unknown
): data is TemplatePackage {
  return TemplatePackageSchema.safeParse(data).success;
}
