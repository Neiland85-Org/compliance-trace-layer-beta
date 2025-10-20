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
import { useMemo } from "react";
import PropTypes from "prop-types";

export default function GameHUD({ carbonIndex }) {
  const clampedIndex = Math.min(Math.max(carbonIndex, 0), 100);

  const gameState = useMemo(() => {
    if (clampedIndex > 60) {
      return {
        status: "critical",
        gaiaMessage:
          "⚠️ Gaia Alert: Carbon levels critical. Industrial activity overwhelming planetary systems.",
        callToAction: "Click Earth to deploy carbon capture technology",
        statusColor: "#FF4D4D",
      };
    } else if (clampedIndex >= 40) {
      return {
        status: "neutral",
        gaiaMessage:
          "🌍 Gaia Status: Planetary equilibrium maintained. Continue sustainable practices.",
        callToAction: "Maintain balance between extraction and renewal",
        statusColor: "#FFD166",
      };
    } else {
      return {
        status: "optimal",
        gaiaMessage:
          "✨ Gaia Harmony: Renewable energy flowing. Titan’s resources supporting Earth’s recovery.",
        callToAction: "Sustain this balance for long-term planetary health",
        statusColor: "#00FFB2",
      };
    }
  }, [clampedIndex]);

  return (
    <motion.div
      className="
        absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
        bg-black/40 backdrop-blur-xl border border-[#00FFB2]/40 rounded-2xl 
        p-8 text-center shadow-[0_0_40px_rgba(0,255,198,0.25)] 
        w-[90%] sm:w-[500px] z-40 pointer-events-auto
      "
      initial={{ opacity: 0, scale: 0.95, y: -20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      {/* Título GAIA */}
      <motion.h3
        className="text-[#00FFB2] text-sm tracking-widest mb-3 font-mono uppercase"
        animate={{ opacity: [1, 0.6, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        GAIA TRANSMISSION
      </motion.h3>

      {/* Carbon Index grande en el centro */}
      <motion.div
        className="text-6xl font-bold mb-3 drop-shadow-[0_0_15px_rgba(0,255,198,0.5)]"
        style={{ color: gameState.statusColor }}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {clampedIndex}
      </motion.div>

      {/* Barra de progreso */}
      <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden mb-4">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: gameState.statusColor }}
          animate={{ width: `${clampedIndex}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>

      {/* Mensaje y CTA */}
      <motion.p
        className="text-white/90 text-sm leading-relaxed mb-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {gameState.gaiaMessage}
      </motion.p>

      <motion.p
        className="text-[#9aff68] text-xs tracking-widest uppercase"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {gameState.callToAction}
      </motion.p>
    </motion.div>
  );
}

GameHUD.propTypes = {
  carbonIndex: PropTypes.number.isRequired,
};
