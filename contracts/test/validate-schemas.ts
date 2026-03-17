/**
 * Contract validation smoke test
 *
 * Validates that all Zod schemas accept well-formed data and reject malformed data.
 * Run: node --import tsx test/validate-schemas.ts
 */

import { randomUUID } from "crypto";
import {
  CodebaseSnapshotSchema,
  AnalysisReportSchema,
  ArchitectureSpecSchema,
  DeploymentManifestSchema,
  DeploymentStateEventSchema,
  TemplatePackageSchema,
} from "../index.js";

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  PASS  ${name}`);
  } catch (err: unknown) {
    failed++;
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`  FAIL  ${name}: ${msg}`);
  }
}

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg);
}

const now = new Date().toISOString();
const sid = randomUUID();
const aid = randomUUID();
const spid = randomUUID();
const mid = randomUUID();

console.log("\n--- @trace/contracts validation ---\n");

// ─── CodebaseSnapshot ─────────────────────────────────────────────

test("CodebaseSnapshot accepts valid data", () => {
  CodebaseSnapshotSchema.parse({
    schemaVersion: "1-0-0",
    snapshotId: sid,
    timestamp: now,
    source: { type: "github", url: "https://github.com/test/repo" },
    packageJson: {
      name: "test-repo",
      dependencies: { express: "^5.0.0" },
      devDependencies: {},
      scripts: { start: "node server.js" },
    },
    fileTree: ["package.json", "server.js", "src/index.ts"],
    selectedFiles: [
      {
        path: "server.js",
        contentHash:
          "a".repeat(64),
        sizeBytes: 1024,
        language: "javascript",
      },
    ],
    dockerPresence: { hasDockerfile: true, hasCompose: false },
    ciPresence: { provider: "github-actions", hasWorkflows: true },
  });
});

test("CodebaseSnapshot rejects missing snapshotId", () => {
  const result = CodebaseSnapshotSchema.safeParse({
    schemaVersion: "1-0-0",
    timestamp: now,
    source: { type: "local" },
    packageJson: { name: "x", dependencies: {}, devDependencies: {}, scripts: {} },
    fileTree: [],
    selectedFiles: [],
    dockerPresence: { hasDockerfile: false, hasCompose: false },
    ciPresence: { hasWorkflows: false },
  });
  assert(!result.success, "Should reject missing snapshotId");
});

test("CodebaseSnapshot rejects wrong schemaVersion", () => {
  const result = CodebaseSnapshotSchema.safeParse({
    schemaVersion: "2-0-0",
    snapshotId: sid,
    timestamp: now,
    source: { type: "local" },
    packageJson: { name: "x", dependencies: {}, devDependencies: {}, scripts: {} },
    fileTree: [],
    selectedFiles: [],
    dockerPresence: { hasDockerfile: false, hasCompose: false },
    ciPresence: { hasWorkflows: false },
  });
  assert(!result.success, "Should reject schemaVersion 2-0-0");
});

// ─── AnalysisReport ───────────────────────────────────────────────

test("AnalysisReport accepts valid data", () => {
  AnalysisReportSchema.parse({
    schemaVersion: "1-0-0",
    snapshotId: sid,
    analysisId: aid,
    timestamp: now,
    stackFingerprint: {
      runtime: ["node"],
      frameworks: ["express", "react"],
      databases: ["postgres"],
      messaging: [],
      containerization: "docker",
      orchestration: "compose",
    },
    patterns: {
      detected: [{ pattern: "monolith", confidence: 0.85, evidence: ["server.js"] }],
      antiPatterns: [
        {
          pattern: "god-file",
          severity: "high",
          location: [{ file: "server.js", description: "All middleware in one file" }],
        },
      ],
    },
    risks: [
      {
        id: "R1",
        category: "security",
        severity: "critical",
        description: "No auth",
        evidence: { file: "server.js" },
      },
    ],
    qualityMetrics: {
      testCoverage: "none",
      ciMaturity: "basic",
      observability: "logging",
      typeChecking: "none",
      dependencyHealth: "current",
    },
  });
});

// ─── ArchitectureSpec ─────────────────────────────────────────────

test("ArchitectureSpec accepts valid data", () => {
  ArchitectureSpecSchema.parse({
    schemaVersion: "1-0-0",
    specId: spid,
    analysisId: aid,
    snapshotId: sid,
    timestamp: now,
    metadata: {
      name: "Compliance API",
      description: "GDPR compliance backend",
      category: "compliance",
      targetStack: ["node", "postgres"],
      estimatedComplexity: "medium",
      qualityScore: 0.85,
    },
    topology: {
      services: [
        { name: "api", image: "node:20", port: 3000, env: { NODE_ENV: "production" } },
        { name: "db", image: "postgres:16", port: 5432 },
      ],
    },
    contracts: [
      { consumer: "api", provider: "db", protocol: "tcp", port: 5432 },
    ],
    parameters: [
      { key: "DB_HOST", type: "string", default: "localhost", description: "Database host", required: true },
    ],
  });
});

test("ArchitectureSpec rejects service name with uppercase", () => {
  const result = ArchitectureSpecSchema.safeParse({
    schemaVersion: "1-0-0",
    specId: spid,
    analysisId: aid,
    snapshotId: sid,
    timestamp: now,
    metadata: {
      name: "Test",
      description: "Test",
      category: "compliance",
      targetStack: [],
      estimatedComplexity: "low",
      qualityScore: 0.5,
    },
    topology: {
      services: [{ name: "MyService", image: "node:20", port: 3000 }],
    },
  });
  assert(!result.success, "Should reject uppercase service name");
});

// ─── DeploymentManifest ───────────────────────────────────────────

test("DeploymentManifest accepts valid data", () => {
  DeploymentManifestSchema.parse({
    schemaVersion: "1-0-0",
    manifestId: mid,
    specId: spid,
    timestamp: now,
    desiredState: {
      services: [
        {
          name: "api",
          containerName: `${mid.slice(0, 8)}-api-3000`,
          image: "node:20",
          ports: [{ host: 8081, container: 3000 }],
          env: { NODE_ENV: "production", DB_HOST: "db" },
          restart: "on-failure",
        },
      ],
    },
    reconciliation: {
      strategy: "restart",
      maxRetries: 5,
      backoffSeconds: 10,
      deadlineSeconds: 300,
    },
  });
});

// ─── DeploymentStateEvent ─────────────────────────────────────────

test("DeploymentStateEvent accepts valid event", () => {
  DeploymentStateEventSchema.parse({
    schemaVersion: "1-0-0",
    manifestId: mid,
    timestamp: now,
    type: "deployed",
    services: [
      { name: "api", status: "running", containerName: "api-8081", port: 8081 },
    ],
  });
});

// ─── Summary ──────────────────────────────────────────────────────

console.log(`\n--- Results: ${passed} passed, ${failed} failed ---\n`);
process.exit(failed > 0 ? 1 : 0);
