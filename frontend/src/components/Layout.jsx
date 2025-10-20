import { motion } from "framer-motion";
import UIConsole from "./UIConsole";
import PlanetModal from "./PlanetModal";
import { usePlanetStore } from "../hooks/usePlanetStore";
import EarthScene from "./EarthScene";

export default function Layout({ children }) {
  const { selectedPlanet, closeModal } = usePlanetStore();

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
                   flex flex-wrap justify-center gap-6 py-6 px-4"
      >
        {[
          { label: "Verify Block", color: "from-[#00ffcc] to-[#0077ff]" },
          { label: "Generate Report", color: "from-[#9aff68] to-[#f0ff00]" },
          { label: "Deploy Protocol", color: "from-[#ff6600] to-[#ffaa00]" },
          { label: "Generate Transaction", color: "from-[#111] to-[#444]" },
        ].map((btn, idx) => (
          <motion.button
            key={idx}
            whileHover={{ scale: 1.05, boxShadow: "0 0 25px rgba(0,255,198,0.5)" }}
            whileTap={{ scale: 0.95 }}
            className={`bg-gradient-to-r ${btn.color} text-black 
              font-bold py-3 px-6 rounded-lg font-mono tracking-wider 
              border border-[#00ffc6]/60 hover:border-[#9aff68] transition-all duration-300`}
          >
            {btn.label}
          </motion.button>
        ))}
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
