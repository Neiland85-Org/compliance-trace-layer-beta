import { useEffect, useState } from "react"
import { deployArchitecture } from "../../services/deployService"
import { loadArchitectureDocs } from "../../services/architectureDocs"
import ArchitectureDiagram from "../../components/ArchitectureDiagram"

export default function ArchitectureDetail({arch,onBack}){

  const [docs,setDocs] = useState({})

  useEffect(()=>{

    loadArchitectureDocs(arch.id).then(setDocs)

  },[arch])

  return (

    <div>

      <button onClick={onBack}>
        ← Back
      </button>

      <h1>{arch.name}</h1>

      <p>{arch.description}</p>

      <div style={{opacity:"0.6"}}>
        {(arch.stack||[]).join(" • ")}
      </div>

      <button
        onClick={()=>deployArchitecture(arch)}
        style={{
          marginTop:"20px",
          border:"1px solid #00FFB2",
          padding:"8px",
          background:"black",
          color:"#00FFB2"
        }}
      >
        Deploy
      </button>

      {docs.readme && (
        <pre style={{
          marginTop:"30px",
          whiteSpace:"pre-wrap"
        }}>
          {docs.readme}
        </pre>
      )}

      <ArchitectureDiagram diagram={docs.diagram}/>

    </div>

  )

}
