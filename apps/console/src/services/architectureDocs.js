/**
 * Architecture Docs — Fetches template details from Engine API
 *
 * Previous: Vite import.meta.glob from filesystem (static, coupled)
 * Current:  Fetch from Engine /templates/:id (dynamic, decoupled)
 */

import { getTemplateDetail, getTemplatePresets } from "./architectureScanner"

export async function loadArchitectureDocs(id) {
  const [template, presets] = await Promise.all([
    getTemplateDetail(id),
    getTemplatePresets(id),
  ])

  if (!template) {
    return { readme: "", diagram: null, template: null, presets: [] }
  }

  const readme = buildReadme(template, presets)

  const diagram = template.topology
    ? buildDiagram(template.topology)
    : null

  return { readme, diagram, template, presets }
}

function buildReadme(t, presets) {
  const lines = []

  lines.push(`# ${t.metadata?.name || t.templateId}`)
  lines.push("")
  lines.push(t.metadata?.description || "")
  lines.push("")

  if (t.topology?.services?.length) {
    lines.push("## Services")
    lines.push("")
    for (const svc of t.topology.services) {
      const deps = svc.dependsOn?.length ? ` (depends: ${svc.dependsOn.join(", ")})` : ""
      lines.push(`  ${svc.name}  →  ${svc.image}  :${svc.port}${deps}`)
    }
    lines.push("")
  }

  if (t.parameters?.length) {
    lines.push("## Parameters")
    lines.push("")
    for (const p of t.parameters) {
      const req = p.required ? " *" : ""
      const def = p.default ? ` (default: ${p.default})` : ""
      lines.push(`  ${p.key}${req}  ${p.description || ""}${def}`)
    }
    lines.push("")
  }

  if (presets?.length) {
    lines.push("## Presets")
    lines.push("")
    for (const preset of presets) {
      lines.push(`  ${preset.name || preset.presetId}: ${preset.description || ""}`)
    }
    lines.push("")
  }

  if (t.contracts?.length) {
    lines.push("## Service Contracts")
    lines.push("")
    for (const c of t.contracts) {
      lines.push(`  ${c.consumer} → ${c.provider} (${c.protocol}:${c.port})`)
    }
    lines.push("")
  }

  return lines.join("\n")
}

function buildDiagram(topology) {
  if (!topology?.services?.length) return null

  const nodes = topology.services.map((svc, i) => ({
    id: svc.name,
    label: `${svc.name} (:${svc.port})`,
    x: 100 + (i % 3) * 200,
    y: 100 + Math.floor(i / 3) * 150,
  }))

  const edges = []
  for (const svc of topology.services) {
    if (svc.dependsOn) {
      for (const dep of svc.dependsOn) {
        edges.push({ from: svc.name, to: dep })
      }
    }
  }

  return { nodes, edges }
}
