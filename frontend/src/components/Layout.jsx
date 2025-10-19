import { motion } from "framer-motion";
import UIConsole from "./UIConsole";
import PlanetModal from "./PlanetModal";
import { usePlanetStore } from "../hooks/usePlanetStore";

export default function Layout({ children }) {
  const { selectedPlanet, closeModal } = usePlanetStore();

  return (
    <div className="bg-gradient-to-b from-[#012C3C] to-black min-h-screen text-white">
      <section className="relative p-10 text-center">
        <motion.h1
          className="orbit-font text-4xl font-bold text-[#8DFD1B] tracking-tight"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Compliance & Trace Layer
        </motion.h1>
        <p className="mt-4 text-lg text-[#B5C5C7] max-w-2xl mx-auto">
          Blockchain verification for environmental integrity.
        </p>
      </section>

      {/* UI CONSOLE - MISSION CONTROL INTERFACE */}
      <UIConsole />

      <main className="px-10">{children}</main>

      {/* PLANET MODAL */}
      <PlanetModal planet={selectedPlanet} onClose={closeModal} />

      <footer className="mt-20 text-center text-xs text-[#B5C5C7] border-t border-white/10 py-6">
        © 2025 Compliance & Trace Layer • Prototype
      </footer>
    </div>
  );
}
