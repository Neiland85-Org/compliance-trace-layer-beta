import { motion } from "framer-motion";
import { useMemo } from "react";
import PropTypes from "prop-types";

export default function GameHUD({ carbonIndex }) {
  // Clamp carbonIndex to 0-100 range for robustness
  const clampedIndex = Math.min(Math.max(carbonIndex, 0), 100);

  const gameState = useMemo(() => {
    if (clampedIndex > 60) {
      return {
        status: 'critical',
        gaiaMessage: "Gaia Alert: Carbon levels critical. Industrial activity overwhelming planetary systems.",
        callToAction: "Click Earth to deploy carbon capture technology",
        statusColor: '#FF4D4D',
        emoji: '⚠️'
      };
    } else if (carbonIndex >= 40) {
      return {
        status: 'neutral',
        gaiaMessage: "Gaia Status: Planetary equilibrium maintained. Continue sustainable practices.",
        callToAction: "Maintain balance between extraction and renewal",
        statusColor: '#FFD166',
        emoji: '🌍'
      };
    } else {
      return {
        status: 'optimal',
        gaiaMessage: "Gaia Harmony: Renewable energy flowing. Titan's resources supporting Earth's recovery.",
        callToAction: "Sustain this balance for long-term planetary health",
        statusColor: '#00FFB2',
        emoji: '✨'
      };
    }
  }, [clampedIndex]);

  return (
    <motion.div
      className="fixed top-6 left-6 w-96 bg-black/70 backdrop-blur-lg border border-[#00FFB2]/30 rounded-2xl p-6 shadow-2xl pointer-events-auto z-50"
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      role="status"
      aria-live="polite"
    >
      {/* Header Section */}
      <div className="mb-4">
        <div className="text-xs text-[#00FFB2] font-orbit tracking-widest mb-2">
          CARBON INDEX
        </div>
        <div
          className="text-5xl font-bold font-orbit"
          style={{ color: gameState.statusColor }}
        >
          {clampedIndex}{gameState.emoji}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-4">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: gameState.statusColor }}
          animate={{ width: `${clampedIndex}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Gaia Message Section */}
      <motion.div
        key={`gaia-${gameState.status}`}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-4"
      >
        <div className="text-xs text-[#8DFD1B] font-orbit tracking-widest mb-1">
          GAIA TRANSMISSION
        </div>
        <div className="text-sm text-white/90 leading-relaxed">
          {gameState.gaiaMessage}
        </div>
      </motion.div>

      {/* Call-to-Action Section */}
      <motion.div
        key={`cta-${gameState.status}`}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="text-xs text-[#00E0FF] font-orbit tracking-widest mb-1">
          MISSION DIRECTIVE
        </div>
        <div className="text-sm text-[#8DFD1B] font-semibold">
          {gameState.callToAction}
        </div>
      </motion.div>
    </motion.div>
  );
}

GameHUD.propTypes = {
  carbonIndex: PropTypes.number.isRequired
};