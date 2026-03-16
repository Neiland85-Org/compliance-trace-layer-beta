export default function ArchitectureCard({ arch }) {
  return (
    <div style={{
      border: "1px solid #00FFB2",
      borderRadius: "6px",
      padding: "18px",
      background: "#0b0b0b"
    }}>
      <h3>{arch?.name}</h3>
      <p style={{ fontSize: "13px", opacity: 0.7 }}>
        {arch?.description}
      </p>
      <div style={{ fontSize: "11px", opacity: 0.5, marginBottom: "12px" }}>
        {(arch?.stack || []).join(" • ")}
      </div>
      <button style={{
        padding: "8px",
        border: "1px solid #00FFB2",
        background: "black",
        color: "#00FFB2"
      }}>
        Deploy
      </button>
    </div>
  );
}
