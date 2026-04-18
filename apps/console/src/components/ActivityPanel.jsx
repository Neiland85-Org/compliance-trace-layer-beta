import { useEffect, useState } from "react"
import { listServices } from "../services/deployService"

const ENGINE_URL = import.meta.env.VITE_ENGINE_URL || "http://localhost:4010"

export default function ActivityPanel() {

  const [logs, setLogs] = useState([])
  const [services, setServices] = useState([])

  // Poll engine health + services
  useEffect(() => {

    async function poll() {
      try {
        const healthRes = await fetch(`${ENGINE_URL}/health`)
        const health = await healthRes.json()

        setLogs(l => [
          {
            t: new Date().toLocaleTimeString(),
            type: "health",
            msg: `engine: ${health.status} | ${health.services?.running || 0}/${health.services?.total || 0} svc`,
          },
          ...l.slice(0, 20)
        ])

        const svcList = await listServices()
        setServices(svcList)

      } catch {
        setLogs(l => [
          {
            t: new Date().toLocaleTimeString(),
            type: "error",
            msg: "engine unreachable",
          },
          ...l.slice(0, 20)
        ])
      }
    }

    poll()
    const i = setInterval(poll, 5000)
    return () => clearInterval(i)

  }, [])

  return (

    <div style={{
      fontFamily: "monospace",
      fontSize: "12px",
      lineHeight: "1.5"
    }}>

      {services.length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <div style={{ color: "#00FFB2", marginBottom: "8px", fontWeight: "bold" }}>
            Running Services
          </div>
          {services.map(s => (
            <div key={s.name} style={{
              padding: "4px 0",
              borderBottom: "1px solid #1a1a1a"
            }}>
              <span style={{ color: s.status === "running" ? "#00FFB2" : "#ff4444" }}>
                {s.status === "running" ? "●" : "✖"}
              </span>
              {" "}{s.name} <span style={{ opacity: 0.5 }}>:{s.hostPort}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ color: "#00FFB2", marginBottom: "8px", fontWeight: "bold" }}>
        Engine Log
      </div>

      {logs.map((l, i) => (
        <div key={i} style={{
          color: l.type === "error" ? "#ff4444" : "#aaa"
        }}>
          [{l.t}] {l.msg}
        </div>
      ))}

    </div>

  )

}
