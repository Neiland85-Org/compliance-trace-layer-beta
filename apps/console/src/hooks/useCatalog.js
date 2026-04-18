import { useEffect, useState } from "react"
import { fetchCatalog } from "../services/catalogService"

export function useCatalog() {

  const [catalog, setCatalog] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {

    fetchCatalog()
      .then(data => {
        setCatalog(data)
        setLoading(false)
      })
      .catch(err => {
        console.warn("[useCatalog] Failed to fetch:", err.message)
        setError("Engine unreachable — start with: npm run engine")
        setCatalog([])
        setLoading(false)
      })

  }, [])

  return { catalog, loading, error }

}
