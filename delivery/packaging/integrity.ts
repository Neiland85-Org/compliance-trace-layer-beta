/**
 * Integrity — SHA-256 content hashing and verification
 *
 * All assets in a TemplatePackage must have a contentHash (SHA-256).
 * This module provides hashing and verification primitives.
 */

import { createHash } from "crypto";
import fs from "fs";

/**
 * Compute SHA-256 hash of a buffer or string.
 */
export function sha256(content: Buffer | string): string {
  return createHash("sha256").update(content).digest("hex");
}

/**
 * Compute SHA-256 hash of a file on disk.
 */
export function hashFile(filePath: string): string {
  const content = fs.readFileSync(filePath);
  return sha256(content);
}

/**
 * Verify that a file matches an expected hash.
 */
export function verifyFileIntegrity(
  filePath: string,
  expectedHash: string
): { valid: boolean; actual: string } {
  const actual = hashFile(filePath);
  return { valid: actual === expectedHash, actual };
}

/**
 * Verify all assets in a package against their declared hashes.
 * Returns a list of mismatches.
 */
export function verifyPackageIntegrity(
  basePath: string,
  assets: Array<{ path: string; contentHash: string }>
): Array<{ path: string; expected: string; actual: string }> {
  const mismatches: Array<{ path: string; expected: string; actual: string }> = [];

  for (const asset of assets) {
    const fullPath = `${basePath}/${asset.path}`;
    if (!fs.existsSync(fullPath)) {
      mismatches.push({
        path: asset.path,
        expected: asset.contentHash,
        actual: "FILE_NOT_FOUND",
      });
      continue;
    }
    const result = verifyFileIntegrity(fullPath, asset.contentHash);
    if (!result.valid) {
      mismatches.push({
        path: asset.path,
        expected: asset.contentHash,
        actual: result.actual,
      });
    }
  }

  return mismatches;
}
