export default function ArchitectureCard({arch, onSelect}){

  return (

    <div
      onClick={()=>onSelect(arch)}
      style={{
        border:"1px solid #00FFB2",
        padding:"16px",
        background:"#050505",
        cursor:"pointer"
      }}
    >

      <h3>{arch.name}</h3>

      <p style={{opacity:"0.7"}}>
        {arch.description}
      </p>

      <div style={{
        fontSize:"11px",
        opacity:"0.5"
      }}>
        {(arch.stack || []).join(" • ")}
      </div>

    </div>

  )

}
