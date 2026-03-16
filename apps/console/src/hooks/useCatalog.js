import { useEffect, useState } from "react"
import { fetchCatalog } from "../services/catalogService"

export function useCatalog(){

  const [catalog,setCatalog] = useState([])
  const [loading,setLoading] = useState(true)

  useEffect(()=>{

    fetchCatalog()
      .then(data=>{
        setCatalog(data)
        setLoading(false)
      })
      .catch(()=>{

        setCatalog([
          {
            id:1,
            name:"Trace Compliance API",
            description:"GDPR cookie compliance backend",
            stack:["Node","Postgres"],
            category:"Compliance"
          },
          {
            id:2,
            name:"Event Stream Pipeline",
            description:"Distributed event processing system",
            stack:["NATS","Workers"],
            category:"Event Systems"
          }
        ])

        setLoading(false)

      })

  },[])

  return { catalog, loading }

}
