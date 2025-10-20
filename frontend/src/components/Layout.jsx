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
import { motion } from "framer-motion";
import UIConsole from "./UIConsole";
import PlanetModal from "./PlanetModal";
import { usePlanetStore } from "../hooks/usePlanetStore";

export default function Layout({ children }) {
  const { selectedPlanet, closeModal } = usePlanetStore();

  return (
    <div className="relative w-full min-h-screen text-white overflow-hidden bg-black">
      {/* === FULLSCREEN COSMIC SCENE === */}
      <div className="relative h-screen w-full">
        {children}
        <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-b from-black/30 via-transparent to-black/90" />
      </div>

      {/* === FLOATING HEADER === */}
      <div className="absolute top-0 z-30 w-full flex flex-col items-center text-center mt-10">
        <motion.h1
          className="text-5xl md:text-6xl font-extrabold text-[#00ffc6] tracking-wider drop-shadow-[0_0_25px_#00ffc6]"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          COMPLIANCE TRACE LAYER
        </motion.h1>
        <motion.p
          className="text-sm md:text-base tracking-widest text-gray-300 uppercase mt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          Environmental Blockchain Command Interface
        </motion.p>
      </div>

      {/* === BOTTOM CONTROL PANEL === */}
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.8 }}
        className="absolute bottom-0 left-0 right-0 z-40 
                   bg-gradient-to-t from-black/90 via-black/60 to-transparent
                   backdrop-blur-lg border-t border-[#00ffc655]
                   flex flex-wrap justify-center gap-6 py-6 px-4"
      >
        {[
          { label: "Verify Block", color: "from-[#00ffcc] to-[#0077ff]" },
          { label: "Generate Report", color: "from-[#9aff68] to-[#f0ff00]" },
          { label: "Deploy Protocol", color: "from-[#ff6600] to-[#ffaa00]" },
          { label: "Generate Transaction", color: "from-[#111] to-[#444]" }
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

      {/* === PLANET MODAL === */}
      <PlanetModal planet={selectedPlanet} onClose={closeModal} />

      {/* === FOOTER === */}
      <footer className="absolute bottom-0 w-full text-center text-xs text-[#B5C5C7] py-2 border-t border-white/10 z-50 bg-black/60 backdrop-blur-md">
        © 2025 Compliance & Trace Layer • Prototype
      </footer>
    </div>
  );
}
