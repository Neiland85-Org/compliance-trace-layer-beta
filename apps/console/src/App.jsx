import { useState } from "react"

import Layout from "./components/Layout"
import ActivityPanel from "./components/ActivityPanel"

import Hero from "./components/Hero"
import SearchBar from "./components/SearchBar"
import Categories from "./components/Categories"

import Catalog from "./features/catalog/Catalog"
import ArchitectureDetail from "./features/architecture/ArchitectureDetail"

export default function App(){

  const [search,setSearch] = useState("")
  const [category,setCategory] = useState("All")
  const [selected,setSelected] = useState(null)

  return (

    <Layout>

      <Hero/>

      {!selected && (
        <>
          <SearchBar onSearch={setSearch}/>
          <Categories onSelect={setCategory}/>
        </>
      )}

      <div style={{
        display:"grid",
        gridTemplateColumns:"1fr 340px",
        gap:"40px"
      }}>

        <div>

          {!selected && (
            <Catalog
              search={search}
              category={category}
              onSelect={setSelected}
            />
          )}

          {selected && (
            <ArchitectureDetail
              arch={selected}
              onBack={()=>setSelected(null)}
            />
          )}

        </div>

        <div style={{
          borderLeft:"1px solid #00FFB2",
          paddingLeft:"24px"
        }}>
          <h3>Trace Engine Activity</h3>
          <ActivityPanel/>
        </div>

      </div>

    </Layout>

  )

}
