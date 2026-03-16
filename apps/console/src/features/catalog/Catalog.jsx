import { useEffect, useState } from "react";
import ArchitectureCard from "./ArchitectureCard";

export default function Catalog() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch("http://localhost:4000/catalog")
      .then(r => r.json())
      .then(setItems)
      .catch(() => {
        setItems([
          {
            id: 1,
            name: "Trace Compliance API",
            description: "GDPR / cookie compliance backend service",
            stack: ["Node", "Postgres", "Trace Engine"]
          },
          {
            id: 2,
            name: "Consent Ledger",
            description: "Event sourced consent storage",
            stack: ["NATS", "EventStore"]
          }
        ]);
      });
  }, []);

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill,280px)",
      gap: "24px"
    }}>
      {items.map(a => (
        <ArchitectureCard key={a.id} arch={a} />
      ))}
    </div>
  );
}
