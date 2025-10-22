import { motion } from "framer-motion";
import { useMemo } from "react";
import PropTypes from "prop-types";
import { usePlanetStore } from '../hooks/usePlanetStore';

export default function GameHUD({ carbonIndex, stabilityScore = 0 }) {
  const { stabilizedZones, getStabilityPercentage } = usePlanetStore();
  const clampedIndex = Math.min(Math.max(carbonIndex, 0), 100);
  const clampedStability = Math.min(Math.max(stabilityScore, 0), 100);
  const stabilityPercentage = getStabilityPercentage();
  const totalZones = 2; // Satellite and Astronaut
  const stabilizedCount = stabilizedZones.size;

  const gameState = useMemo(() => {
    // Estado basado en estabilidad (prioridad sobre carbon)
    if (clampedStability >= 100) {
      return {
        status: "stabilized",
        gaiaMessage:
          "✨ GAIA HARMONY: System stabilized through idempotent resonance. f(f(x)) = f(x) achieved.",
        callToAction: "Perfect equilibrium maintained - all zones stabilized",
        statusColor: "#00ffff",
        primaryMetric: "stability",
      };
    } else if (clampedStability >= 75) {
      return {
        status: "stabilizing",
        gaiaMessage:
          "🔄 GAIA RESONANCE: Idempotent clicks creating harmonic patterns. System approaching stability.",
        callToAction: "Continue stabilizing remaining zones",
        statusColor: "#00dddd",
        primaryMetric: "stability",
      };
    } else if (clampedStability >= 50) {
      return {
        status: "partial",
        gaiaMessage:
          "🌊 GAIA FLOW: Stabilization waves propagating. Some zones remain unstable.",
        callToAction: "Click objects to stabilize the remaining zones",
        statusColor: "#00aaaa",
        primaryMetric: "stability",
      };
    } else if (clampedIndex > 60) {
      return {
        status: "critical",
        gaiaMessage:
          "⚠️ Gaia Alert: Carbon levels critical. Industrial activity overwhelming planetary systems.",
        callToAction: "Click Earth to deploy carbon capture technology",
        statusColor: "#FF4D4D",
        primaryMetric: "carbon",
      };
    } else if (clampedIndex >= 40) {
      return {
        status: "neutral",
        gaiaMessage:
          "🌍 Gaia Status: Planetary equilibrium maintained. Continue sustainable practices.",
        callToAction: "Maintain balance between extraction and renewal",
        statusColor: "#FFD166",
        primaryMetric: "carbon",
      };
    } else {
      return {
        status: "optimal",
        gaiaMessage:
          "✨ Gaia Harmony: Renewable energy flowing. Titan's resources supporting Earth's recovery.",
        callToAction: "Sustain this balance for long-term planetary health",
        statusColor: "#00FFB2",
        primaryMetric: "carbon",
      };
    }
  }, [clampedIndex, clampedStability]);

  return (
    <motion.div
      className="
        fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
        bg-black/40 backdrop-blur-xl border border-[#00FFB2]/40 rounded-2xl
        p-8 text-center shadow-[0_0_40px_rgba(0,255,198,0.25)]
        w-[90%] sm:w-[600px] z-40 pointer-events-auto
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

      {/* Métricas principales */}
      <div className="flex justify-center gap-8 mb-4">
        {/* Stability Score */}
        <div className="text-center">
          <div className="text-sm text-cyan-400 mb-1 font-mono">STABILITY</div>
          <motion.div
            className="text-4xl font-bold drop-shadow-[0_0_15px_rgba(0,255,255,0.5)]"
            style={{ color: gameState.primaryMetric === 'stability' ? gameState.statusColor : '#666' }}
            animate={{ scale: gameState.primaryMetric === 'stability' ? [1, 1.1, 1] : 1 }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {clampedStability}
          </motion.div>
          <div className="w-16 h-2 bg-white/10 rounded-full overflow-hidden mt-1">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: gameState.primaryMetric === 'stability' ? gameState.statusColor : '#666' }}
              animate={{ width: `${clampedStability}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Carbon Index */}
        <div className="text-center">
          <div className="text-sm text-green-400 mb-1 font-mono">CARBON</div>
          <motion.div
            className="text-4xl font-bold drop-shadow-[0_0_15px_rgba(0,255,198,0.5)]"
            style={{ color: gameState.primaryMetric === 'carbon' ? gameState.statusColor : '#666' }}
            animate={{ scale: gameState.primaryMetric === 'carbon' ? [1, 1.1, 1] : 1 }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {clampedIndex}
          </motion.div>
          <div className="w-16 h-2 bg-white/10 rounded-full overflow-hidden mt-1">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: gameState.primaryMetric === 'carbon' ? gameState.statusColor : '#666' }}
              animate={{ width: `${clampedIndex}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {/* Barra de progreso de estabilidad */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-cyan-400 text-xs font-mono uppercase tracking-wider">
            System Stability
          </span>
          <span className="text-cyan-300 text-xs font-mono">
            {stabilizedCount}/{totalZones} zones
          </span>
        </div>
        <div className="w-full h-3 bg-black/40 border border-cyan-400/30 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-500 to-cyan-300 rounded-full"
            style={{
              boxShadow: stabilityPercentage > 0 ? '0 0 10px rgba(0, 255, 255, 0.5)' : 'none'
            }}
            animate={{ width: `${stabilityPercentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
        <div className="text-center mt-1">
          <span className="text-cyan-400 text-xs font-mono">
            {Math.round(stabilityPercentage)}% Stabilized
          </span>
        </div>
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
  stabilityScore: PropTypes.number,
};
