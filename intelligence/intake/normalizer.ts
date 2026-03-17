/**
 * Normalizer — Transforms RawIntakeData into a validated CodebaseSnapshot
 *
 * This is the SINGLE point where CodebaseSnapshot documents are created.
 * All intake adapters (GitHub, local, upload) produce RawIntakeData,
 * and the normalizer transforms + validates them into the contract schema.
 */

import { randomUUID } from "crypto";
import {
  CodebaseSnapshotSchema,
  type CodebaseSnapshot,
} from "../../contracts/intake-analysis/v1/index.js";
import type { RawIntakeData } from "./github-adapter.js";

export interface NormalizerOptions {
  selectedFiles?: {
    path: string;
    contentHash: string;
    sizeBytes: number;
    language: string;
  }[];
}

/**
 * Normalize raw intake data into a validated CodebaseSnapshot.
 *
 * @throws ZodError if the resulting snapshot fails validation
 */
export function normalize(
  raw: RawIntakeData,
  opts: NormalizerOptions = {}
): CodebaseSnapshot {
  const pkg = raw.packageJson || {};

  const snapshot = {
    schemaVersion: "1-0-0" as const,
    snapshotId: randomUUID(),
    timestamp: new Date().toISOString(),

    source: {
      type: raw.source.type,
      url: raw.source.url || undefined,
      ref: raw.source.ref || undefined,
    },

    packageJson: {
      name: (pkg.name as string) || raw.repoMeta.name || "unknown",
      version: (pkg.version as string) || undefined,
      dependencies: (pkg.dependencies as Record<string, string>) || {},
      devDependencies: (pkg.devDependencies as Record<string, string>) || {},
      scripts: (pkg.scripts as Record<string, string>) || {},
      engines: (pkg.engines as Record<string, string>) || undefined,
    },

    fileTree: raw.fileTree.slice(0, 500), // Cap at 500 entries

    selectedFiles: opts.selectedFiles || [],

    dockerPresence: {
      hasDockerfile: raw.hasDockerfile,
      hasCompose: raw.hasCompose,
      composeServices: raw.composeServices.length > 0
        ? raw.composeServices
        : undefined,
    },

    ciPresence: {
      provider: raw.ciProvider !== "none" ? raw.ciProvider : undefined,
      hasWorkflows: raw.hasWorkflows,
    },
  };

  // Validate against contract schema — fails fast if invalid
  return CodebaseSnapshotSchema.parse(snapshot);
}
