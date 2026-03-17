// Delivery — Barrel exports

// License
export {
  createLicenseGrant,
  isLicenseExpired,
  getRestrictions,
  hasFeature,
  enforceLicense,
  type LicenseTier,
  type LicenseGrant,
  type LicenseFeature,
  type LicenseViolation,
} from "./license/license-manager.js";

export {
  createEnvelope,
  verifySeal,
  EnvelopeSchema,
  type Envelope,
} from "./license/license-envelope.js";

// Packaging
export { sha256, hashFile, verifyFileIntegrity, verifyPackageIntegrity } from "./packaging/integrity.js";
export { collectAssets, computeTotalSize } from "./packaging/asset-collector.js";
export { buildPackage, type BuildOptions, type BuildResult } from "./packaging/package-builder.js";

// Distribution
export { exportAsJson, loadEnvelope, generateManifest } from "./distribution/exporter.js";
export { publishLocal, pullLocal, listLocal } from "./distribution/registry-client.js";
