import { useState } from "react";
import axios from "axios";

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:4000').trim().replace(/\/+$/, '');

export default function Dashboard() {
  const [records, setRecords] = useState([]);
  const [co2, setCo2] = useState(0);

  async function createTrace() {
    try {
      const tx = { transaction_id: "TX-" + Math.floor(Math.random() * 99999) };
      const res = await axios.post(`${API_BASE}/api/trace/create`, tx);
      setRecords(prev => [...prev, res.data]);
      setCo2(prev => prev + Math.floor(Math.random() * 15 + 5));
    } catch (error) {
      console.error('Error creating trace:', error);
    }
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
