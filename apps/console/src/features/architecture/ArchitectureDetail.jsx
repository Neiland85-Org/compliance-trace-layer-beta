import { useEffect, useState } from "react"
import { deployArchitecture } from "../../services/deployService"
import { loadArchitectureDocs } from "../../services/architectureDocs"
import ArchitectureDiagram from "../../components/ArchitectureDiagram"
import { useActivityStore } from "../../stores/activityStore"

export default function ArchitectureDetail({ arch, onBack }) {

  const [docs, setDocs] = useState({})
  const [deploying, setDeploying] = useState(false)
  const [deployResult, setDeployResult] = useState(null)
  const addEvent = useActivityStore(s => s.addEvent)

  useEffect(() => {
    loadArchitectureDocs(arch.id).then(setDocs)
  }, [arch])

  async function handleDeploy(service) {
    setDeploying(true)
    setDeployResult(null)
    try {
      const result = await deployArchitecture(service.name, service.image)
      setDeployResult({ ok: true, msg: `${service.name} deployed on :${result.port}` })
      addEvent({
        type: "deploy",
        message: `Deployed ${service.name} (${service.image}) → :${result.port}`,
      })
    } catch (err) {
      setDeployResult({ ok: false, msg: err.message })
    } finally {
      setDeploying(false)
    }
  }

  const services = docs.template?.topology?.services || []
  const presets = docs.presets || []

  return (

    <div>

      <button
        onClick={onBack}
        style={{
          background: "none",
          border: "1px solid #333",
          color: "#aaa",
          padding: "6px 16px",
          cursor: "pointer",
          marginBottom: "20px",
        }}
      >
        ← Back to catalog
      </button>

      <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
        <h1 style={{ margin: 0 }}>{arch.name}</h1>
        {arch.version && (
          <span style={{ opacity: 0.4, fontSize: "14px" }}>v{arch.version}</span>
        )}
      </div>

      <p style={{ opacity: 0.7, marginTop: "8px" }}>{arch.description}</p>

      <div style={{ opacity: 0.5, fontSize: "12px", marginBottom: "24px" }}>
        {(arch.stack || []).join(" · ")}
      </div>

      {/* Services topology */}
      {services.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <h3 style={{ color: "#00FFB2" }}>Services ({services.length})</h3>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, 220px)",
            gap: "12px",
            marginTop: "12px",
          }}>
            {services.map(svc => (
              <div key={svc.name} style={{
                border: "1px solid #222",
                padding: "12px",
                background: "#0a0a0a",
              }}>
                <div style={{ fontWeight: "bold", marginBottom: "4px" }}>{svc.name}</div>
                <div style={{ fontSize: "11px", opacity: 0.6 }}>{svc.image}</div>
                <div style={{ fontSize: "11px", opacity: 0.5 }}>:{svc.port}</div>
                {svc.dependsOn?.length > 0 && (
                  <div style={{ fontSize: "10px", opacity: 0.4, marginTop: "4px" }}>
                    depends: {svc.dependsOn.join(", ")}
                  </div>
                )}
                <button
                  onClick={() => handleDeploy(svc)}
                  disabled={deploying}
                  style={{
                    marginTop: "8px",
                    border: "1px solid #00FFB2",
                    padding: "4px 12px",
                    background: "black",
                    color: "#00FFB2",
                    cursor: deploying ? "wait" : "pointer",
                    fontSize: "11px",
                    opacity: deploying ? 0.5 : 1,
                  }}
                >
                  {deploying ? "..." : "Deploy"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deploy result */}
      {deployResult && (
        <div style={{
          padding: "8px 12px",
          marginBottom: "16px",
          border: `1px solid ${deployResult.ok ? "#00FFB2" : "#ff4444"}`,
          color: deployResult.ok ? "#00FFB2" : "#ff4444",
          fontSize: "13px",
        }}>
          {deployResult.ok ? "✓" : "✖"} {deployResult.msg}
        </div>
      )}

      {/* Presets */}
      {presets.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <h3 style={{ color: "#00FFB2" }}>Presets</h3>
          <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
            {presets.map(p => (
              <div key={p.presetId || p.name} style={{
                border: "1px solid #222",
                padding: "10px 16px",
                background: "#0a0a0a",
                fontSize: "13px",
              }}>
                <div style={{ fontWeight: "bold" }}>{p.name || p.presetId}</div>
                <div style={{ fontSize: "11px", opacity: 0.5 }}>
                  {p.description || ""}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Readme */}
      {docs.readme && (
        <div style={{ marginBottom: "24px" }}>
          <h3 style={{ color: "#00FFB2" }}>Specification</h3>
          <pre style={{
            whiteSpace: "pre-wrap",
            background: "#0a0a0a",
            padding: "16px",
            border: "1px solid #222",
            fontSize: "13px",
            lineHeight: "1.6",
          }}>
            {docs.readme}
          </pre>
        </div>
      )}

      <ArchitectureDiagram diagram={docs.diagram} />

    </div>

  )

}
