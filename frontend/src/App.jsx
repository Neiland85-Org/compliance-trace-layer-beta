import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import { motion } from "framer-motion";

export default function App() {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center relative">
        {/* HERO PLACEHOLDER */}
        <div className="relative w-full h-[80vh] flex items-center justify-center bg-gradient-to-b from-[#012C3C] to-black rounded-3xl border border-[#00E0FF]/30 overflow-hidden shadow-2xl">
          {/* Placeholder para la escena 3D */}
          <div className="flex items-center justify-center w-full h-full">
            <div className="text-center">
              <div className="w-32 h-32 bg-[#00E0FF]/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                <span className="text-4xl">🌍</span>
              </div>
              <p className="text-[#8DFD1B] text-lg">Escena 3D próximamente</p>
            </div>
          </div>

          {/* TÍTULO SUPERPUESTO */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="absolute bottom-12 text-center"
          >
            <h1 className="orbit-font text-5xl font-bold text-[#8DFD1B] drop-shadow-lg mb-4">
              COMPLIANCE & TRACE LAYER
            </h1>
            <p className="text-[#B5C5C7] text-lg max-w-3xl mx-auto">
              Real-time blockchain traceability for carbon credits.
              Transparency that scales — built for ClimateTrade.
            </p>
          </motion.div>
        </div>

        {/* PANEL DE SIMULACIÓN DE API */}
        <div className="w-full bg-black/70 border-t border-[#00FFB2]/30 backdrop-blur-lg p-10 text-sm font-mono text-[#8DFD1B] overflow-y-auto max-h-[30vh]">
          <h3 className="text-[#00E0FF] mb-4 font-bold tracking-widest">
            API RESPONSE STREAM
          </h3>
          <Dashboard />
        </div>
      </div>
    </Layout>
  );
}
