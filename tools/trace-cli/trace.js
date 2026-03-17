#!/usr/bin/env node

/**
 * Trace CLI — Unified pipeline interface
 *
 * Commands:
 *   trace intake <path|url>     Scan a codebase and produce a CodebaseSnapshot
 *   trace analyze <snapshot>    Analyze a snapshot and produce an AnalysisReport
 *   trace propose <report>      Generate an architecture recommendation
 *   trace pipeline <path|url>   Run intake → analyze → propose in one step
 *   trace deliver <template-id> Package + license + export a template
 *   trace templates             List available templates
 *   trace services              List deployed services (via engine API)
 *   trace health                Check engine health
 *
 * Flags:
 *   --output, -o <dir>   Output directory (default: .trace-output/)
 *   --template <id>      Force a specific template in propose
 *   --tier <tier>         License tier for deliver (free|starter|professional|enterprise)
 *   --licensee <email>    Licensee email for deliver
 *   --format <json|text> Output format (default: text)
 *   --engine <url>       Engine API URL (default: http://localhost:4010)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

// ─── Argument parsing ────────────────────────────────────────────

const args = process.argv.slice(2);
const command = args[0];
const target = args[1];

function getFlag(name, fallback) {
  const idx = args.indexOf(`--${name}`);
  if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  // Short aliases
  const shorts = { output: "-o", format: "-f", template: "-t", engine: "-e" };
  if (shorts[name]) {
    const si = args.indexOf(shorts[name]);
    if (si !== -1 && args[si + 1]) return args[si + 1];
  }
  return fallback;
}

const OUTPUT_DIR = path.resolve(getFlag("output", ".trace-output"));
const FORMAT = getFlag("format", "text");
const ENGINE_URL = getFlag("engine", process.env.TRACE_ENGINE_URL || "http://localhost:4010");
const FORCE_TEMPLATE = getFlag("template", undefined);
const LICENSE_TIER = getFlag("tier", "free");
const LICENSEE = getFlag("licensee", "unlicensed@local");

// ─── Helpers ─────────────────────────────────────────────────────

function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

function writeResult(filename, data) {
  ensureOutputDir();
  const filePath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  return filePath;
}

function loadJson(filePath) {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    console.error(`[error] File not found: ${resolved}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(resolved, "utf8"));
}

function printHeader(title) {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${"═".repeat(60)}\n`);
}

function printJson(data) {
  console.log(JSON.stringify(data, null, 2));
}

function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

// ─── Dynamic imports (lazy-loaded to avoid startup cost) ─────────

async function loadIntake() {
  const { scanLocalRepo, hashFile, detectLanguage } = await import(
    `${ROOT}/intelligence/intake/local-adapter.js`
  );
  const { normalize } = await import(
    `${ROOT}/intelligence/intake/normalizer.js`
  );
  const { fetchGitHubRepo } = await import(
    `${ROOT}/intelligence/intake/github-adapter.js`
  );
  return { scanLocalRepo, hashFile, detectLanguage, normalize, fetchGitHubRepo };
}

async function loadAnalysis() {
  const { analyze } = await import(`${ROOT}/intelligence/analysis/index.js`);
  return { analyze };
}

async function loadProposal() {
  const { matchTemplates } = await import(
    `${ROOT}/intelligence/proposal/template-matcher.js`
  );
  const { recommend } = await import(
    `${ROOT}/intelligence/proposal/recommendation-engine.js`
  );
  return { matchTemplates, recommend };
}

async function loadDelivery() {
  const { buildPackage } = await import(`${ROOT}/delivery/packaging/package-builder.js`);
  const { createLicenseGrant, enforceLicense, getRestrictions } = await import(
    `${ROOT}/delivery/license/license-manager.js`
  );
  const { createEnvelope, verifySeal } = await import(
    `${ROOT}/delivery/license/license-envelope.js`
  );
  const { exportAsJson } = await import(`${ROOT}/delivery/distribution/exporter.js`);
  const { publishLocal } = await import(`${ROOT}/delivery/distribution/registry-client.js`);
  return { buildPackage, createLicenseGrant, enforceLicense, getRestrictions, createEnvelope, verifySeal, exportAsJson, publishLocal };
}

// ─── Commands ────────────────────────────────────────────────────

async function cmdIntake(targetPath) {
  if (!targetPath) {
    console.error("Usage: trace intake <path|github-url>");
    process.exit(1);
  }

  printHeader("INTAKE — Codebase Scan");
  const start = Date.now();

  const isUrl = targetPath.startsWith("http://") || targetPath.startsWith("https://");

  const intake = await loadIntake();
  let rawData;

  if (isUrl) {
    console.log(`[intake] Fetching from GitHub: ${targetPath}`);
    const ghToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
    rawData = await intake.fetchGitHubRepo(targetPath, ghToken);
  } else {
    const resolved = path.resolve(targetPath);
    console.log(`[intake] Scanning local path: ${resolved}`);
    rawData = intake.scanLocalRepo(resolved);
  }

  console.log(`[intake] Normalizing to CodebaseSnapshot...`);
  const snapshot = intake.normalize(rawData, {
    source: isUrl
      ? { type: "github", url: targetPath }
      : { type: "local" },
  });

  const elapsed = Date.now() - start;
  const outPath = writeResult(`snapshot-${snapshot.snapshotId}.json`, snapshot);

  if (FORMAT === "json") {
    printJson(snapshot);
  } else {
    console.log(`[intake] Snapshot ID:   ${snapshot.snapshotId}`);
    console.log(`[intake] Files scanned: ${snapshot.fileTree.length}`);
    console.log(`[intake] Selected:      ${snapshot.selectedFiles.length} files`);
    console.log(`[intake] Docker:        ${snapshot.dockerPresence.hasDockerfile ? "yes" : "no"}`);
    console.log(`[intake] CI:            ${snapshot.ciPresence.hasWorkflows ? snapshot.ciPresence.provider : "none"}`);
    console.log(`[intake] Duration:      ${formatDuration(elapsed)}`);
    console.log(`[intake] Output:        ${outPath}`);
  }

  return snapshot;
}

async function cmdAnalyze(snapshotPath) {
  if (!snapshotPath) {
    console.error("Usage: trace analyze <snapshot-file.json>");
    process.exit(1);
  }

  printHeader("ANALYSIS — Pattern & Risk Assessment");
  const start = Date.now();

  const snapshot = loadJson(snapshotPath);
  const { analyze } = await loadAnalysis();

  console.log(`[analysis] Analyzing snapshot ${snapshot.snapshotId}...`);
  const report = analyze(snapshot);

  const elapsed = Date.now() - start;
  const outPath = writeResult(`report-${report.analysisId}.json`, report);

  if (FORMAT === "json") {
    printJson(report);
  } else {
    console.log(`[analysis] Analysis ID:    ${report.analysisId}`);
    console.log(`[analysis] Runtime:        ${report.stackFingerprint.runtime.join(", ") || "none"}`);
    console.log(`[analysis] Frameworks:     ${report.stackFingerprint.frameworks.join(", ") || "none"}`);
    console.log(`[analysis] Databases:      ${report.stackFingerprint.databases.join(", ") || "none"}`);
    console.log(`[analysis] Patterns:       ${report.patterns.detected.map((p) => p.pattern).join(", ")}`);
    console.log(`[analysis] Anti-patterns:  ${report.patterns.antiPatterns.length}`);
    console.log(`[analysis] Risks:          ${report.risks.length} (${report.risks.filter((r) => r.severity === "critical").length} critical)`);
    console.log(`[analysis] Test coverage:  ${report.qualityMetrics.testCoverage}`);
    console.log(`[analysis] CI maturity:    ${report.qualityMetrics.ciMaturity}`);
    console.log(`[analysis] Duration:       ${formatDuration(elapsed)}`);
    console.log(`[analysis] Output:         ${outPath}`);
  }

  return report;
}

async function cmdPropose(reportPath) {
  if (!reportPath) {
    console.error("Usage: trace propose <report-file.json>");
    process.exit(1);
  }

  printHeader("PROPOSAL — Architecture Recommendation");
  const start = Date.now();

  const report = loadJson(reportPath);
  const { recommend } = await loadProposal();

  console.log(`[propose] Generating recommendation for analysis ${report.analysisId}...`);
  const result = recommend(report, FORCE_TEMPLATE);

  const elapsed = Date.now() - start;
  const outPath = writeResult(`proposal-${result.spec.specId}.json`, result);

  if (FORMAT === "json") {
    printJson(result);
  } else {
    console.log(`[propose] Spec ID:         ${result.spec.specId}`);
    console.log(`[propose] Architecture:    ${result.spec.metadata.name}`);
    console.log(`[propose] Category:        ${result.spec.metadata.category}`);
    console.log(`[propose] Complexity:      ${result.spec.metadata.estimatedComplexity}`);
    console.log(`[propose] Quality score:   ${result.spec.metadata.qualityScore.toFixed(2)}`);
    console.log(`[propose] Services:        ${result.spec.topology.services.map((s) => s.name).join(", ")}`);

    if (result.matchedTemplate) {
      console.log(`[propose] Template:        ${result.matchedTemplate.templateName} (${result.matchedTemplate.matchScore.toFixed(2)})`);
    } else {
      console.log(`[propose] Template:        none (built from scratch)`);
    }

    console.log(`[propose] Human review:    REQUIRED`);
    console.log(`[propose] Duration:        ${formatDuration(elapsed)}`);
    console.log(`[propose] Output:          ${outPath}`);

    if (result.allMatches.length > 0) {
      console.log(`\n  Template matches:`);
      for (const m of result.allMatches.slice(0, 5)) {
        const bar = "█".repeat(Math.round(m.matchScore * 20)).padEnd(20, "░");
        console.log(`    ${bar} ${(m.matchScore * 100).toFixed(0).padStart(3)}% ${m.templateName}`);
      }
    }
  }

  return result;
}

async function cmdPipeline(targetPath) {
  if (!targetPath) {
    console.error("Usage: trace pipeline <path|github-url>");
    process.exit(1);
  }

  printHeader("FULL PIPELINE — Intake → Analysis → Proposal");
  const pipelineStart = Date.now();

  // Step 1: Intake
  const snapshot = await cmdIntake(targetPath);

  // Step 2: Analyze (pass snapshot directly, not from file)
  console.log("");
  printHeader("ANALYSIS — Pattern & Risk Assessment");
  const analysisStart = Date.now();

  const { analyze } = await loadAnalysis();
  console.log(`[analysis] Analyzing snapshot ${snapshot.snapshotId}...`);
  const report = analyze(snapshot);

  const reportPath = writeResult(`report-${report.analysisId}.json`, report);
  console.log(`[analysis] Analysis ID:    ${report.analysisId}`);
  console.log(`[analysis] Risks:          ${report.risks.length} (${report.risks.filter((r) => r.severity === "critical").length} critical)`);
  console.log(`[analysis] Duration:       ${formatDuration(Date.now() - analysisStart)}`);
  console.log(`[analysis] Output:         ${reportPath}`);

  // Step 3: Propose (pass report directly, not from file)
  console.log("");
  printHeader("PROPOSAL — Architecture Recommendation");
  const proposeStart = Date.now();

  const { recommend } = await loadProposal();
  console.log(`[propose] Generating recommendation...`);
  const result = recommend(report, FORCE_TEMPLATE);

  const proposalPath = writeResult(`proposal-${result.spec.specId}.json`, result);
  console.log(`[propose] Spec ID:         ${result.spec.specId}`);
  console.log(`[propose] Architecture:    ${result.spec.metadata.name}`);
  console.log(`[propose] Human review:    REQUIRED`);
  console.log(`[propose] Duration:        ${formatDuration(Date.now() - proposeStart)}`);
  console.log(`[propose] Output:          ${proposalPath}`);

  // Summary
  const totalElapsed = Date.now() - pipelineStart;
  printHeader("PIPELINE COMPLETE");
  console.log(`  Traceability chain:`);
  console.log(`    snapshotId  → ${snapshot.snapshotId}`);
  console.log(`    analysisId  → ${report.analysisId}`);
  console.log(`    specId      → ${result.spec.specId}`);
  console.log(`  Total duration: ${formatDuration(totalElapsed)}`);
  console.log(`  Output dir:     ${OUTPUT_DIR}`);
  console.log(`  Next step:      Review proposal, then deploy via engine API\n`);
}

async function cmdDeliver(templateId) {
  if (!templateId) {
    console.error("Usage: trace deliver <template-id> [--tier free|starter|professional|enterprise] [--licensee email]");
    process.exit(1);
  }

  printHeader("DELIVER — Package + License + Export");
  const start = Date.now();

  const templateDir = path.join(ROOT, "templates", templateId);
  if (!fs.existsSync(templateDir)) {
    console.error(`[error] Template directory not found: ${templateDir}`);
    console.error(`  Available templates: ${fs.readdirSync(path.join(ROOT, "templates")).filter(d => !d.endsWith(".json")).join(", ")}`);
    process.exit(1);
  }

  const delivery = await loadDelivery();

  // Step 1: Build package
  console.log(`[deliver] Building package from templates/${templateId}/...`);
  const { package: pkg, warnings, assetCount, totalSizeBytes } = delivery.buildPackage(templateDir, {
    licenseTier: LICENSE_TIER,
    author: "Neil Muñoz Lago",
  });

  if (warnings.length > 0) {
    for (const w of warnings) console.log(`[deliver] ⚠ ${w}`);
  }

  console.log(`[deliver] Package built: ${assetCount} assets, ${(totalSizeBytes / 1024).toFixed(1)}KB`);

  // Step 2: Create license grant
  console.log(`[deliver] Creating ${LICENSE_TIER} license for ${LICENSEE}...`);
  const grant = delivery.createLicenseGrant(LICENSE_TIER, LICENSEE, LICENSE_TIER === "free" ? undefined : 365);

  // Step 3: Enforce license
  const serviceCount = pkg.spec.topology.services.length;
  const violations = delivery.enforceLicense(grant, serviceCount, 1);
  if (violations.some(v => v.severity === "blocking")) {
    console.error(`[deliver] License violations detected:`);
    for (const v of violations) {
      console.error(`  [${v.severity}] ${v.rule}: ${v.detail}`);
    }
    process.exit(1);
  }
  if (violations.length > 0) {
    for (const v of violations) {
      console.log(`[deliver] ⚠ ${v.rule}: ${v.detail}`);
    }
  }

  // Step 4: Create envelope with integrity seal
  console.log(`[deliver] Sealing envelope...`);
  const envelope = delivery.createEnvelope(pkg, grant);

  // Step 5: Verify seal immediately
  const sealCheck = delivery.verifySeal(envelope);
  if (!sealCheck.valid) {
    console.error(`[deliver] FATAL: Seal verification failed immediately after creation`);
    process.exit(1);
  }
  console.log(`[deliver] Seal verified: ${sealCheck.expected.substring(0, 16)}...`);

  // Step 6: Export
  const exportDir = path.join(OUTPUT_DIR, "packages");
  const result = delivery.exportAsJson(envelope, exportDir);

  const elapsed = Date.now() - start;

  if (FORMAT === "json") {
    printJson({
      envelopeId: envelope.envelopeId,
      templateId: pkg.templateId,
      version: pkg.version,
      tier: LICENSE_TIER,
      licensee: LICENSEE,
      assets: assetCount,
      sealHash: envelope.seal.contentHash,
      outputPath: result.outputPath,
      sizeBytes: result.sizeBytes,
    });
  } else {
    console.log(`[deliver] ────────────────────────────────`);
    console.log(`[deliver] Envelope ID:    ${envelope.envelopeId}`);
    console.log(`[deliver] Template:       ${pkg.templateId} v${pkg.version}`);
    console.log(`[deliver] License:        ${LICENSE_TIER} → ${LICENSEE}`);
    console.log(`[deliver] Restrictions:   ${delivery.getRestrictions(LICENSE_TIER).join(", ") || "none"}`);
    console.log(`[deliver] Services:       ${serviceCount}`);
    console.log(`[deliver] Assets:         ${assetCount}`);
    console.log(`[deliver] Presets:        ${pkg.customization.presets.map(p => p.name).join(", ") || "none"}`);
    console.log(`[deliver] Seal:           sha256:${envelope.seal.contentHash.substring(0, 32)}...`);
    console.log(`[deliver] Size:           ${(result.sizeBytes / 1024).toFixed(1)}KB`);
    console.log(`[deliver] Output:         ${result.outputPath}`);
    console.log(`[deliver] Duration:       ${formatDuration(elapsed)}`);
    console.log(`[deliver] Status:         READY FOR DISTRIBUTION`);
  }

  return envelope;
}

async function cmdPublish(envelopePath) {
  if (!envelopePath) {
    console.error("Usage: trace publish <envelope.trace.json>");
    console.error("  Or:  trace publish <template-id> [--tier free|starter|professional|enterprise]");
    process.exit(1);
  }

  printHeader("PUBLISH — Registry Upload");
  const start = Date.now();

  const delivery = await loadDelivery();
  const registryPath = path.join(ROOT, ".trace-registry");

  let envelope;

  // If it's a file path, load the envelope directly
  if (fs.existsSync(path.resolve(envelopePath))) {
    console.log(`[publish] Loading envelope from ${envelopePath}...`);
    const { loadEnvelope } = await import(`${ROOT}/delivery/distribution/exporter.js`);
    envelope = loadEnvelope(path.resolve(envelopePath));
  } else {
    // Treat as template-id: build → license → seal on the fly
    console.log(`[publish] Building package for ${envelopePath}...`);
    const templateDir = path.join(ROOT, "templates", envelopePath);
    if (!fs.existsSync(templateDir)) {
      console.error(`[error] Template not found: ${envelopePath}`);
      process.exit(1);
    }
    const { package: pkg } = delivery.buildPackage(templateDir, {
      licenseTier: LICENSE_TIER,
      author: "Neil Muñoz Lago",
    });
    const grant = delivery.createLicenseGrant(LICENSE_TIER, LICENSEE, LICENSE_TIER === "free" ? undefined : 365);
    envelope = delivery.createEnvelope(pkg, grant);
  }

  // Verify seal before publishing
  const sealCheck = delivery.verifySeal(envelope);
  if (!sealCheck.valid) {
    console.error("[publish] FATAL: Seal verification failed — envelope may be tampered");
    process.exit(1);
  }
  console.log(`[publish] Seal verified`);

  // Publish to local registry
  const entry = delivery.publishLocal(envelope, registryPath);

  const elapsed = Date.now() - start;

  if (FORMAT === "json") {
    printJson(entry);
  } else {
    console.log(`[publish] ────────────────────────────────`);
    console.log(`[publish] Template:     ${entry.templateId}`);
    console.log(`[publish] Version:      ${entry.version}`);
    console.log(`[publish] Tier:         ${entry.tier}`);
    console.log(`[publish] Registry:     ${registryPath}`);
    console.log(`[publish] Published at: ${entry.publishedAt}`);
    console.log(`[publish] Duration:     ${formatDuration(elapsed)}`);
  }

  return entry;
}

async function cmdTemplates() {
  printHeader("TEMPLATES — Available Architecture Templates");

  const catalogPath = path.join(ROOT, "templates", "catalog.json");
  if (!fs.existsSync(catalogPath)) {
    console.error("[error] templates/catalog.json not found");
    process.exit(1);
  }

  const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));

  if (FORMAT === "json") {
    printJson(catalog);
  } else {
    console.log(`  Found ${catalog.templates.length} templates:\n`);
    for (const t of catalog.templates) {
      console.log(`  ┌─ ${t.name} (${t.templateId})`);
      console.log(`  │  Category: ${t.category}`);
      console.log(`  │  Version:  ${t.version}`);
      console.log(`  └─ ${t.description}\n`);
    }
  }
}

async function cmdServices() {
  printHeader("SERVICES — Deployed via Engine");

  try {
    const res = await fetch(`${ENGINE_URL}/services`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const services = await res.json();

    if (FORMAT === "json") {
      printJson(services);
    } else if (services.length === 0) {
      console.log("  No services deployed.\n");
    } else {
      for (const s of services) {
        const status = s.status === "running" ? "●" : s.status === "error" ? "✖" : "○";
        console.log(`  ${status} ${s.name.padEnd(25)} ${s.image.padEnd(20)} :${s.hostPort}  [${s.status}]`);
      }
      console.log(`\n  Total: ${services.length} services\n`);
    }
  } catch (err) {
    console.error(`[error] Cannot reach engine at ${ENGINE_URL}: ${err.message}`);
    console.error("  Is the engine running? Start with: npm run engine");
    process.exit(1);
  }
}

async function cmdHealth() {
  try {
    const res = await fetch(`${ENGINE_URL}/health`);
    const data = await res.json();

    if (FORMAT === "json") {
      printJson(data);
    } else {
      const icon = data.status === "healthy" ? "✓" : "⚠";
      console.log(`\n  ${icon} Engine: ${data.status}`);
      console.log(`  Uptime:      ${formatDuration(data.uptime * 1000)}`);
      console.log(`  Reconciler:  ${data.reconciler}`);
      console.log(`  Services:    ${data.services.running}/${data.services.total} running\n`);
    }
  } catch (err) {
    console.error(`\n  ✖ Engine unreachable at ${ENGINE_URL}: ${err.message}\n`);
    process.exit(1);
  }
}

function printUsage() {
  console.log(`
  Trace CLI — Codebase analysis & architecture pipeline

  USAGE
    trace <command> [target] [flags]

  COMMANDS
    intake <path|url>      Scan codebase → CodebaseSnapshot
    analyze <snapshot.json> Analyze snapshot → AnalysisReport
    propose <report.json>  Generate recommendation → ArchitectureSpec
    pipeline <path|url>    Run full pipeline (intake → analyze → propose)
    deliver <template-id>  Package + license + export a template
    publish <id|file>      Publish envelope to local registry
    templates              List available architecture templates
    services               List deployed services (engine API)
    health                 Check engine health

  FLAGS
    --output, -o <dir>     Output directory (default: .trace-output/)
    --template, -t <id>    Force template in propose step
    --tier <tier>          License tier: free|starter|professional|enterprise
    --licensee <email>     Licensee identifier for deliver
    --format, -f <type>    Output format: text | json (default: text)
    --engine, -e <url>     Engine URL (default: http://localhost:4010)

  EXAMPLES
    trace pipeline .                     Analyze current directory
    trace intake /path/to/project        Scan a local project
    trace analyze .trace-output/snapshot-abc.json
    trace propose .trace-output/report-xyz.json --template compliance-api
    trace deliver compliance-api --tier professional --licensee client@corp.com
    trace pipeline https://github.com/user/repo
`);
}

// ─── Router ──────────────────────────────────────────────────────

async function main() {
  try {
    switch (command) {
      case "intake":
        await cmdIntake(target);
        break;
      case "analyze":
        await cmdAnalyze(target);
        break;
      case "propose":
        await cmdPropose(target);
        break;
      case "pipeline":
        await cmdPipeline(target);
        break;
      case "deliver":
        await cmdDeliver(target);
        break;
      case "publish":
        await cmdPublish(target);
        break;
      case "templates":
        await cmdTemplates();
        break;
      case "services":
        await cmdServices();
        break;
      case "health":
        await cmdHealth();
        break;
      default:
        printUsage();
        break;
    }
  } catch (err) {
    console.error(`\n[fatal] ${err.message}`);
    if (process.env.TRACE_DEBUG) console.error(err.stack);
    process.exit(1);
  }
}

main();
