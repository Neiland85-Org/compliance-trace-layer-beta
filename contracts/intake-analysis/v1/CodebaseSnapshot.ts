/**
 * Contract: Intake → Analysis
 * Name: CodebaseSnapshot
 * Version: 1-0-0
 *
 * Produced by: Intake context (after normalizing a repo/upload)
 * Consumed by: Analysis context (for stack detection, pattern scanning)
 *
 * Traceability: snapshotId is the root of the full trace chain.
 */

import { z } from "zod";

// ─── Zod Schema (runtime validation) ──────────────────────────────

export const CodebaseSnapshotSchema = z.object({
  schemaVersion: z.literal("1-0-0"),
  snapshotId: z.string().uuid(),
  timestamp: z.string().datetime(),

  source: z.object({
    type: z.enum(["github", "gitlab", "local", "upload"]),
    url: z.string().url().optional(),
    ref: z.string().optional(),
  }),

  packageJson: z.object({
    name: z.string().min(1),
    version: z.string().optional(),
    dependencies: z.record(z.string(), z.string()).default({}),
    devDependencies: z.record(z.string(), z.string()).default({}),
    scripts: z.record(z.string(), z.string()).default({}),
    engines: z.record(z.string(), z.string()).optional(),
  }),

  fileTree: z.array(z.string()).describe("Relative paths, max depth 4"),

  selectedFiles: z.array(
    z.object({
      path: z.string(),
      contentHash: z.string().regex(/^[a-f0-9]{64}$/, "Must be SHA-256 hex"),
      sizeBytes: z.number().int().nonnegative(),
      language: z.string(),
    })
  ),

  dockerPresence: z.object({
    hasDockerfile: z.boolean(),
    hasCompose: z.boolean(),
    composeServices: z.array(z.string()).optional(),
  }),

  ciPresence: z.object({
    provider: z
      .enum(["github-actions", "gitlab-ci", "circleci", "none"])
      .optional(),
    hasWorkflows: z.boolean(),
  }),
});

// ─── TypeScript Type (derived from schema) ────────────────────────

export type CodebaseSnapshot = z.infer<typeof CodebaseSnapshotSchema>;

// ─── Validation helpers ───────────────────────────────────────────

export function validateCodebaseSnapshot(data: unknown): CodebaseSnapshot {
  return CodebaseSnapshotSchema.parse(data);
}

export function isValidCodebaseSnapshot(
  data: unknown
): data is CodebaseSnapshot {
  return CodebaseSnapshotSchema.safeParse(data).success;
}
