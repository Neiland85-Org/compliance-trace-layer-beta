export default function Categories({onSelect}){

  const categories = [
    "All",
    "Compliance",
    "Event Systems",
    "Observability",
    "AI",
    "Infrastructure"
  ]

  return (
    <div style={{
      display:"flex",
      gap:"10px",
      marginBottom:"25px",
      flexWrap:"wrap"
    }}>
      {categories.map(c=>(
        <button
          key={c}
          onClick={()=>onSelect(c)}
          style={{
            border:"1px solid #00FFB2",
            background:"black",
            color:"#00FFB2",
            padding:"6px 12px",
            cursor:"pointer"
          }}
        >
          {c}
        </button>
      ))}
    </div>
  )
}
