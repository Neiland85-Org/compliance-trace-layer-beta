import ArchitectureCard from "./ArchitectureCard"
import { useCatalog } from "../../hooks/useCatalog"

export default function Catalog({ search, category, onSelect }) {

  const { catalog, loading, error } = useCatalog()

  if (loading) {
    return <div style={{ opacity: 0.5 }}>Loading templates from engine...</div>
  }

  if (error) {
    return (
      <div style={{
        border: "1px solid #ff4444",
        padding: "16px",
        color: "#ff4444",
        fontFamily: "monospace",
        fontSize: "13px",
      }}>
        {error}
      </div>
    )
  }

  const filtered = catalog.filter(a => {
    const matchesSearch =
      !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      (a.stack || []).some(t => t.toLowerCase().includes(search.toLowerCase()))

    const matchesCategory =
      !category || category === "All" || a.category === category

    return matchesSearch && matchesCategory
  })

  if (filtered.length === 0) {
    return (
      <div style={{ opacity: 0.5 }}>
        No templates match "{search}" in {category}.
      </div>
    )
  }

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, 280px)",
      gap: "24px"
    }}>
      {filtered.map(a => (
        <ArchitectureCard
          key={a.id}
          arch={a}
          onSelect={onSelect}
        />
      ))}
    </div>
  )

}
