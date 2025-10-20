import { motion } from "framer-motion";
import UIConsole from "./UIConsole";
import HUDStatus from "./HUDStatus";
import PlanetModal from "./PlanetModal";
import { usePlanetStore } from "../hooks/usePlanetStore";

export default function Layout({ children }) {
  const { selectedPlanet, closeModal } = usePlanetStore();

  return (
    <div className="relative w-full h-screen overflow-hidden text-white font-sans">
      {/* === COSMIC BACKGROUND === */}
      <div className="absolute inset-0 bg-black">
        {children /* Aquí se renderiza EarthScene u otros mundos */}
        {/* Overlay para legibilidad */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#00000099] via-[#00000033] to-transparent pointer-events-none" />
      </div>

      {/* === HUD PRINCIPAL === */}
      <div className="absolute inset-0 flex flex-col justify-between z-20">
        {/* Header y consola principal */}
        <UIConsole />

        {/* HUD inferior con indicadores */}
        <HUDStatus />
      </div>

      {/* === PLANET MODAL === */}
      {selectedPlanet && (
        <PlanetModal planet={selectedPlanet} onClose={closeModal} />
      )}

      {/* === FOOTER BASE === */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="absolute bottom-0 left-0 w-full text-center text-[10px] sm:text-xs text-[#B5C5C7] border-t border-white/10 py-3 z-10 bg-black/20 backdrop-blur-sm"
      >
      </motion.footer>
    </div>
  );
}
