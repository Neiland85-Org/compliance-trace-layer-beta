/**
 * Asset Collector — Scans template directory and collects distributable assets
 *
 * Walks a template directory, identifies asset types by extension/name,
 * computes content hashes, and produces an Asset[] array for TemplatePackage.
 */

import fs from "fs";
import path from "path";
import { hashFile } from "./integrity.js";
import type { Asset } from "../../contracts/proposal-delivery/v1/TemplatePackage.js";

// ─── Asset type detection ────────────────────────────────────────

const ASSET_TYPE_MAP: Record<string, Asset["type"]> = {
  Dockerfile: "dockerfile",
  "docker-compose.yml": "compose",
  "docker-compose.yaml": "compose",
  "compose.yml": "compose",
  "compose.yaml": "compose",
  ".env.example": "config",
  "README.md": "readme",
  "readme.md": "readme",
};

const EXTENSION_TYPE_MAP: Record<string, Asset["type"]> = {
  ".sql": "migration",
  ".sh": "config",
  ".yml": "config",
  ".yaml": "config",
  ".json": "config",
  ".toml": "config",
  ".ts": "source",
  ".js": "source",
  ".py": "source",
  ".go": "source",
  ".rs": "source",
  ".md": "readme",
};

function detectAssetType(filename: string): Asset["type"] {
  // Check exact filename matches first
  if (ASSET_TYPE_MAP[filename]) return ASSET_TYPE_MAP[filename];

  // Check by extension
  const ext = path.extname(filename).toLowerCase();
  if (EXTENSION_TYPE_MAP[ext]) return EXTENSION_TYPE_MAP[ext];

  // Default
  return "config";
}

// ─── Ignore rules ────────────────────────────────────────────────

const IGNORE_PATTERNS = new Set([
  "node_modules",
  ".git",
  ".DS_Store",
  "dist",
  "__pycache__",
  ".env",
]);

function shouldIgnore(name: string): boolean {
  return IGNORE_PATTERNS.has(name) || name.startsWith(".");
}

// ─── Collector ───────────────────────────────────────────────────

/**
 * Collect all distributable assets from a template directory.
 *
 * @param templateDir - Absolute path to the template directory
 * @param maxDepth - Maximum directory depth to scan (default: 4)
 * @returns Array of Asset objects with paths relative to templateDir
 */
export function collectAssets(
  templateDir: string,
  maxDepth: number = 4
): Asset[] {
  const assets: Asset[] = [];

  function walk(dir: string, depth: number, prefix: string) {
    if (depth > maxDepth) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (shouldIgnore(entry.name)) continue;

      const fullPath = path.join(dir, entry.name);
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        walk(fullPath, depth + 1, relativePath);
      } else if (entry.isFile()) {
        assets.push({
          path: relativePath,
          type: detectAssetType(entry.name),
          contentHash: hashFile(fullPath),
        });
      }
    }
  }

  walk(templateDir, 0, "");
  return assets;
}

/**
 * Compute total size of all assets.
 */
export function computeTotalSize(
  templateDir: string,
  assets: Asset[]
): number {
  let total = 0;
  for (const asset of assets) {
    const fullPath = path.join(templateDir, asset.path);
    if (fs.existsSync(fullPath)) {
      total += fs.statSync(fullPath).size;
    }
  }
  return total;
}
