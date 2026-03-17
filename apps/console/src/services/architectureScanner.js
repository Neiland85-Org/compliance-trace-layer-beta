/**
 * Architecture Scanner — Fetches templates from Engine API
 *
 * Previous approach: Vite glob import from ../architectures/ (static, coupled)
 * Current approach:  Fetch from Engine API at /templates (dynamic, decoupled)
 *
 * Falls back to empty array if engine is unreachable.
 */

const ENGINE_URL = import.meta.env.VITE_ENGINE_URL || "http://localhost:4010"

/**
 * Fetch all available architecture templates from the engine.
 * @returns {Promise<Array>} Array of template objects
 */
export async function scanArchitectures() {
  try {
    const res = await fetch(`${ENGINE_URL}/templates`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const data = await res.json()
    return data.templates || []
  } catch (err) {
    console.warn("[architectureScanner] Engine unreachable, returning empty:", err.message)
    return []
  }
}

/**
 * Fetch full details for a specific template.
 * @param {string} templateId
 * @returns {Promise<object|null>}
 */
export async function getTemplateDetail(templateId) {
  try {
    const res = await fetch(`${ENGINE_URL}/templates/${encodeURIComponent(templateId)}`)
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

/**
 * Fetch available presets for a template.
 * @param {string} templateId
 * @returns {Promise<Array>}
 */
export async function getTemplatePresets(templateId) {
  try {
    const res = await fetch(`${ENGINE_URL}/templates/${encodeURIComponent(templateId)}/presets`)
    if (!res.ok) return []
    const data = await res.json()
    return data.presets || []
  } catch {
    return []
  }
}
