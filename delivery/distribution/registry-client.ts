/**
 * Registry Client — Push/pull packages to/from a template registry
 *
 * STATUS: Stub implementation. The registry server does not exist yet.
 * This module defines the interface and local-file fallback for testing.
 *
 * Future: HTTP client that talks to a registry API:
 *   POST /registry/publish    — Upload envelope
 *   GET  /registry/catalog    — List available packages
 *   GET  /registry/pull/:id   — Download envelope by templateId + version
 */

import fs from "fs";
import path from "path";
import type { Envelope } from "../license/license-envelope.js";
import { exportAsJson, loadEnvelope } from "./exporter.js";

// ─── Types ───────────────────────────────────────────────────────

export interface RegistryConfig {
  type: "local" | "remote";
  basePath?: string;       // For local registry
  baseUrl?: string;        // For remote registry (future)
  apiKey?: string;         // For remote registry (future)
}

export interface CatalogEntry {
  templateId: string;
  version: string;
  tier: string;
  filename: string;
  publishedAt: string;
}

// ─── Local registry ──────────────────────────────────────────────

/**
 * Publish an envelope to a local file-based registry.
 */
export function publishLocal(
  envelope: Envelope,
  registryPath: string
): CatalogEntry {
  const templateId = envelope.package?.templateId || "unknown";
  const version = envelope.package?.version || "1.0.0";
  const tier = envelope.license.tier;

  const dir = path.join(registryPath, templateId, version);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const filename = `${templateId}-${version}-${tier}.trace.json`;
  const result = exportAsJson(envelope, dir, filename);

  // Update local catalog
  const catalogPath = path.join(registryPath, "catalog.json");
  let catalog: CatalogEntry[] = [];
  if (fs.existsSync(catalogPath)) {
    catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
  }

  const entry: CatalogEntry = {
    templateId,
    version,
    tier,
    filename: `${templateId}/${version}/${filename}`,
    publishedAt: new Date().toISOString(),
  };

  // Replace existing entry for same templateId+version+tier
  catalog = catalog.filter(
    (e) => !(e.templateId === templateId && e.version === version && e.tier === tier)
  );
  catalog.push(entry);

  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2));

  return entry;
}

/**
 * Pull an envelope from a local file-based registry.
 */
export function pullLocal(
  registryPath: string,
  templateId: string,
  version: string,
  tier: string = "free"
): Envelope | null {
  const filename = `${templateId}-${version}-${tier}.trace.json`;
  const filePath = path.join(registryPath, templateId, version, filename);

  if (!fs.existsSync(filePath)) return null;
  return loadEnvelope(filePath);
}

/**
 * List all entries in a local registry catalog.
 */
export function listLocal(registryPath: string): CatalogEntry[] {
  const catalogPath = path.join(registryPath, "catalog.json");
  if (!fs.existsSync(catalogPath)) return [];
  return JSON.parse(fs.readFileSync(catalogPath, "utf8"));
}
