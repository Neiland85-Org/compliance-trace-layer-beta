import { useState } from "react"

export default function SearchBar({onSearch}){

  const [value,setValue] = useState("")

  function handle(e){
    const v = e.target.value
    setValue(v)
    onSearch(v)
  }

  return (
    <input
      value={value}
      onChange={handle}
      placeholder="Search architectures..."
      style={{
        width:"100%",
        padding:"12px",
        marginBottom:"20px",
        border:"1px solid #00FFB2",
        background:"#080808",
        color:"white"
      }}
    />
  )
}
