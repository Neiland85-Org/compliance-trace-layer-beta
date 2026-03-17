/**
 * Risk Assessor — Security, scalability, maintainability, observability risk analysis
 *
 * Generates typed Risk[] from a CodebaseSnapshot.
 * Each risk has concrete evidence (file + description), not generic advice.
 */

import type { CodebaseSnapshot } from "../../contracts/intake-analysis/v1/index.js";
import type { Risk } from "../../contracts/analysis-proposal/v1/index.js";

export function assessRisks(snapshot: CodebaseSnapshot): Risk[] {
  const risks: Risk[] = [];
  const deps = snapshot.packageJson.dependencies;
  const devDeps = snapshot.packageJson.devDependencies;
  const allDeps = { ...deps, ...devDeps };
  const files = snapshot.fileTree;

  let riskId = 0;
  const addRisk = (
    category: Risk["category"],
    severity: Risk["severity"],
    description: string,
    file: string,
    line?: number,
    snippet?: string
  ) => {
    risks.push({
      id: `R${++riskId}`,
      category,
      severity,
      description,
      evidence: { file, line, snippet },
    });
  };

  // ─── Security risks ───────────────────────────────────────────

  // No auth library
  const authLibs = ["passport", "jsonwebtoken", "jose", "@auth/core", "next-auth", "lucia"];
  if (!authLibs.some((l) => l in allDeps)) {
    addRisk(
      "security", "critical",
      "No authentication library detected. APIs are likely unprotected.",
      "package.json"
    );
  }

  // No validation library
  const validationLibs = ["zod", "joi", "yup", "class-validator", "ajv"];
  if (!validationLibs.some((l) => l in allDeps)) {
    addRisk(
      "security", "high",
      "No input validation library detected. Risk of injection and malformed data.",
      "package.json"
    );
  }

  // No helmet/security headers
  if (!("helmet" in allDeps)) {
    addRisk(
      "security", "medium",
      "No helmet dependency — HTTP security headers likely missing.",
      "package.json"
    );
  }

  // ─── Scalability risks ────────────────────────────────────────

  // In-memory state without persistent store
  const hasPersistence = ["pg", "mysql2", "mongodb", "mongoose", "better-sqlite3", "redis", "ioredis"]
    .some((d) => d in deps);
  if (!hasPersistence && Object.keys(deps).length > 3) {
    addRisk(
      "scalability", "high",
      "No persistent data store detected. State is likely in-memory and lost on restart.",
      "package.json"
    );
  }

  // No caching layer
  const hasCaching = ["redis", "ioredis", "node-cache", "lru-cache", "@upstash/redis"]
    .some((d) => d in deps);
  if (!hasCaching && files.length > 20) {
    addRisk(
      "scalability", "low",
      "No caching library detected. Performance may degrade under load.",
      "package.json"
    );
  }

  // ─── Maintainability risks ────────────────────────────────────

  // No tests
  const testFiles = files.filter(
    (f) => f.includes(".test.") || f.includes(".spec.") || f.includes("__tests__")
  );
  if (testFiles.length === 0) {
    addRisk(
      "maintainability", "high",
      "Zero test files found. No regression safety net.",
      "package.json"
    );
  }

  // No linter
  const hasLinter = files.some(
    (f) => f.includes("eslint") || f.includes(".prettierrc") || f.includes("biome")
  ) || "eslint" in allDeps || "biome" in allDeps;
  if (!hasLinter) {
    addRisk(
      "maintainability", "medium",
      "No linter configuration detected. Code style inconsistency likely.",
      "package.json"
    );
  }

  // Outdated Node version
  const engines = snapshot.packageJson.engines;
  if (engines?.node) {
    const match = engines.node.match(/(\d+)/);
    if (match && parseInt(match[1]) < 18) {
      addRisk(
        "maintainability", "medium",
        `Node engine requirement (${engines.node}) is below LTS. Security patches may be missing.`,
        "package.json"
      );
    }
  }

  // Too many root-level files (project organization)
  const rootFiles = files.filter((f) => !f.includes("/"));
  if (rootFiles.length > 15) {
    addRisk(
      "maintainability", "low",
      `${rootFiles.length} files at project root. Consider organizing into directories.`,
      ".",
      undefined,
      rootFiles.slice(0, 10).join(", ")
    );
  }

  // ─── Observability risks ──────────────────────────────────────

  // No logging library
  const logLibs = ["winston", "pino", "bunyan", "log4js", "morgan"];
  if (!logLibs.some((l) => l in allDeps)) {
    addRisk(
      "observability", "medium",
      "No structured logging library detected. Using console.log is not production-ready.",
      "package.json"
    );
  }

  // No metrics/monitoring
  const metricsLibs = ["prom-client", "dd-trace", "@opentelemetry/sdk-node", "newrelic"];
  if (!metricsLibs.some((l) => l in allDeps)) {
    addRisk(
      "observability", "medium",
      "No metrics/APM library detected. No visibility into runtime performance.",
      "package.json"
    );
  }

  // No health check endpoint indicator
  const hasHealthFile = files.some(
    (f) => f.includes("health") || f.includes("readiness") || f.includes("liveness")
  );
  if (!hasHealthFile && snapshot.dockerPresence.hasDockerfile) {
    addRisk(
      "observability", "medium",
      "Dockerfile present but no health check endpoint detected.",
      "Dockerfile"
    );
  }

  return risks;
}
