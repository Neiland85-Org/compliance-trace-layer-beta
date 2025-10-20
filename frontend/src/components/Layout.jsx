import { motion } from "framer-motion";
import PlanetModal from "./PlanetModal";
import { usePlanetStore } from "../hooks/usePlanetStore";
import EarthScene from "./EarthScene";

export default function Layout({ children }) {
  const { selectedPlanet, closeModal } = usePlanetStore();

  return (
    <div className="relative w-full min-h-screen text-white overflow-hidden bg-black">
      {/* === COSMIC SKY BANNER ocupa casi toda la pantalla === */}
      <section className="relative w-full h-[120vh]">
        <EarthScene />
        <div className="absolute bottom-20 z-20 flex flex-col items-center w-full text-center">
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
        <div className="absolute bottom-0 w-full h-64 bg-gradient-to-b from-transparent to-black z-10" />
      </section>

      {/* === MAIN CONTENT === */}
      <main className="relative z-30 px-10 py-20 bg-black">{children}</main>

      {/* === FOOTER === */}
      <footer className="relative text-center text-xs text-[#B5C5C7] py-3 border-t border-white/10 bg-black/70 backdrop-blur-md">
        © 2025 Compliance & Trace Layer • Prototype
      </footer>

      <PlanetModal planet={selectedPlanet} onClose={closeModal} />
    </div>
  );
}
