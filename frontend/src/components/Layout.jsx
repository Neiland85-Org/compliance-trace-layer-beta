import { motion } from "framer-motion";
import PlanetModal from "./PlanetModal";
import { usePlanetStore } from "../hooks/usePlanetStore";
import EarthScene from "./EarthScene";
import { useCommandConsole } from "../hooks/useCommandConsole";

export default function Layout({ children }) {
  const { selectedPlanet, closeModal } = usePlanetStore();
  const {
    logs,
    generateTransaction,
    verifyBlock,
    generateReport,
    deployProtocol,
  } = useCommandConsole();

  return (
    <div className="relative w-full min-h-screen text-white overflow-x-hidden bg-black">
      {/* === FULLSCREEN COSMIC HEADER === */}
      <section className="relative w-full h-screen overflow-hidden">
        {/* 3D Worlds */}
        <div className="absolute inset-0 z-0">
          <EarthScene />
        </div>

        {/* Title and subtitle */}
        <div className="relative z-20 flex flex-col items-center justify-center h-full text-center">
          <motion.h1
            className="text-6xl md:text-7xl font-extrabold text-[#00ffc6] tracking-wider drop-shadow-[0_0_25px_#00ffc6]"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            COMPLIANCE TRACE LAYER
          </motion.h1>
          <motion.p
            className="text-base md:text-lg tracking-widest text-gray-300 uppercase mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            Environmental Blockchain Command Interface
          </motion.p>
        </div>

        {/* Gradient overlay for smooth transition */}
        <div className="absolute bottom-0 w-full h-32 bg-gradient-to-b from-transparent to-black z-10" />
      </section>

      {/* === MAIN CONTENT === */}
      <main className="relative z-30 px-10 py-20 bg-black">
        {children}
      </main>

      {/* === CONTROL PANEL === */}
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.8 }}
        className="relative z-40 bg-gradient-to-t from-black/90 via-black/60 to-transparent
                   backdrop-blur-lg border-t border-[#00ffc655]
                   flex flex-col items-center gap-6 py-6 px-4"
      >
        <div className="flex flex-wrap justify-center gap-6">
          {[
            { label: "Verify Block", action: verifyBlock, color: "from-[#00ffcc] to-[#0077ff]" },
            { label: "Generate Report", action: generateReport, color: "from-[#9aff68] to-[#f0ff00]" },
            { label: "Deploy Protocol", action: deployProtocol, color: "from-[#ff6600] to-[#ffaa00]" },
            { label: "Generate Transaction", action: generateTransaction, color: "from-[#111] to-[#444]" },
          ].map((btn, idx) => (
            <motion.button
              key={idx}
              onClick={btn.action}
              whileHover={{ scale: 1.05, boxShadow: "0 0 25px rgba(0,255,198,0.5)" }}
              whileTap={{ scale: 0.95 }}
              className={`bg-gradient-to-r ${btn.color} text-black 
                font-bold py-3 px-6 rounded-lg font-mono tracking-wider 
                border border-[#00ffc6]/60 hover:border-[#9aff68] transition-all duration-300`}
            >
              {btn.label}
            </motion.button>
          ))}
        </div>

        {/* === LOG CONSOLE === */}
        <div className="w-full mt-6 max-h-60 overflow-y-auto bg-black/70 border border-[#00ffc655] rounded-xl p-4 font-mono text-sm text-[#00ffc6]">
          {logs.length === 0 ? (
            <p className="text-gray-500 text-center italic">Awaiting command input...</p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="mb-3 border-b border-[#00ffc633] pb-2">
                <div className="text-xs text-gray-400">
                  [{log.timestamp}] <span className="uppercase text-[#8DFD1B]">{log.type}</span>
                </div>
                <div className="font-bold">{log.message}</div>
                <pre className="text-[#8DFD1B] text-xs mt-1">
                  {JSON.stringify(log.details, null, 2)}
                </pre>
              </div>
            ))
          )}
        </div>
      </motion.div>

      {/* === MODAL === */}
      <PlanetModal planet={selectedPlanet} onClose={closeModal} />

      {/* === FOOTER === */}
      <footer className="relative text-center text-xs text-[#B5C5C7] py-3 border-t border-white/10 bg-black/70 backdrop-blur-md">
        © 2025 Compliance & Trace Layer • Prototype
      </footer>
    </div>
  );
}
