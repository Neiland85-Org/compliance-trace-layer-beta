/**
 * Exporter — Serializes envelopes to distributable formats
 *
 * Supported formats:
 *   .trace.json  — JSON file (envelope with embedded package)
 *   .trace.tar   — Tarball with envelope.json + asset files (future)
 *
 * The .trace.json format is self-contained: the envelope includes
 * the full package, license, and integrity seal. A recipient can
 * verify the seal, check the license, and extract the spec.
 */

import fs from "fs";
import path from "path";
import type { Envelope } from "../license/license-envelope.js";

// ─── Export formats ──────────────────────────────────────────────

export type ExportFormat = "json" | "tar";

export interface ExportResult {
  format: ExportFormat;
  outputPath: string;
  sizeBytes: number;
  envelopeId: string;
  templateId: string;
  licenseTier: string;
}

// ─── JSON export ─────────────────────────────────────────────────

/**
 * Export an envelope as a .trace.json file.
 * This is the primary distribution format.
 */
export function exportAsJson(
  envelope: Envelope,
  outputDir: string,
  filename?: string
): ExportResult {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const templateId = envelope.package?.templateId || "unknown";
  const tier = envelope.license.tier;
  const name = filename || `${templateId}-${tier}.trace.json`;
  const outputPath = path.join(outputDir, name);

  const serialized = JSON.stringify(envelope, null, 2);
  fs.writeFileSync(outputPath, serialized);

  return {
    format: "json",
    outputPath,
    sizeBytes: Buffer.byteLength(serialized),
    envelopeId: envelope.envelopeId,
    templateId,
    licenseTier: tier,
  };
}

// ─── Import / load ───────────────────────────────────────────────

/**
 * Load an envelope from a .trace.json file.
 */
export function loadEnvelope(filePath: string): Envelope {
  const content = fs.readFileSync(filePath, "utf8");
  return JSON.parse(content) as Envelope;
}

// ─── Manifest generation ─────────────────────────────────────────

/**
 * Generate a distribution manifest (index of all exported packages).
 * Useful for registry or catalog publication.
 */
export interface DistributionManifest {
  generatedAt: string;
  packages: Array<{
    templateId: string;
    version: string;
    tier: string;
    filename: string;
    sizeBytes: number;
    envelopeId: string;
    sealHash: string;
  }>;
}

export function generateManifest(
  results: ExportResult[],
  envelopes: Envelope[]
): DistributionManifest {
  return {
    generatedAt: new Date().toISOString(),
    packages: results.map((r, i) => ({
      templateId: r.templateId,
      version: envelopes[i]?.package?.version || "1.0.0",
      tier: r.licenseTier,
      filename: path.basename(r.outputPath),
      sizeBytes: r.sizeBytes,
      envelopeId: r.envelopeId,
      sealHash: envelopes[i]?.seal?.contentHash || "",
    })),
  };
}
