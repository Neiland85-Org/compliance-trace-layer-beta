import ArchitectureCard from "./ArchitectureCard"
import { useCatalog } from "../../hooks/useCatalog"

export default function Catalog({search,category,onSelect}){

  const { catalog, loading } = useCatalog()

  if(loading){
    return <div>Loading architectures...</div>
  }

  const filtered = catalog.filter(a=>{

    const matchesSearch =
      !search ||
      a.name.toLowerCase().includes(search.toLowerCase())

    const matchesCategory =
      !category || category==="All" || a.category===category

    return matchesSearch && matchesCategory
  })

  return (
    <div style={{
      display:"grid",
      gridTemplateColumns:"repeat(auto-fill,280px)",
      gap:"24px"
    }}>
      {filtered.map(a=>(
        <ArchitectureCard
          key={a.id}
          arch={a}
          onSelect={onSelect}
        />
      ))}
    </div>
  )

}
