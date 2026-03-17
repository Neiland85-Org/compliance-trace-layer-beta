/**
 * @trace/contracts — Shared domain contracts for Trace Platform
 *
 * All contracts follow SchemaVer (addition-model-revision): "1-0-0"
 * Consumers MUST reject unknown major versions.
 * Consumers MUST ignore unknown optional fields.
 *
 * Traceability chain:
 *   snapshotId → analysisId → specId → manifestId → containerName
 */

// Intake → Analysis
export * from "./intake-analysis/v1/index.js";

// Analysis → Arch Proposal
export * from "./analysis-proposal/v1/index.js";

// Arch Proposal → Manifest
export * from "./proposal-manifest/v1/index.js";

// Manifest ↔ Deployment
export * from "./manifest-deployment/v1/index.js";

// Arch Proposal → Delivery
export * from "./proposal-delivery/v1/index.js";
