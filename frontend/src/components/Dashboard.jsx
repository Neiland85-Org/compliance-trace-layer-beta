/**
Compliance Trace Layer — v0.1.0-beta

© 2025 Neil Muñoz Lago. All rights reserved.

Private research prototype for environmental blockchain visualization and

carbon-credit traceability. Developed using React Three Fiber, Framer Motion,

and Node.js backend services for compliance data integrity.

This software is proprietary and not open source.

Unauthorized reproduction, modification, or redistribution of this code,

in whole or in part, is strictly prohibited without prior written consent

from the author.

This project is not affiliated with TRAYCER, TRACYER, or any external framework.
*/
import { useState } from "react";
import axios from "axios";

export default function Dashboard() {
  const [records, setRecords] = useState([]);
  const [co2, setCo2] = useState(0);

  async function createTrace() {
    const tx = { transaction_id: "TX-" + Math.floor(Math.random() * 99999) };
    const res = await axios.post("http://localhost:4000/api/trace/create", tx);
    setRecords(prev => [...prev, res.data]);
    setCo2(prev => prev + Math.floor(Math.random() * 15 + 5));
  }

  return (
    <div>
      <button
        onClick={createTrace}
        className="bg-[#00FFB2]/20 border border-[#00FFB2]/40 text-[#00FFB2] px-4 py-2 rounded hover:bg-[#00E0FF]/20 transition mb-4"
      >
        Generate Transaction
      </button>
      <div className="overflow-y-auto max-h-[200px] border-t border-[#00E0FF]/20 pt-2">
        {records.map((r, i) => (
          <div key={i} className="mb-1 text-[#8DFD1B]">
            {`{ "transaction_id": "${r.transaction_id}", "hash": "${r.hash.slice(0, 10)}...", "status": "${r.status}", "timestamp": "${new Date(r.timestamp).toLocaleTimeString()}" }`}
          </div>
        ))}
      </div>
      <div className="mt-3 text-[#00E0FF]">
        Total CO₂ Offset: <span className="text-[#8DFD1B] font-bold">{co2} tons</span>
      </div>
    </div>
  );
}
