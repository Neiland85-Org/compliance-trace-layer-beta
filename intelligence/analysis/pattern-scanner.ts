/**
 * Pattern Scanner — Detects architectural patterns and anti-patterns
 *
 * Operates on CodebaseSnapshot (file tree + package.json).
 * Uses heuristic rules: file naming conventions, dependency combinations,
 * directory structure patterns.
 */

import type { CodebaseSnapshot } from "../../contracts/intake-analysis/v1/index.js";
import type { PatternMatch, AntiPatternMatch } from "../../contracts/analysis-proposal/v1/index.js";

// ─── Pattern detection ────────────────────────────────────────────

export function detectPatterns(snapshot: CodebaseSnapshot): PatternMatch[] {
  const patterns: PatternMatch[] = [];
  const files = snapshot.fileTree;
  const deps = {
    ...snapshot.packageJson.dependencies,
    ...snapshot.packageJson.devDependencies,
  };

  // Monolith detection
  const hasMultipleEntryPoints = files.filter(
    (f) => f.endsWith("server.js") || f.endsWith("server.ts") || f.endsWith("index.ts")
  );
  const hasSrcDir = files.some((f) => f.startsWith("src/"));
  if (hasMultipleEntryPoints.length <= 2 && hasSrcDir) {
    patterns.push({
      pattern: "monolith",
      confidence: 0.7,
      evidence: hasMultipleEntryPoints,
    });
  }

  // Microservices detection
  const servicesDirs = files.filter(
    (f) =>
      (f.includes("/services/") || f.includes("/microservices/")) &&
      (f.endsWith("server.js") || f.endsWith("server.ts") || f.endsWith("Dockerfile"))
  );
  const hasComposeWithMultipleServices =
    snapshot.dockerPresence.hasCompose &&
    (snapshot.dockerPresence.composeServices?.length || 0) > 2;

  if (servicesDirs.length > 2 || hasComposeWithMultipleServices) {
    patterns.push({
      pattern: "microservices",
      confidence: Math.min(0.9, 0.4 + servicesDirs.length * 0.1),
      evidence: servicesDirs,
    });
  }

  // Modular monolith detection
  const modulePatterns = files.filter(
    (f) => f.match(/^(src\/)?modules\/[^/]+\/(index|module)\.(ts|js)$/)
  );
  if (modulePatterns.length > 1) {
    patterns.push({
      pattern: "modular-monolith",
      confidence: 0.6 + modulePatterns.length * 0.05,
      evidence: modulePatterns,
    });
  }

  // Event-driven detection
  const eventDeps = ["nats", "kafkajs", "amqplib", "bullmq", "@aws-sdk/client-sqs"];
  const hasEventDeps = eventDeps.filter((d) => d in deps);
  const hasEventFiles = files.filter(
    (f) => f.includes("event") || f.includes("handler") || f.includes("subscriber")
  );
  if (hasEventDeps.length > 0 || hasEventFiles.length > 2) {
    patterns.push({
      pattern: "event-driven",
      confidence: hasEventDeps.length > 0 ? 0.8 : 0.5,
      evidence: [...hasEventDeps, ...hasEventFiles.slice(0, 5)],
    });
  }

  // API-first detection
  const hasOpenAPI = files.some(
    (f) => f.includes("openapi") || f.includes("swagger") || f.endsWith(".api.yml")
  );
  const hasApiRoutes = files.filter(
    (f) => f.includes("routes/") || f.includes("api/") || f.includes("controllers/")
  );
  if (hasOpenAPI || hasApiRoutes.length > 3) {
    patterns.push({
      pattern: "api-first",
      confidence: hasOpenAPI ? 0.85 : 0.6,
      evidence: hasOpenAPI ? ["openapi spec found"] : hasApiRoutes.slice(0, 5),
    });
  }

  return patterns;
}

// ─── Anti-pattern detection ───────────────────────────────────────

export function detectAntiPatterns(snapshot: CodebaseSnapshot): AntiPatternMatch[] {
  const antiPatterns: AntiPatternMatch[] = [];
  const files = snapshot.fileTree;
  const deps = snapshot.packageJson.dependencies;
  const devDeps = snapshot.packageJson.devDependencies;

  // God file: server.js with multiple concerns
  const serverFiles = files.filter(
    (f) => f.endsWith("server.js") || f.endsWith("server.ts")
  );
  if (serverFiles.length > 0) {
    antiPatterns.push({
      pattern: "god-file-risk",
      severity: "medium",
      location: serverFiles.map((f) => ({
        file: f,
        description: "Server file likely contains mixed concerns (routing + middleware + business logic)",
      })),
    });
  }

  // Shared mutable state: no state management
  const hasNoStateLib = !deps.redis && !deps.ioredis && !deps["better-sqlite3"] && !deps.pg;
  const hasMultipleWritePoints = files.filter(
    (f) => f.includes("registry") || f.includes("store") || f.includes("state")
  );
  if (hasNoStateLib && hasMultipleWritePoints.length > 1) {
    antiPatterns.push({
      pattern: "shared-mutable-state",
      severity: "high",
      location: hasMultipleWritePoints.map((f) => ({
        file: f,
        description: "State management file without persistent backing store",
      })),
    });
  }

  // Missing tests
  const testFiles = files.filter(
    (f) =>
      f.includes(".test.") ||
      f.includes(".spec.") ||
      f.includes("__tests__") ||
      f.startsWith("test/")
  );
  if (testFiles.length === 0) {
    antiPatterns.push({
      pattern: "no-tests",
      severity: "high",
      location: [
        {
          file: "package.json",
          description: "Zero test files detected in entire project",
        },
      ],
    });
  }

  // Stringly-typed config: hardcoded URLs/ports
  const configFiles = files.filter(
    (f) => f.endsWith(".env.example") || f.endsWith("config.js") || f.endsWith("config.ts")
  );
  if (configFiles.length === 0 && files.length > 10) {
    antiPatterns.push({
      pattern: "missing-config-layer",
      severity: "medium",
      location: [
        {
          file: "package.json",
          description: "No configuration files found — likely hardcoded values",
        },
      ],
    });
  }

  // Duplicate code: same filename in multiple directories
  const fileNames = files.map((f) => f.split("/").pop() || "");
  const counts: Record<string, string[]> = {};
  files.forEach((f) => {
    const name = f.split("/").pop() || "";
    if (name === "index.ts" || name === "index.js" || name === "package.json") return;
    if (!counts[name]) counts[name] = [];
    counts[name].push(f);
  });

  const duplicates = Object.entries(counts).filter(([_, paths]) => paths.length > 2);
  if (duplicates.length > 0) {
    antiPatterns.push({
      pattern: "code-duplication",
      severity: "medium",
      location: duplicates.slice(0, 5).map(([name, paths]) => ({
        file: paths[0],
        description: `"${name}" appears in ${paths.length} locations: ${paths.slice(0, 3).join(", ")}`,
      })),
    });
  }

  // Missing type checking
  const hasTypeScript = files.some(
    (f) => f.endsWith(".ts") || f.endsWith(".tsx")
  );
  const hasTsConfig = files.some(
    (f) => f.includes("tsconfig")
  );
  if (!hasTypeScript && !devDeps.typescript && Object.keys(deps).length > 5) {
    antiPatterns.push({
      pattern: "no-type-checking",
      severity: "medium",
      location: [
        {
          file: "package.json",
          description: "No TypeScript detected in project with significant dependencies",
        },
      ],
    });
  }

  return antiPatterns;
}
