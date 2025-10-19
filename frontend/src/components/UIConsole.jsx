import { motion } from "framer-motion";

export default function UIConsole() {
  return (
    <div className="absolute top-0 left-0 right-0 z-10 p-6 space-y-4">
      {/* HEADER ANIMADO */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center"
      >
        <motion.h1
          className="text-4xl md:text-6xl font-bold text-[#9aff68] mb-2 tracking-wider"
          style={{
            textShadow: "0 0 20px #9aff68, 0 0 40px #9aff68, 0 0 60px #9aff68"
          }}
          animate={{
            textShadow: [
              "0 0 20px #9aff68, 0 0 40px #9aff68, 0 0 60px #9aff68",
              "0 0 10px #9aff68, 0 0 20px #9aff68, 0 0 30px #9aff68",
              "0 0 20px #9aff68, 0 0 40px #9aff68, 0 0 60px #9aff68"
            ]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          COMPLIANCE TRACE LAYER
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="text-[#7cf9ff] text-lg md:text-xl font-mono tracking-widest"
        >
          BLOCKCHAIN ENVIRONMENTAL VERIFICATION SYSTEM
        </motion.p>
      </motion.header>

      {/* BLOQUE DE TRANSMISIÓN GAIA */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="bg-black/80 border-2 border-[#00ffc6] rounded-lg p-4 backdrop-blur-sm"
        style={{
          boxShadow: "0 0 20px rgba(0, 255, 198, 0.3), inset 0 0 20px rgba(0, 255, 198, 0.1)"
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[#00ffc6] font-bold text-sm font-mono tracking-widest">
            GAIA TRANSMISSION
          </h3>
          <motion.div
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-2 h-2 bg-[#00ffc6] rounded-full"
          />
        </div>
        <div className="text-[#9aff68] text-xs font-mono space-y-1">
          <p>► Carbon footprint analysis: ACTIVE</p>
          <p>► Blockchain verification: SYNCED</p>
          <p>► Environmental compliance: MONITORING</p>
          <p>► Transaction security: ENCRYPTED</p>
        </div>
      </motion.div>

      {/* MEDIDOR CARBON INDEX */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="bg-black/80 border border-[#00ffc6]/50 rounded-lg p-4 backdrop-blur-sm"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[#7cf9ff] font-mono text-sm">CARBON INDEX</span>
          <motion.span
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-[#9aff68] font-bold text-lg"
          >
            80 ⚠️
          </motion.span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "80%" }}
            transition={{ delay: 1, duration: 1.5, ease: "easeOut" }}
            className="bg-gradient-to-r from-[#00ffc6] to-[#9aff68] h-2 rounded-full"
            style={{
              boxShadow: "0 0 10px rgba(0, 255, 198, 0.5)"
            }}
          />
        </div>
        <p className="text-[#7cf9ff] text-xs font-mono mt-2">Threshold: 60 | Status: ELEVATED</p>
      </motion.div>

      {/* PANEL DE ACCIÓN */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.6 }}
        className="text-center"
      >
        <motion.button
          whileHover={{
            scale: 1.05,
            boxShadow: "0 0 30px rgba(0, 255, 198, 0.6)"
          }}
          whileTap={{ scale: 0.95 }}
          className="bg-gradient-to-r from-[#00ffc6] to-[#9aff68] text-black font-bold py-3 px-8 rounded-lg font-mono tracking-wider border-2 border-[#00ffc6] hover:border-[#9aff68] transition-all duration-300"
          style={{
            textShadow: "0 0 5px rgba(0, 0, 0, 0.5)"
          }}
        >
          GENERATE TRANSACTION
        </motion.button>
      </motion.div>

      {/* FOOTER DISCRETO */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="text-center pt-4 border-t border-[#00ffc6]/20"
      >
        <p className="text-[#7cf9ff] text-xs font-mono">
          Compliance Trace Layer v0.1.0-beta | Environmental Blockchain Protocol
        </p>
      </motion.footer>
    </div>
  );
}