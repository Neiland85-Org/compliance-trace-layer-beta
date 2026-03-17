/**
 * Template Routes — Read-only template catalog API
 *
 * GET /templates          — List all templates from catalog
 * GET /templates/:id      — Get full template detail
 * GET /templates/:id/presets — List presets for a template
 *
 * NOTE: Templates are read from the filesystem (templates/ directory).
 * The engine serves them but does NOT modify them.
 * This keeps the engine as a pure runtime with no intelligence coupling.
 */

import { Router } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.resolve(__dirname, "../../../templates");

const router = Router();

// ─── GET /templates ──────────────────────────────────────────────

router.get("/templates", (_req, res) => {
  const catalogPath = path.join(TEMPLATES_DIR, "catalog.json");

  try {
    const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
    res.json({
      count: catalog.templates?.length || 0,
      templates: catalog.templates || [],
    });
  } catch {
    res.json({ count: 0, templates: [] });
  }
});

// ─── GET /templates/:id ─────────────────────────────────────────

router.get("/templates/:id", (req, res) => {
  const templateId = req.params.id;

  if (!/^[a-zA-Z0-9_-]+$/.test(templateId)) {
    res.status(400).json({ error: "Invalid template ID" });
    return;
  }

  const templatePath = path.join(TEMPLATES_DIR, templateId, "template.json");

  try {
    const template = JSON.parse(fs.readFileSync(templatePath, "utf8"));
    res.json(template);
  } catch {
    res.status(404).json({ error: `Template not found: ${templateId}` });
  }
});

// ─── GET /templates/:id/presets ─────────────────────────────────

router.get("/templates/:id/presets", (req, res) => {
  const templateId = req.params.id;

  if (!/^[a-zA-Z0-9_-]+$/.test(templateId)) {
    res.status(400).json({ error: "Invalid template ID" });
    return;
  }

  const presetsDir = path.join(TEMPLATES_DIR, templateId, "presets");

  try {
    if (!fs.existsSync(presetsDir)) {
      res.json({ templateId, presets: [] });
      return;
    }

    const files = fs.readdirSync(presetsDir).filter((f) => f.endsWith(".json"));
    const presets = files.map((f) => {
      const data = JSON.parse(fs.readFileSync(path.join(presetsDir, f), "utf8"));
      return {
        presetId: f.replace(".json", ""),
        ...data,
      };
    });

    res.json({ templateId, presets });
  } catch {
    res.json({ templateId, presets: [] });
  }
});

export { router as templateRoutes };
