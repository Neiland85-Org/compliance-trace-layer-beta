/**
 * Delivery Routes — Package distribution API
 *
 * POST /deliver          — Build, license, seal, and export a template package
 * GET  /registry         — List published packages in local registry
 * GET  /registry/:id     — Pull a specific package from registry
 *
 * NOTE: These routes load the proprietary Delivery module at RUNTIME via dynamic import.
 * The engine itself does NOT statically depend on the Delivery module — this preserves
 * the open-source boundary. If the Delivery module is not present, these routes
 * return 501 Not Implemented.
 */

import { Router } from "express";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../..");
const REGISTRY_PATH = path.join(ROOT, ".trace-registry");

const router = Router();

// ─── Dynamic delivery loader ────────────────────────────────────

async function loadDeliveryModules() {
  const deliveryDir = path.join(ROOT, "delivery");
  if (!fs.existsSync(deliveryDir)) {
    return null;
  }
  try {
    const { buildPackage } = await import(
      `${ROOT}/delivery/packaging/package-builder.js`
    );
    const { createLicenseGrant, enforceLicense } = await import(
      `${ROOT}/delivery/license/license-manager.js`
    );
    const { createEnvelope, verifySeal } = await import(
      `${ROOT}/delivery/license/license-envelope.js`
    );
    const { exportAsJson } = await import(
      `${ROOT}/delivery/distribution/exporter.js`
    );
    const { publishLocal, pullLocal, listLocal } = await import(
      `${ROOT}/delivery/distribution/registry-client.js`
    );
    return {
      buildPackage,
      createLicenseGrant,
      enforceLicense,
      createEnvelope,
      verifySeal,
      exportAsJson,
      publishLocal,
      pullLocal,
      listLocal,
    };
  } catch {
    return null;
  }
}

// ─── Schemas ─────────────────────────────────────────────────────

const DeliverRequestSchema = z.object({
  templateId: z.string().regex(/^[a-z][a-z0-9-]*$/),
  tier: z.enum(["free", "starter", "professional", "enterprise"]).default("free"),
  licensee: z.string().min(1).default("anonymous@local"),
  durationDays: z.number().int().min(1).optional(),
  publish: z.boolean().default(false),
});

// ─── POST /deliver ───────────────────────────────────────────────

router.post("/deliver", async (req, res, next) => {
  try {
    const delivery = await loadDeliveryModules();
    if (!delivery) {
      res.status(501).json({
        error: "Delivery module not available",
        hint: "This engine build does not include the delivery module (open-source edition)",
      });
      return;
    }

    const body = DeliverRequestSchema.parse(req.body);
    const templateDir = path.join(ROOT, "templates", body.templateId);

    if (!fs.existsSync(templateDir)) {
      res.status(404).json({ error: `Template not found: ${body.templateId}` });
      return;
    }

    // Build package
    const { package: pkg, warnings, assetCount, totalSizeBytes } =
      delivery.buildPackage(templateDir, {
        licenseTier: body.tier,
      });

    // Create license
    const grant = delivery.createLicenseGrant(
      body.tier,
      body.licensee,
      body.durationDays
    );

    // Enforce
    const violations = delivery.enforceLicense(
      grant,
      pkg.spec.topology.services.length,
      1
    );
    const blocking = violations.filter((v: any) => v.severity === "blocking");
    if (blocking.length > 0) {
      res.status(403).json({
        error: "License violations",
        violations: blocking,
      });
      return;
    }

    // Seal
    const envelope = delivery.createEnvelope(pkg, grant);
    const sealCheck = delivery.verifySeal(envelope);

    // Export
    const exportDir = path.join(ROOT, ".trace-output", "packages");
    const exportResult = delivery.exportAsJson(envelope, exportDir);

    // Optionally publish to local registry
    let registryEntry = null;
    if (body.publish) {
      registryEntry = delivery.publishLocal(envelope, REGISTRY_PATH);
    }

    res.json({
      envelopeId: envelope.envelopeId,
      templateId: body.templateId,
      version: pkg.version,
      tier: body.tier,
      licensee: body.licensee,
      assetCount,
      totalSizeBytes,
      sealValid: sealCheck.valid,
      sealHash: envelope.seal.contentHash,
      outputPath: exportResult.outputPath,
      outputSizeBytes: exportResult.sizeBytes,
      registryEntry,
      warnings,
      correlationId: req.correlationId,
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /registry ───────────────────────────────────────────────

router.get("/registry", async (_req, res) => {
  const delivery = await loadDeliveryModules();
  if (!delivery) {
    res.status(501).json({ error: "Delivery module not available" });
    return;
  }

  const entries = delivery.listLocal(REGISTRY_PATH);
  res.json({ count: entries.length, entries });
});

// ─── GET /registry/:templateId/:version ──────────────────────────

router.get("/registry/:templateId/:version", async (req, res) => {
  const delivery = await loadDeliveryModules();
  if (!delivery) {
    res.status(501).json({ error: "Delivery module not available" });
    return;
  }

  const { templateId, version } = req.params;
  const tier = (req.query.tier as string) || "free";

  const envelope = delivery.pullLocal(REGISTRY_PATH, templateId, version, tier);
  if (!envelope) {
    res.status(404).json({
      error: `Package not found: ${templateId}@${version} (${tier})`,
    });
    return;
  }

  // Verify seal on read
  const sealCheck = delivery.verifySeal(envelope);
  res.json({
    envelope,
    sealValid: sealCheck.valid,
  });
});

export { router as deliveryRoutes };
