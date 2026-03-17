export default function ArchitectureCard({ arch, onSelect }) {

  return (

    <div
      onClick={() => onSelect(arch)}
      style={{
        border: "1px solid #00FFB2",
        padding: "16px",
        background: "#050505",
        cursor: "pointer",
        transition: "border-color 0.2s",
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "#00ffc6"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "#00FFB2"}
    >

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h3 style={{ margin: "0 0 8px 0" }}>{arch.name}</h3>
        {arch.version && (
          <span style={{ fontSize: "10px", opacity: 0.4 }}>v{arch.version}</span>
        )}
      </div>

      <p style={{ opacity: 0.7, margin: "0 0 8px 0", fontSize: "13px" }}>
        {arch.description}
      </p>

      <div style={{ fontSize: "11px", opacity: 0.5 }}>
        {(arch.stack || []).join(" · ")}
      </div>

      <div style={{
        marginTop: "8px",
        fontSize: "10px",
        color: "#00FFB2",
        opacity: 0.6,
      }}>
        {arch.category}
      </div>

    </div>

  )

}
