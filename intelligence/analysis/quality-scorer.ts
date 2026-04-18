/**
 * Quality Scorer — Computes QualityMetrics from CodebaseSnapshot
 *
 * Deterministic scoring: same snapshot → same metrics (no randomness).
 */

import type { CodebaseSnapshot } from "../../contracts/intake-analysis/v1/index.js";
import type { QualityMetrics } from "../../contracts/analysis-proposal/v1/index.js";

export function scoreQuality(snapshot: CodebaseSnapshot): QualityMetrics {
  const deps = snapshot.packageJson.dependencies;
  const devDeps = snapshot.packageJson.devDependencies;
  const allDeps = { ...deps, ...devDeps };
  const files = snapshot.fileTree;

  return {
    testCoverage: assessTestCoverage(files, allDeps),
    ciMaturity: assessCiMaturity(snapshot),
    observability: assessObservability(allDeps),
    typeChecking: assessTypeChecking(files, allDeps),
    dependencyHealth: assessDependencyHealth(deps),
  };
}

// ─── Sub-assessments ──────────────────────────────────────────────

function assessTestCoverage(
  files: string[],
  deps: Record<string, string>
): QualityMetrics["testCoverage"] {
  const testFiles = files.filter(
    (f) => f.includes(".test.") || f.includes(".spec.") || f.includes("__tests__/")
  );
  const hasTestRunner = ["jest", "vitest", "mocha", "ava", "@testing-library/react"]
    .some((d) => d in deps);

  if (testFiles.length === 0 && !hasTestRunner) return "none";
  if (testFiles.length <= 3) return "minimal";
  if (testFiles.length <= 10) return "moderate";
  return "comprehensive";
}

function assessCiMaturity(snapshot: CodebaseSnapshot): QualityMetrics["ciMaturity"] {
  if (!snapshot.ciPresence.hasWorkflows) return "none";
  if (!snapshot.ciPresence.provider) return "none";

  // Can't inspect workflow content from snapshot alone, so use heuristics
  const files = snapshot.fileTree;
  const hasMultipleWorkflows = files.filter(
    (f) => f.startsWith(".github/workflows/") && (f.endsWith(".yml") || f.endsWith(".yaml"))
  ).length;

  if (hasMultipleWorkflows >= 3) return "advanced";
  if (hasMultipleWorkflows >= 2) return "standard";
  return "basic";
}

function assessObservability(
  deps: Record<string, string>
): QualityMetrics["observability"] {
  const hasLogging = ["winston", "pino", "bunyan", "log4js", "morgan"].some(
    (d) => d in deps
  );
  const hasMetrics = [
    "prom-client", "dd-trace", "@opentelemetry/sdk-node", "newrelic",
  ].some((d) => d in deps);

  if (hasLogging && hasMetrics) return "full";
  if (hasMetrics) return "metrics";
  if (hasLogging) return "logging";
  return "none";
}

function assessTypeChecking(
  files: string[],
  deps: Record<string, string>
): QualityMetrics["typeChecking"] {
  const hasTsConfig = files.some((f) => f.includes("tsconfig"));
  const hasTs = "typescript" in deps;
  const tsFiles = files.filter((f) => f.endsWith(".ts") || f.endsWith(".tsx"));
  const jsFiles = files.filter(
    (f) => f.endsWith(".js") || f.endsWith(".jsx") || f.endsWith(".mjs")
  );

  if (!hasTsConfig && !hasTs) return "none";
  if (tsFiles.length === 0) return "none";
  if (jsFiles.length > tsFiles.length) return "partial";
  return "full";
}

function assessDependencyHealth(
  deps: Record<string, string>
): QualityMetrics["dependencyHealth"] {
  const versions = Object.values(deps);
  const pinned = versions.filter((v) => /^\d+\.\d+\.\d+$/.test(v));
  const ranged = versions.filter((v) => v.startsWith("^") || v.startsWith("~"));

  if (pinned.length > ranged.length) return "pinned";
  return "current"; // Can't determine "outdated" without registry lookup
}
