/**
 * Contract: Analysis → Arch Proposal
 * Name: AnalysisReport
 * Version: 1-0-0
 *
 * Produced by: Analysis context (stack detection, pattern scanning, risk assessment)
 * Consumed by: Arch Proposal context (template matching, recommendation generation)
 *
 * Traceability: snapshotId links back to Intake; analysisId is this document's identity.
 */

import { z } from "zod";

// ─── Sub-schemas ──────────────────────────────────────────────────

const PatternMatchSchema = z.object({
  pattern: z.string(),
  confidence: z.number().min(0).max(1),
  evidence: z.array(z.string()),
});

const AntiPatternMatchSchema = z.object({
  pattern: z.string(),
  severity: z.enum(["critical", "high", "medium"]),
  location: z.array(
    z.object({
      file: z.string(),
      description: z.string(),
    })
  ),
});

const RiskSchema = z.object({
  id: z.string(),
  category: z.enum([
    "security",
    "scalability",
    "maintainability",
    "observability",
  ]),
  severity: z.enum(["critical", "high", "medium", "low"]),
  description: z.string(),
  evidence: z.object({
    file: z.string(),
    line: z.number().int().positive().optional(),
    snippet: z.string().optional(),
  }),
});

const QualityMetricsSchema = z.object({
  testCoverage: z.enum(["none", "minimal", "moderate", "comprehensive"]),
  ciMaturity: z.enum(["none", "basic", "standard", "advanced"]),
  observability: z.enum(["none", "logging", "metrics", "full"]),
  typeChecking: z.enum(["none", "partial", "full"]),
  dependencyHealth: z.enum(["outdated", "current", "pinned"]),
});

// ─── Main schema ──────────────────────────────────────────────────

export const AnalysisReportSchema = z.object({
  schemaVersion: z.literal("1-0-0"),
  snapshotId: z.string().uuid(),
  analysisId: z.string().uuid(),
  timestamp: z.string().datetime(),

  stackFingerprint: z.object({
    runtime: z.array(
      z.enum(["node", "python", "go", "java", "rust", "dotnet"])
    ),
    frameworks: z.array(z.string()),
    databases: z.array(z.string()),
    messaging: z.array(z.string()),
    containerization: z.enum(["docker", "podman", "none"]),
    orchestration: z.enum(["compose", "kubernetes", "none"]),
  }),

  patterns: z.object({
    detected: z.array(PatternMatchSchema),
    antiPatterns: z.array(AntiPatternMatchSchema),
  }),

  risks: z.array(RiskSchema),

  qualityMetrics: QualityMetricsSchema,
});

// ─── Types ────────────────────────────────────────────────────────

export type AnalysisReport = z.infer<typeof AnalysisReportSchema>;
export type PatternMatch = z.infer<typeof PatternMatchSchema>;
export type AntiPatternMatch = z.infer<typeof AntiPatternMatchSchema>;
export type Risk = z.infer<typeof RiskSchema>;
export type QualityMetrics = z.infer<typeof QualityMetricsSchema>;

// ─── Validation helpers ───────────────────────────────────────────

export function validateAnalysisReport(data: unknown): AnalysisReport {
  return AnalysisReportSchema.parse(data);
}

export function isValidAnalysisReport(data: unknown): data is AnalysisReport {
  return AnalysisReportSchema.safeParse(data).success;
}
