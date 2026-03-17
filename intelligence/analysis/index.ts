/**
 * Analysis Context — Full pipeline: CodebaseSnapshot → AnalysisReport
 *
 * Orchestrates stack detection, pattern scanning, risk assessment, quality scoring.
 * Produces a validated AnalysisReport conforming to the contract schema.
 */

import { randomUUID } from "crypto";
import type { CodebaseSnapshot } from "../../contracts/intake-analysis/v1/index.js";
import {
  AnalysisReportSchema,
  type AnalysisReport,
} from "../../contracts/analysis-proposal/v1/index.js";
import { detectStack } from "./stack-detector.js";
import { detectPatterns, detectAntiPatterns } from "./pattern-scanner.js";
import { assessRisks } from "./risk-assessor.js";
import { scoreQuality } from "./quality-scorer.js";

/**
 * Analyze a CodebaseSnapshot and produce a validated AnalysisReport.
 *
 * @param snapshot - Validated CodebaseSnapshot from Intake
 * @returns Validated AnalysisReport
 * @throws ZodError if the report fails schema validation
 */
export function analyze(snapshot: CodebaseSnapshot): AnalysisReport {
  const stackFingerprint = detectStack(snapshot);
  const patterns = detectPatterns(snapshot);
  const antiPatterns = detectAntiPatterns(snapshot);
  const risks = assessRisks(snapshot);
  const qualityMetrics = scoreQuality(snapshot);

  const report = {
    schemaVersion: "1-0-0" as const,
    snapshotId: snapshot.snapshotId,
    analysisId: randomUUID(),
    timestamp: new Date().toISOString(),
    stackFingerprint,
    patterns: { detected: patterns, antiPatterns },
    risks,
    qualityMetrics,
  };

  // Validate against contract — fail fast
  return AnalysisReportSchema.parse(report);
}

// Re-exports for direct access
export { detectStack } from "./stack-detector.js";
export { detectPatterns, detectAntiPatterns } from "./pattern-scanner.js";
export { assessRisks } from "./risk-assessor.js";
export { scoreQuality } from "./quality-scorer.js";
