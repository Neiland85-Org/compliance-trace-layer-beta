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

export default function HUDStatus() {
  const indicators = [
    {
      label: "Network",
      value: "SYNCED",
      color: "#00ffc6",
    },
    {
      label: "Transactions",
      value: "ACTIVE",
      color: "#9aff68",
    },
    {
      label: "Emission Index",
      value: "82 ⚠️",
      color: "#ff5959",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1 }}
      className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 
                 w-[90%] sm:w-[80%] md:w-[60%] lg:w-[700px] 
                 bg-black/60 border border-[#00ffc6]/30 rounded-2xl
                 p-3 sm:p-4 backdrop-blur-md 
                 flex flex-col sm:flex-row items-center justify-around
                 shadow-[0_0_25px_rgba(0,255,198,0.2)]
                 text-xs sm:text-sm font-mono text-gray-300"
      style={{
        boxShadow:
          "0 0 25px rgba(0,255,198,0.15), inset 0 0 10px rgba(0,255,198,0.05)",
      }}
    >
      {indicators.map((item, index) => (
        <motion.div
          key={item.label}
          className="flex items-center gap-2 px-2 sm:px-3 py-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 + index * 0.2 }}
        >
          <span className="uppercase tracking-widest text-[#7cf9ff]">
            {item.label}:
          </span>
          <motion.span
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{
              duration: 1.4 + index * 0.4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="font-bold"
            style={{ color: item.color }}
          >
            {item.value}
          </motion.span>
        </motion.div>
      ))}
    </motion.div>
  );
}
