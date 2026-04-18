/**
 * Recommendation Engine — Generates ArchitectureSpec from AnalysisReport + matched template
 *
 * This is the core intelligence: taking an analysis and producing a concrete
 * architecture recommendation that can be reviewed by a human, then deployed.
 *
 * HUMAN-IN-THE-LOOP: The output of this engine must be reviewed before
 * it reaches the Manifest context. This is step 19 in the execution flow.
 */

import { randomUUID } from "crypto";
import type { AnalysisReport } from "../../contracts/analysis-proposal/v1/index.js";
import {
  ArchitectureSpecSchema,
  type ArchitectureSpec,
} from "../../contracts/proposal-manifest/v1/index.js";
import { matchTemplates, type TemplateMatch } from "./template-matcher.js";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.resolve(__dirname, "../../templates");

export interface RecommendationResult {
  spec: ArchitectureSpec;
  matchedTemplate: TemplateMatch | null;
  allMatches: TemplateMatch[];
  requiresHumanReview: true;     // Always true — this is a design decision
}

/**
 * Generate an architecture recommendation from an analysis report.
 *
 * @param report - Validated AnalysisReport from Analysis context
 * @param forceTemplateId - Optional: force a specific template instead of auto-match
 * @returns RecommendationResult with spec, matches, and review flag
 */
export function recommend(
  report: AnalysisReport,
  forceTemplateId?: string
): RecommendationResult {
  const allMatches = matchTemplates(report);

  // Select template: forced > best match > none
  let selectedMatch: TemplateMatch | null = null;

  if (forceTemplateId) {
    selectedMatch = allMatches.find((m) => m.templateId === forceTemplateId) || null;
    if (!selectedMatch) {
      throw new Error(`Template not found: ${forceTemplateId}`);
    }
  } else if (allMatches.length > 0 && allMatches[0].matchScore >= 0.3) {
    selectedMatch = allMatches[0];
  }

  // Build ArchitectureSpec
  const spec = buildSpec(report, selectedMatch);

  return {
    spec,
    matchedTemplate: selectedMatch,
    allMatches,
    requiresHumanReview: true,
  };
}

// ─── Spec builder ─────────────────────────────────────────────────

function buildSpec(
  report: AnalysisReport,
  match: TemplateMatch | null
): ArchitectureSpec {
  if (match) {
    return buildFromTemplate(report, match);
  }
  return buildFromScratch(report);
}

function buildFromTemplate(
  report: AnalysisReport,
  match: TemplateMatch
): ArchitectureSpec {
  const templatePath = path.join(TEMPLATES_DIR, match.templateId, "template.json");
  const template = JSON.parse(fs.readFileSync(templatePath, "utf8"));

  // Compute quality score from analysis
  const qualityScore = computeQualityScore(report);

  const spec: ArchitectureSpec = ArchitectureSpecSchema.parse({
    schemaVersion: "1-0-0",
    specId: randomUUID(),
    analysisId: report.analysisId,
    snapshotId: report.snapshotId,
    timestamp: new Date().toISOString(),

    metadata: {
      name: template.metadata.name,
      description: template.metadata.description,
      category: template.metadata.category,
      targetStack: [
        ...report.stackFingerprint.runtime,
        ...report.stackFingerprint.databases,
      ],
      estimatedComplexity: estimateComplexity(template.topology.services.length, report),
      qualityScore,
    },

    topology: template.topology,
    contracts: template.contracts || [],
    parameters: template.parameters || [],

    templateRef: {
      templateId: match.templateId,
      templateVersion: template.version || "1.0.0",
      overrides: {},
    },
  });

  return spec;
}

function buildFromScratch(report: AnalysisReport): ArchitectureSpec {
  // Generate a minimal spec based purely on analysis findings
  const services = [];

  // Always recommend an API service if the project has a web framework
  if (report.stackFingerprint.frameworks.some(
    (f) => ["express", "fastify", "koa", "nestjs"].includes(f)
  )) {
    services.push({
      name: "api",
      image: "node:22",
      port: 3000,
      env: { NODE_ENV: "${NODE_ENV}" },
      healthCheck: { path: "/health", interval: "30s", timeout: "10s" },
    });
  }

  // Recommend a database if none detected
  if (report.stackFingerprint.databases.length === 0) {
    services.push({
      name: "db",
      image: "postgres:16",
      port: 5432,
      env: {
        POSTGRES_DB: "${DB_NAME}",
        POSTGRES_USER: "${DB_USER}",
        POSTGRES_PASSWORD: "${DB_PASSWORD}",
      },
    });
  }

  // Fallback: at least one service
  if (services.length === 0) {
    services.push({
      name: "app",
      image: "node:22",
      port: 3000,
      env: { NODE_ENV: "${NODE_ENV}" },
    });
  }

  return ArchitectureSpecSchema.parse({
    schemaVersion: "1-0-0",
    specId: randomUUID(),
    analysisId: report.analysisId,
    snapshotId: report.snapshotId,
    timestamp: new Date().toISOString(),

    metadata: {
      name: "Custom Architecture",
      description: "Auto-generated architecture recommendation based on codebase analysis",
      category: "api-platform",
      targetStack: [
        ...report.stackFingerprint.runtime,
        ...report.stackFingerprint.frameworks.slice(0, 3),
      ],
      estimatedComplexity: estimateComplexity(services.length, report),
      qualityScore: computeQualityScore(report),
    },

    topology: {
      services,
      networks: [],
      volumes: [],
    },

    contracts: [],
    parameters: [
      { key: "NODE_ENV", type: "enum" as const, enumValues: ["development", "production"], default: "production", description: "Environment", required: true },
    ],
  });
}

// ─── Helpers ──────────────────────────────────────────────────────

function computeQualityScore(report: AnalysisReport): number {
  let score = 0.5; // Base score

  // Boost for good metrics
  if (report.qualityMetrics.testCoverage !== "none") score += 0.1;
  if (report.qualityMetrics.ciMaturity !== "none") score += 0.1;
  if (report.qualityMetrics.observability !== "none") score += 0.1;
  if (report.qualityMetrics.typeChecking !== "none") score += 0.1;

  // Penalty for critical risks
  const criticalRisks = report.risks.filter((r) => r.severity === "critical");
  score -= criticalRisks.length * 0.1;

  // Penalty for anti-patterns
  const highAntiPatterns = report.patterns.antiPatterns.filter((a) => a.severity === "high" || a.severity === "critical");
  score -= highAntiPatterns.length * 0.05;

  return Math.max(0.1, Math.min(1.0, score));
}

function estimateComplexity(
  serviceCount: number,
  report: AnalysisReport
): "low" | "medium" | "high" {
  if (serviceCount > 4 || report.risks.filter((r) => r.severity === "critical").length > 3) return "high";
  if (serviceCount > 2 || report.risks.length > 5) return "medium";
  return "low";
}
