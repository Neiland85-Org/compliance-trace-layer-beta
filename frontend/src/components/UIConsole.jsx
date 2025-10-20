import { motion } from "framer-motion";

export default function UIConsole() {
  return (
    <div className="absolute bottom-4 left-4 z-20 bg-black/60 border border-[#00ffc6]/30 rounded-2xl p-4 backdrop-blur-md">
      <motion.h1
        className="text-lg font-bold text-[#00ffc6]"
        style={{
          textShadow:
            "0 0 10px #00ffc6, 0 0 30px #00ffc6, 0 0 60px rgba(0,255,198,0.7)",
        }}
      >
        Compliance Trace Layer
      </motion.h1>

      <p className="mt-2 text-gray-300 text-xs sm:text-sm md:text-base uppercase tracking-[0.2em]">
        Environmental Blockchain Command Interface
      </p>

      {/* --- HUD: GAIA TRANSMISSION --- */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="relative mt-6 bg-black/60 border border-[#00ffc6]/40 rounded-2xl p-4 sm:p-6 w-full max-w-3xl backdrop-blur-sm shadow-[0_0_25px_rgba(0,255,198,0.15)]"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[#00ffc6] font-bold text-sm sm:text-base font-mono tracking-widest">
            GAIA TRANSMISSION
          </h3>
          <motion.div
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-3 h-3 bg-[#00ffc6] rounded-full shadow-[0_0_15px_#00ffc6]"
          />
        </div>
        <div className="text-[#9aff68] text-xs sm:text-sm font-mono space-y-1">
          <p>► Carbon footprint analysis: ACTIVE</p>
          <p>► Blockchain verification: SYNCED</p>
          <p>► Environmental compliance: MONITORING</p>
          <p>► Transaction security: ENCRYPTED</p>
        </div>
      </motion.div>

      {/* --- PANEL CARBON INDEX --- */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.6 }}
        className="relative mt-4 bg-black/60 border border-[#00ffc6]/30 rounded-2xl p-4 sm:p-6 w-full max-w-3xl backdrop-blur-sm shadow-[0_0_25px_rgba(0,255,198,0.1)]"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[#7cf9ff] font-mono text-sm sm:text-base">
            CARBON INDEX
          </span>
          <motion.span
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-[#9aff68] font-bold text-lg sm:text-xl"
          >
            80 ⚠️
          </motion.span>
        </div>
        <div className="w-full bg-gray-800/60 rounded-full h-2 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "80%" }}
            transition={{ delay: 1, duration: 1.5, ease: "easeOut" }}
            className="bg-gradient-to-r from-[#00ffc6] to-[#9aff68] h-2 rounded-full shadow-[0_0_10px_rgba(0,255,198,0.6)]"
          />
        </div>
        <p className="text-[#7cf9ff] text-xs font-mono mt-2">
          Threshold: 60 | Status: ELEVATED
        </p>
      </motion.div>

      {/* --- BOTONES PRINCIPALES --- */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.6 }}
        className="mt-6 flex flex-wrap justify-center gap-4 sm:gap-6"
      >
        {[
          { label: "Verify Block", colorFrom: "#00ffcc", colorTo: "#0077ff" },
          { label: "Generate Report", colorFrom: "#9aff68", colorTo: "#00ffc6" },
          { label: "Deploy Protocol", colorFrom: "#ffcc00", colorTo: "#ff6600" },
        ].map((btn, i) => (
          <motion.button
            key={i}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            className="relative group px-8 py-3 rounded-xl overflow-hidden font-bold text-black tracking-widest uppercase transition-all duration-300"
            style={{
              background: `linear-gradient(90deg, ${btn.colorFrom}, ${btn.colorTo})`,
              boxShadow: `0 0 30px ${btn.colorFrom}55`,
            }}
          >
            <span className="relative z-10">{btn.label}</span>
            <span className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-white/20 to-transparent blur-md transition-opacity duration-300"></span>
          </motion.button>
        ))}
      </motion.div>

      {/* --- FOOTER --- */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        className="text-center mt-6 border-t border-[#00ffc6]/20 pt-3 w-full max-w-3xl"
      >
        <p className="text-[#7cf9ff] text-xs sm:text-sm font-mono opacity-70">
          Compliance Trace Layer v0.1.0-beta | Environmental Blockchain Protocol
        </p>
      </motion.footer>
    </div>
  );
}
