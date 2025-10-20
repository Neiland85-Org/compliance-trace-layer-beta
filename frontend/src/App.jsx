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
import Layout from "./components/Layout";
import EarthScene from "./components/EarthScene";
import Dashboard from "./components/Dashboard";
import { motion } from "framer-motion";

export default function App() {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center relative">
        {/* ESCENA 3D INTERACTIVA */}
        <EarthScene />

        {/* PANEL DE SIMULACIÓN DE API */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full bg-black/70 border-t border-[#00FFB2]/30 backdrop-blur-lg p-10 text-sm font-mono text-[#8DFD1B] overflow-y-auto max-h-[30vh]"
        >
          <h3 className="text-[#00E0FF] mb-4 font-bold tracking-widest">
            API RESPONSE STREAM
          </h3>
          <Dashboard />
        </motion.div>
      </div>
    </Layout>
  );
}
