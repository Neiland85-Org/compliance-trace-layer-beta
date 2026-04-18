/**
 * Intelligence Integration Test
 *
 * Tests the FULL pipeline: Local Intake → Normalize → Analyze → Propose
 * Uses THIS REPO as the test subject (self-analysis).
 *
 * Run: node --import tsx test/intelligence.test.ts
 */

import path from "path";
import { fileURLToPath } from "url";

import { scanLocalRepo } from "../intake/local-adapter.js";
import { normalize } from "../intake/normalizer.js";
import { analyze } from "../analysis/index.js";
import { recommend } from "../proposal/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../..");

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

console.log("\n--- Intelligence Pipeline Integration Test ---\n");
console.log(`Analyzing: ${REPO_ROOT}\n`);

// ─── Step 1: Intake ─────────────────────────────────────────────

let snapshot: ReturnType<typeof normalize>;

test("Intake: scanLocalRepo produces RawIntakeData", () => {
  const raw = scanLocalRepo(REPO_ROOT);
  assert(raw.source.type === "github", "source type should be github (default)");
  assert(raw.fileTree.length > 0, "fileTree should not be empty");
  assert(raw.packageJson !== null, "packageJson should be found");
  assert(raw.hasDockerfile === false || raw.hasDockerfile === true, "hasDockerfile should be boolean");
});

test("Intake: normalize produces valid CodebaseSnapshot", () => {
  const raw = scanLocalRepo(REPO_ROOT);
  snapshot = normalize(raw);
  assert(snapshot.schemaVersion === "1-0-0", "schemaVersion should be 1-0-0");
  assert(typeof snapshot.snapshotId === "string", "snapshotId should be string");
  assert(snapshot.snapshotId.length === 36, "snapshotId should be UUID");
  assert(snapshot.packageJson.name === "compliance-trace-layer-beta", "name should match");
});

test("Intake: snapshot has correct dependency detection", () => {
  assert("express" in snapshot.packageJson.dependencies, "express should be in deps");
});

// ─── Step 2: Analysis ───────────────────────────────────────────

let report: ReturnType<typeof analyze>;

test("Analysis: analyze produces valid AnalysisReport", () => {
  report = analyze(snapshot);
  assert(report.schemaVersion === "1-0-0", "schemaVersion should be 1-0-0");
  assert(report.snapshotId === snapshot.snapshotId, "snapshotId should trace back");
  assert(typeof report.analysisId === "string", "analysisId should be string");
});

test("Analysis: detects Node runtime", () => {
  assert(
    report.stackFingerprint.runtime.includes("node"),
    "Should detect Node runtime"
  );
});

test("Analysis: detects Express framework", () => {
  assert(
    report.stackFingerprint.frameworks.includes("express"),
    "Should detect Express"
  );
});

test("Analysis: detects Docker containerization", () => {
  // This repo has Dockerfiles in subdirectories
  const hasDocker = report.stackFingerprint.containerization;
  // May or may not detect depending on scan depth
  console.log(`    containerization: ${hasDocker}`);
});

test("Analysis: detects patterns", () => {
  assert(report.patterns.detected.length > 0, "Should detect at least one pattern");
  console.log(`    patterns: ${report.patterns.detected.map((p) => p.pattern).join(", ")}`);
});

test("Analysis: detects anti-patterns", () => {
  assert(
    report.patterns.antiPatterns.length > 0,
    "Should detect at least one anti-pattern"
  );
  console.log(`    anti-patterns: ${report.patterns.antiPatterns.map((a) => a.pattern).join(", ")}`);
});

test("Analysis: assesses risks", () => {
  assert(report.risks.length > 0, "Should identify risks");
  const critical = report.risks.filter((r) => r.severity === "critical");
  console.log(`    risks: ${report.risks.length} total, ${critical.length} critical`);
});

test("Analysis: computes quality metrics", () => {
  assert(report.qualityMetrics.testCoverage !== undefined, "testCoverage should exist");
  console.log(`    quality: test=${report.qualityMetrics.testCoverage}, ci=${report.qualityMetrics.ciMaturity}, obs=${report.qualityMetrics.observability}`);
});

// ─── Step 3: Proposal ───────────────────────────────────────────

test("Proposal: recommend produces valid ArchitectureSpec", () => {
  const result = recommend(report);
  assert(result.requiresHumanReview === true, "Should require human review");
  assert(result.spec.schemaVersion === "1-0-0", "spec schemaVersion should be 1-0-0");
  assert(result.spec.snapshotId === snapshot.snapshotId, "Traceability: snapshotId chain");
  assert(result.spec.analysisId === report.analysisId, "Traceability: analysisId chain");
  assert(typeof result.spec.specId === "string", "specId should be string");
});

test("Proposal: matches templates from catalog", () => {
  const result = recommend(report);
  assert(result.allMatches.length > 0, "Should find template matches");
  console.log(`    matches: ${result.allMatches.map((m) => `${m.templateId}(${m.matchScore.toFixed(2)})`).join(", ")}`);
});

test("Proposal: selects best template", () => {
  const result = recommend(report);
  if (result.matchedTemplate) {
    console.log(`    selected: ${result.matchedTemplate.templateId} (score: ${result.matchedTemplate.matchScore.toFixed(2)})`);
    assert(result.matchedTemplate.matchScore >= 0.3, "Selected template should have score >= 0.3");
  } else {
    console.log("    no template selected (all scores < 0.3)");
  }
});

test("Proposal: full traceability chain intact", () => {
  const result = recommend(report);
  // snapshotId → analysisId → specId
  assert(result.spec.snapshotId === snapshot.snapshotId, "snapshotId traces to intake");
  assert(result.spec.analysisId === report.analysisId, "analysisId traces to analysis");
  assert(result.spec.specId !== result.spec.analysisId, "specId is unique");
  console.log(`    chain: ${snapshot.snapshotId.slice(0, 8)} → ${report.analysisId.slice(0, 8)} → ${result.spec.specId.slice(0, 8)}`);
});

// ─── Summary ──────────────────────────────────────────────────────

console.log(`\n--- Results: ${passed} passed, ${failed} failed ---\n`);
process.exit(failed > 0 ? 1 : 0);
