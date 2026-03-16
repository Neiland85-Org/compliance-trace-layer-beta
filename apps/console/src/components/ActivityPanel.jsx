import { useEffect, useState } from "react"

export default function ActivityPanel(){

  const [logs,setLogs] = useState([])

  useEffect(()=>{

    const i = setInterval(()=>{

      fetch("http://localhost:4000/health")
      .then(r=>r.json())
      .then(d=>{

        setLogs(l=>[
          {
            t:new Date().toLocaleTimeString(),
            msg:d.status
          },
          ...l.slice(0,15)
        ])

      })

    },2000)

    return ()=>clearInterval(i)

  },[])

  return (

    <div style={{
      fontFamily:"monospace",
      fontSize:"12px",
      lineHeight:"1.5"
    }}>

      {logs.map((l,i)=>(
        <div key={i}>
          [{l.t}] {l.msg}
        </div>
      ))}

    </div>

  )

}
