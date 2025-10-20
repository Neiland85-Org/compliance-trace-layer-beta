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
import { motion, AnimatePresence } from "framer-motion";

const planetData = {
  Earth: {
    name: "Earth",
    co2Level: 415,
    blockchainSync: "98.7%",
    environmentalScore: 72,
    status: "CRITICAL",
    color: "#00E0FF",
    description: "Primary carbon emission source. Requires immediate intervention protocols."
  },
  Mars: {
    name: "Mars",
    co2Level: 8,
    blockchainSync: "99.2%",
    environmentalScore: 89,
    status: "STABLE",
    color: "#FF4D4D",
    description: "Secondary monitoring station. Carbon capture operations active."
  },
  Titan: {
    name: "Titan",
    co2Level: 2,
    blockchainSync: "97.8%",
    environmentalScore: 94,
    status: "OPTIMAL",
    color: "#FFD166",
    description: "Remote environmental research outpost. Clean energy protocols engaged."
  }
};

export default function PlanetModal({ planet, onClose }) {
  if (!planet) return null;

  const data = planetData[planet];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Overlay con blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative bg-black/90 border-2 rounded-xl p-6 max-w-md w-full mx-4"
          style={{
            borderColor: data.color,
            boxShadow: `0 0 40px ${data.color}40, inset 0 0 40px ${data.color}10`
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Botón de cerrar */}
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold"
            style={{
              borderColor: data.color,
              color: data.color,
              background: `radial-gradient(circle, ${data.color}20, transparent)`
            }}
          >
            ×
          </motion.button>

          {/* Header */}
          <div className="mb-6">
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-bold font-mono tracking-wider mb-2"
              style={{ color: data.color }}
            >
              {data.name} STATION
            </motion.h2>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-sm text-gray-300 font-mono"
            >
              {data.description}
            </motion.div>
          </div>

          {/* Status Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="mb-4"
          >
            <span
              className="px-3 py-1 rounded-full text-xs font-bold font-mono tracking-wider"
              style={{
                backgroundColor: `${data.color}20`,
                color: data.color,
                border: `1px solid ${data.color}60`
              }}
            >
              STATUS: {data.status}
            </span>
          </motion.div>

          {/* Métricas */}
          <div className="space-y-4 mb-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="flex justify-between items-center"
            >
              <span className="text-gray-300 font-mono text-sm">CO₂ LEVEL</span>
              <span className="font-bold font-mono" style={{ color: data.color }}>
                {data.co2Level} ppm
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="flex justify-between items-center"
            >
              <span className="text-gray-300 font-mono text-sm">BLOCKCHAIN SYNC</span>
              <span className="font-bold font-mono" style={{ color: data.color }}>
                {data.blockchainSync}
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              className="flex justify-between items-center"
            >
              <span className="text-gray-300 font-mono text-sm">ENVIRONMENTAL SCORE</span>
              <span className="font-bold font-mono" style={{ color: data.color }}>
                {data.environmentalScore}/100
              </span>
            </motion.div>
          </div>

          {/* Gráfica animada */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mb-6"
          >
            <div className="text-sm text-gray-300 font-mono mb-2">EMISSION SENSORS</div>
            <div className="flex items-end justify-between h-16 space-x-1">
              {[0.3, 0.7, 0.5, 0.9, 0.4, 0.8, 0.6, 0.2].map((height, index) => (
                <motion.div
                  key={index}
                  initial={{ height: 0 }}
                  animate={{ height: `${height * 100}%` }}
                  transition={{
                    delay: 0.9 + index * 0.1,
                    duration: 0.8,
                    ease: "easeOut"
                  }}
                  className="flex-1 rounded-t-sm"
                  style={{
                    backgroundColor: data.color,
                    boxShadow: `0 0 10px ${data.color}60`
                  }}
                />
              ))}
            </div>
          </motion.div>

          {/* Botón de acción */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            whileHover={{
              scale: 1.02,
              boxShadow: `0 0 20px ${data.color}60`
            }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 px-4 rounded-lg font-bold font-mono tracking-wider border-2 transition-all duration-300"
            style={{
              background: `linear-gradient(135deg, ${data.color}20, ${data.color}10)`,
              borderColor: data.color,
              color: data.color
            }}
          >
            DEPLOY CAPTURE PROTOCOL
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}