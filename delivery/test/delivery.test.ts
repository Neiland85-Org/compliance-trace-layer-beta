/**
 * Delivery Integration Tests
 *
 * Tests the full delivery pipeline:
 *   template directory → buildPackage → license → envelope → export → verify
 */

import assert from "assert";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.resolve(__dirname, "../../templates");
const TEST_OUTPUT = path.resolve(__dirname, "../../.test-delivery-output");

// ─── Imports ─────────────────────────────────────────────────────

import { buildPackage } from "../packaging/package-builder.js";
import { sha256, hashFile, verifyPackageIntegrity } from "../packaging/integrity.js";
import { collectAssets } from "../packaging/asset-collector.js";
import {
  createLicenseGrant,
  enforceLicense,
  isLicenseExpired,
  getRestrictions,
  hasFeature,
} from "../license/license-manager.js";
import { createEnvelope, verifySeal } from "../license/license-envelope.js";
import { exportAsJson, loadEnvelope } from "../distribution/exporter.js";
import { publishLocal, pullLocal, listLocal } from "../distribution/registry-client.js";

// ─── Test runner ─────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err: any) {
    failed++;
    console.log(`  ✗ ${name}`);
    console.log(`    ${err.message}`);
  }
}

// ─── Cleanup ─────────────────────────────────────────────────────

function cleanup() {
  if (fs.existsSync(TEST_OUTPUT)) {
    fs.rmSync(TEST_OUTPUT, { recursive: true, force: true });
  }
}

// ─── Tests ───────────────────────────────────────────────────────

console.log("\n═══ Delivery Integration Tests ═══\n");

// --- Integrity ---

test("sha256 produces 64-char hex hash", () => {
  const hash = sha256("hello world");
  assert.strictEqual(hash.length, 64);
  assert.match(hash, /^[a-f0-9]{64}$/);
});

test("sha256 is deterministic", () => {
  assert.strictEqual(sha256("test"), sha256("test"));
});

test("sha256 produces different hash for different input", () => {
  assert.notStrictEqual(sha256("a"), sha256("b"));
});

// --- Asset collector ---

test("collectAssets finds files in compliance-api template", () => {
  const templateDir = path.join(TEMPLATES_DIR, "compliance-api");
  const assets = collectAssets(templateDir);
  assert.ok(assets.length >= 3, `Expected ≥3 assets, got ${assets.length}`);

  const types = new Set(assets.map((a) => a.type));
  assert.ok(types.has("config"), "Should have config assets");
});

test("all assets have valid contentHash", () => {
  const templateDir = path.join(TEMPLATES_DIR, "compliance-api");
  const assets = collectAssets(templateDir);
  for (const asset of assets) {
    assert.match(asset.contentHash, /^[a-f0-9]{64}$/, `Invalid hash for ${asset.path}`);
  }
});

// --- Package builder ---

test("buildPackage creates valid TemplatePackage from compliance-api", () => {
  const templateDir = path.join(TEMPLATES_DIR, "compliance-api");
  const result = buildPackage(templateDir, {
    author: "Neil Muñoz Lago",
    licenseTier: "professional",
  });

  assert.ok(result.package, "Should produce a package");
  assert.strictEqual(result.package.schemaVersion, "1-0-0");
  assert.strictEqual(result.package.templateId, "compliance-api");
  assert.strictEqual(result.package.license.type, "professional");
  assert.ok(result.assetCount >= 3, `Expected ≥3 assets, got ${result.assetCount}`);
  assert.ok(result.totalSizeBytes > 0, "Should have non-zero size");
  assert.ok(result.package.customization.presets.length >= 2, "Should have presets");
});

test("buildPackage includes presets from presets/ directory", () => {
  const templateDir = path.join(TEMPLATES_DIR, "compliance-api");
  const result = buildPackage(templateDir);
  const presetNames = result.package.customization.presets.map((p) => p.name);
  assert.ok(presetNames.includes("starter"), "Should include starter preset");
  assert.ok(presetNames.includes("production"), "Should include production preset");
});

test("buildPackage has valid ArchitectureSpec inside", () => {
  const templateDir = path.join(TEMPLATES_DIR, "compliance-api");
  const result = buildPackage(templateDir);
  const spec = result.package.spec;
  assert.ok(spec.specId, "Spec should have specId");
  assert.ok(spec.topology.services.length > 0, "Spec should have services");
  assert.ok(spec.parameters.length > 0, "Spec should have parameters");
});

// --- License manager ---

test("createLicenseGrant with tier=free", () => {
  const grant = createLicenseGrant("free", "test@example.com");
  assert.strictEqual(grant.tier, "free");
  assert.strictEqual(grant.maxServices, 3);
  assert.strictEqual(grant.maxTemplates, 2);
  assert.strictEqual(grant.expiresAt, null);
});

test("createLicenseGrant with expiration", () => {
  const grant = createLicenseGrant("starter", "test@example.com", 30);
  assert.ok(grant.expiresAt, "Should have expiration");
  assert.strictEqual(isLicenseExpired(grant), false);
});

test("enforceLicense detects service limit violation", () => {
  const grant = createLicenseGrant("free", "test@example.com");
  const violations = enforceLicense(grant, 10, 1);
  assert.ok(violations.some((v) => v.rule === "max-services-exceeded"));
});

test("enforceLicense detects feature violation", () => {
  const grant = createLicenseGrant("free", "test@example.com");
  const violations = enforceLicense(grant, 1, 1, ["custom-presets"]);
  assert.ok(violations.some((v) => v.rule === "feature-not-available"));
});

test("enterprise license has no violations for large deployments", () => {
  const grant = createLicenseGrant("enterprise", "corp@example.com");
  const violations = enforceLicense(grant, 100, 100, [
    "custom-presets",
    "parameter-overrides",
    "custom-branding",
    "sla-guarantee",
  ]);
  assert.strictEqual(violations.length, 0);
});

test("getRestrictions returns tier-specific restrictions", () => {
  assert.ok(getRestrictions("free").includes("no-commercial-use"));
  assert.strictEqual(getRestrictions("enterprise").length, 0);
});

// --- License envelope ---

test("createEnvelope + verifySeal round-trip", () => {
  const templateDir = path.join(TEMPLATES_DIR, "compliance-api");
  const { package: pkg } = buildPackage(templateDir);
  const grant = createLicenseGrant("professional", "neil@example.com", 365);
  const envelope = createEnvelope(pkg, grant);

  assert.strictEqual(envelope.envelopeVersion, "1-0-0");
  assert.ok(envelope.envelopeId);
  assert.strictEqual(envelope.license.tier, "professional");

  const sealCheck = verifySeal(envelope);
  assert.strictEqual(sealCheck.valid, true, "Seal should be valid");
});

test("verifySeal detects tampering", () => {
  const templateDir = path.join(TEMPLATES_DIR, "compliance-api");
  const { package: pkg } = buildPackage(templateDir);
  const grant = createLicenseGrant("free", "test@example.com");
  const envelope = createEnvelope(pkg, grant);

  // Tamper with the package
  envelope.package.version = "999.0.0";
  const sealCheck = verifySeal(envelope);
  assert.strictEqual(sealCheck.valid, false, "Seal should be invalid after tampering");
});

// --- Export + reimport ---

test("exportAsJson + loadEnvelope round-trip", () => {
  cleanup();
  const templateDir = path.join(TEMPLATES_DIR, "compliance-api");
  const { package: pkg } = buildPackage(templateDir);
  const grant = createLicenseGrant("starter", "test@example.com");
  const envelope = createEnvelope(pkg, grant);

  const result = exportAsJson(envelope, TEST_OUTPUT);
  assert.ok(fs.existsSync(result.outputPath));
  assert.ok(result.sizeBytes > 0);

  const loaded = loadEnvelope(result.outputPath);
  assert.strictEqual(loaded.envelopeId, envelope.envelopeId);
  assert.strictEqual(loaded.license.tier, "starter");

  const sealCheck = verifySeal(loaded);
  assert.strictEqual(sealCheck.valid, true, "Seal should survive serialization");
  cleanup();
});

// --- Local registry ---

test("publishLocal + pullLocal + listLocal", () => {
  cleanup();
  const registryPath = path.join(TEST_OUTPUT, "registry");
  const templateDir = path.join(TEMPLATES_DIR, "compliance-api");
  const { package: pkg } = buildPackage(templateDir);
  const grant = createLicenseGrant("professional", "neil@example.com");
  const envelope = createEnvelope(pkg, grant);

  // Publish
  const entry = publishLocal(envelope, registryPath);
  assert.strictEqual(entry.templateId, "compliance-api");
  assert.strictEqual(entry.tier, "professional");

  // List
  const catalog = listLocal(registryPath);
  assert.strictEqual(catalog.length, 1);

  // Pull
  const pulled = pullLocal(registryPath, "compliance-api", "1.0.0", "professional");
  assert.ok(pulled, "Should find published package");
  assert.strictEqual(pulled!.envelopeId, envelope.envelopeId);

  const sealCheck = verifySeal(pulled!);
  assert.strictEqual(sealCheck.valid, true, "Seal should survive registry round-trip");

  cleanup();
});

// --- Summary ─────────────────────────────────────────────────────

console.log(`\n  Results: ${passed} passed, ${failed} failed, ${passed + failed} total\n`);

if (failed > 0) {
  process.exit(1);
}
