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
        <div className="w-full bg-black/70 border-t border-[#00FFB2]/30 backdrop-blur-lg p-10 text-sm font-mono text-[#8DFD1B] overflow-y-auto max-h-[30vh]">
          <h3 className="text-[#00E0FF] mb-4 font-bold tracking-widest">
            API RESPONSE STREAM
          </h3>
          <Dashboard />
        </div>
      </div>
    </Layout>
  );
}
