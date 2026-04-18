/**
 * Template Matcher — Scores templates against an AnalysisReport
 *
 * Computes a match score for each template in the catalog based on:
 * - Stack overlap (runtime, frameworks, databases)
 * - Category relevance
 * - Risk mitigation potential
 *
 * Returns sorted matches (best first) with scores and reasoning.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { AnalysisReport } from "../../contracts/analysis-proposal/v1/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.resolve(__dirname, "../../templates");

export interface TemplateMatch {
  templateId: string;
  templateName: string;
  category: string;
  matchScore: number;         // 0.0 - 1.0
  reasons: string[];          // Human-readable explanations
  gapAnalysis: string[];      // What the template adds that's missing
}

interface TemplateCatalogEntry {
  templateId: string;
  version: string;
  name: string;
  category: string;
  description: string;
}

interface TemplateDetail {
  templateId: string;
  metadata: { name: string; category: string; tags: string[] };
  topology: { services: { name: string; image: string }[] };
  parameters: { key: string; type: string; required: boolean }[];
}

/**
 * Match all templates against an analysis report.
 * Returns sorted by matchScore descending.
 */
export function matchTemplates(report: AnalysisReport): TemplateMatch[] {
  const catalog = loadCatalog();
  const matches: TemplateMatch[] = [];

  for (const entry of catalog) {
    const detail = loadTemplateDetail(entry.templateId);
    if (!detail) continue;

    const match = scoreTemplate(report, entry, detail);
    matches.push(match);
  }

  return matches.sort((a, b) => b.matchScore - a.matchScore);
}

// ─── Scoring logic ────────────────────────────────────────────────

function scoreTemplate(
  report: AnalysisReport,
  entry: TemplateCatalogEntry,
  detail: TemplateDetail
): TemplateMatch {
  let score = 0;
  const reasons: string[] = [];
  const gaps: string[] = [];

  // Category match: compliance risks → compliance templates
  const complianceRisks = report.risks.filter(
    (r) => r.category === "security" && r.severity === "critical"
  );
  if (complianceRisks.length > 0 && entry.category === "compliance") {
    score += 0.3;
    reasons.push("Critical security risks detected — compliance template addresses auth/validation gaps");
  }

  // Stack overlap: template uses technologies the project already has
  const projectStack = new Set([
    ...report.stackFingerprint.runtime,
    ...report.stackFingerprint.frameworks,
    ...report.stackFingerprint.databases,
  ]);

  const templateImages = detail.topology.services.map((s) => {
    const base = s.image.split(":")[0];
    if (base === "node") return "node";
    if (base === "postgres") return "postgres";
    return base;
  });

  const stackOverlap = templateImages.filter((img) =>
    projectStack.has(img) ||
    (img === "node" && projectStack.has("node")) ||
    (img === "postgres" && projectStack.has("postgres"))
  );

  if (stackOverlap.length > 0) {
    const overlapRatio = stackOverlap.length / templateImages.length;
    score += overlapRatio * 0.25;
    reasons.push(`Stack overlap: ${stackOverlap.join(", ")} already in use`);
  }

  // Missing database → template with DB fills the gap
  if (report.stackFingerprint.databases.length === 0) {
    const templateHasDb = templateImages.some(
      (i) => i === "postgres" || i === "mysql" || i === "mongodb"
    );
    if (templateHasDb) {
      score += 0.2;
      gaps.push("Adds persistent database (currently in-memory only)");
    }
  }

  // Missing observability
  if (report.qualityMetrics.observability === "none" && entry.category === "observability") {
    score += 0.25;
    gaps.push("Adds metrics and structured logging");
  }

  // Missing tests → templates with CI/testing infra
  if (report.qualityMetrics.testCoverage === "none") {
    gaps.push("Consider adding test infrastructure (not included in this template)");
  }

  // Anti-pattern mitigation
  const hasSharedState = report.patterns.antiPatterns.some(
    (a) => a.pattern === "shared-mutable-state"
  );
  if (hasSharedState && templateImages.includes("postgres")) {
    score += 0.15;
    gaps.push("Replaces in-memory state with PostgreSQL persistence");
  }

  // Tag match bonus
  if (detail.metadata.tags) {
    const riskCategories = new Set<string>(report.risks.map((r) => r.category));
    const tagOverlap = detail.metadata.tags.filter(
      (t: string) => riskCategories.has(t) || projectStack.has(t)
    );
    if (tagOverlap.length > 0) {
      score += tagOverlap.length * 0.05;
    }
  }

  return {
    templateId: entry.templateId,
    templateName: entry.name,
    category: entry.category,
    matchScore: Math.min(1.0, score),
    reasons,
    gapAnalysis: gaps,
  };
}

// ─── File loaders ─────────────────────────────────────────────────

function loadCatalog(): TemplateCatalogEntry[] {
  const catalogPath = path.join(TEMPLATES_DIR, "catalog.json");
  try {
    const data = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
    return data.templates || [];
  } catch {
    return [];
  }
}

function loadTemplateDetail(templateId: string): TemplateDetail | null {
  const templatePath = path.join(TEMPLATES_DIR, templateId, "template.json");
  try {
    return JSON.parse(fs.readFileSync(templatePath, "utf8"));
  } catch {
    return null;
  }
}
