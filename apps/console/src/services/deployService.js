const ENGINE_URL = import.meta.env.VITE_ENGINE_URL || "http://localhost:4010"

export async function deployArchitecture(name, image) {
  const res = await fetch(`${ENGINE_URL}/deploy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, image })
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "deploy failed" }))
    throw new Error(error.error || `Deploy failed with status ${res.status}`)
  }

  return res.json()
}

export async function listServices() {
  const res = await fetch(`${ENGINE_URL}/services`)
  if (!res.ok) throw new Error("Failed to fetch services")
  return res.json()
}

export async function removeService(name) {
  const res = await fetch(`${ENGINE_URL}/service/${encodeURIComponent(name)}`, {
    method: "DELETE"
  })
  if (!res.ok) throw new Error("Failed to remove service")
  return res.json()
}
