export default function ArchitectureDiagram({diagram}){

  if(!diagram) return null

  return (

    <div style={{
      marginTop:"20px",
      border:"1px solid #333",
      padding:"10px"
    }}>

      {diagram.nodes.map(n=>(
        <div key={n.id}>
          ● {n.label}
        </div>
      ))}

      <div style={{marginTop:"10px",opacity:"0.6"}}>
        Connections:
      </div>

      {diagram.edges.map((e,i)=>(
        <div key={i}>
          {e.from} → {e.to}
        </div>
      ))}

    </div>

  )

}
