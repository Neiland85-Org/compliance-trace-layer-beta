/**
 * Catalog Service — Maps Engine API templates to component-friendly format
 *
 * Engine API returns: { templateId, name, version, category, description, tags }
 * Components expect:  { id, name, description, stack, category, version, templateId }
 */

import { scanArchitectures } from "./architectureScanner"

const CATEGORY_MAP = {
  compliance: "Compliance",
  observability: "Observability",
  infrastructure: "Infrastructure",
  "api-platform": "Infrastructure",
  "event-systems": "Event Systems",
  ai: "AI",
}

function normalizeTemplate(t) {
  return {
    id: t.templateId,
    templateId: t.templateId,
    name: t.name,
    description: t.description || "",
    stack: t.tags || [],
    category: CATEGORY_MAP[t.category] || t.category || "Infrastructure",
    version: t.version || "1.0.0",
  }
}

export async function fetchCatalog() {
  const templates = await scanArchitectures()
  return templates.map(normalizeTemplate)
}
