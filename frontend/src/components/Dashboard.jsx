import { useState } from "react";
import axios from "axios";

<<<<<<< HEAD
const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:4000').trim().replace(/\/+$/, '');
=======
// Crear instancia de axios configurada con timeout
const apiClient = axios.create({
  timeout: 10000, // 10 segundos
  headers: {
    'Content-Type': 'application/json'
  }
});
>>>>>>> d678bff (WIP: guardar cambios locales)

export default function Dashboard() {
  const [records, setRecords] = useState([]);
  const [co2, setCo2] = useState(0);
  const [error, setError] = useState(null);

  // Función helper para construir API_BASE de manera robusta
  const getApiBase = () => {
    const viteApiUrl = import.meta.env.VITE_API_URL;
    if (viteApiUrl) {
      // Limpiar y validar la URL
      return viteApiUrl.replace(/\/$/, ''); // Remover trailing slash
    }
    // Fallback a window.location.origin para desarrollo con proxy de Vite
    return window.location.origin;
  };

  const API_BASE = getApiBase();

  async function createTrace() {
    try {
<<<<<<< HEAD
      const tx = { transaction_id: "TX-" + Math.floor(Math.random() * 99999) };
      const res = await axios.post(`${API_BASE}/api/trace/create`, tx);
      setRecords(prev => [...prev, res.data]);
      setCo2(prev => prev + Math.floor(Math.random() * 15 + 5));
    } catch (error) {
      console.error('Error creating trace:', error);
=======
      // Limpiar errores anteriores
      setError(null);
      
      const tx = { transaction_id: "TX-" + Math.floor(Math.random() * 99999) };
      const res = await apiClient.post(`${API_BASE}/api/trace/create`, tx);
      setRecords(prev => [...prev, res.data]);
      setCo2(prev => prev + Math.floor(Math.random() * 15 + 5));
    } catch (err) {
      // Manejo específico de diferentes tipos de errores
      let errorMessage = 'Error desconocido al crear la transacción';
      
      if (err.code === 'ECONNABORTED') {
        errorMessage = 'Timeout: La petición tardó demasiado tiempo';
      } else if (err.response) {
        // Error del servidor
        errorMessage = `Error del servidor: ${err.response.status} - ${err.response.data?.message || 'Error interno'}`;
      } else if (err.request) {
        // Error de red
        errorMessage = 'Error de conexión: No se pudo conectar al servidor';
      }
      
      setError(errorMessage);
      console.error('Error creating trace:', err);
>>>>>>> d678bff (WIP: guardar cambios locales)
    }
  }

  return (
    <div>
      {error && (
        <div className="bg-red-500/20 border border-red-500/40 text-red-400 px-4 py-2 rounded mb-4">
          {error}
        </div>
      )}
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
