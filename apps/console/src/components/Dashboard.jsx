import { useEffect, useState } from "react"

export default function Dashboard(){

  const [logs,setLogs] = useState([])

  useEffect(()=>{

    const interval = setInterval(()=>{

      fetch("http://localhost:4000/health")
        .then(r=>r.json())
        .then(data=>{
          setLogs(l=>[
            {time:new Date().toLocaleTimeString(),msg:JSON.stringify(data)},
            ...l.slice(0,10)
          ])
        })
        .catch(()=>{})

    },2000)

    return ()=>clearInterval(interval)

  },[])

  return (
    <div style={{fontFamily:"monospace"}}>
      {logs.map((l,i)=>(
        <div key={i}>
          [{l.time}] {l.msg}
        </div>
      ))}
    </div>
  )
}
