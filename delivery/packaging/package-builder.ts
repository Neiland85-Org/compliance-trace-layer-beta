/**
 * Package Builder — Assembles TemplatePackage from components
 *
 * Takes a template directory (with template.json + presets/) and
 * produces a validated TemplatePackage ready for licensing and delivery.
 *
 * Flow:
 *   template.json → read spec
 *   presets/*.json → load presets
 *   directory scan → collect assets
 *   combine → validate via TemplatePackageSchema
 */

import fs from "fs";
import path from "path";

import {
  TemplatePackageSchema,
  type TemplatePackage,
} from "../../contracts/proposal-delivery/v1/TemplatePackage.js";
import {
  ArchitectureSpecSchema,
} from "../../contracts/proposal-manifest/v1/ArchitectureSpec.js";
import { collectAssets } from "./asset-collector.js";
import { randomUUID } from "crypto";

// ─── Types ───────────────────────────────────────────────────────

export interface BuildOptions {
  /** Override license type (default: "free") */
  licenseTier?: "free" | "starter" | "professional" | "enterprise";
  /** Author name override */
  author?: string;
  /** Additional tags to merge */
  extraTags?: string[];
}

export interface BuildResult {
  package: TemplatePackage;
  warnings: string[];
  assetCount: number;
  totalSizeBytes: number;
}

// ─── Builder ─────────────────────────────────────────────────────

/**
 * Build a TemplatePackage from a template directory.
 *
 * Expected directory structure:
 *   template.json          — Template definition (topology, parameters, etc.)
 *   presets/               — Optional preset files
 *     starter.json
 *     production.json
 *   ...                    — Other assets (Dockerfiles, configs, migrations)
 */
export function buildPackage(
  templateDir: string,
  options: BuildOptions = {}
): BuildResult {
  const warnings: string[] = [];

  // 1. Load template.json
  const templatePath = path.join(templateDir, "template.json");
  if (!fs.existsSync(templatePath)) {
    throw new Error(`template.json not found in ${templateDir}`);
  }
  const templateData = JSON.parse(fs.readFileSync(templatePath, "utf8"));

  // 2. Load presets
  const presetsDir = path.join(templateDir, "presets");
  const presets: Array<{ name: string; values: Record<string, unknown> }> = [];

  if (fs.existsSync(presetsDir)) {
    const presetFiles = fs.readdirSync(presetsDir).filter((f) => f.endsWith(".json"));
    for (const f of presetFiles) {
      const data = JSON.parse(fs.readFileSync(path.join(presetsDir, f), "utf8"));
      presets.push({
        name: data.name || f.replace(".json", ""),
        values: data.values || data,
      });
    }
  } else {
    warnings.push("No presets/ directory found — package will have no presets");
  }

  // 3. Collect assets
  const assets = collectAssets(templateDir);

  // 4. Build ArchitectureSpec (used inside the package)
  const spec = ArchitectureSpecSchema.parse({
    schemaVersion: "1-0-0",
    specId: randomUUID(),
    analysisId: randomUUID(),   // Synthetic — package was built from template
    snapshotId: randomUUID(),   // Synthetic — package was built from template
    timestamp: new Date().toISOString(),
    metadata: {
      name: templateData.metadata?.name || templateData.templateId,
      description: templateData.metadata?.description || "",
      category: templateData.metadata?.category || "general",
      targetStack: templateData.metadata?.tags?.slice(0, 5) || [],
      estimatedComplexity: estimateComplexityFromServices(
        templateData.topology?.services?.length || 0
      ),
      qualityScore: 0.8,   // Base score for authored templates
    },
    topology: templateData.topology || { services: [], networks: [], volumes: [] },
    contracts: templateData.contracts || [],
    parameters: templateData.parameters || [],
  });

  // 5. Assemble TemplatePackage
  const now = new Date().toISOString();
  const tags = [
    ...(templateData.metadata?.tags || []),
    ...(options.extraTags || []),
  ];

  const pkg = TemplatePackageSchema.parse({
    schemaVersion: "1-0-0",
    templateId: templateData.templateId,
    version: templateData.version || "1.0.0",
    metadata: {
      name: templateData.metadata?.name || templateData.templateId,
      description: templateData.metadata?.description || "",
      category: templateData.metadata?.category || "general",
      tags: [...new Set(tags)],
      author: options.author || templateData.metadata?.author || "unknown",
      createdAt: templateData.metadata?.createdAt || now,
      updatedAt: now,
    },
    license: {
      type: options.licenseTier || "free",
      restrictions: [],   // Populated by license-manager at envelope time
    },
    spec,
    assets,
    customization: {
      parameters: templateData.parameters || [],
      presets,
    },
  });

  // 6. Compute total size
  let totalSizeBytes = 0;
  for (const asset of assets) {
    const fp = path.join(templateDir, asset.path);
    if (fs.existsSync(fp)) totalSizeBytes += fs.statSync(fp).size;
  }

  return {
    package: pkg,
    warnings,
    assetCount: assets.length,
    totalSizeBytes,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────

function estimateComplexityFromServices(
  count: number
): "low" | "medium" | "high" {
  if (count > 4) return "high";
  if (count > 2) return "medium";
  return "low";
}
