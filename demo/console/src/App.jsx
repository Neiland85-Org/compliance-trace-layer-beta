import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { usePlanetStore } from './hooks/usePlanetStore';

import GameOverScreen from "./components/GameOverScreen";
import GameHUD from "./components/GameHUD";
import Dashboard from "./components/Dashboard";
import Layout from "./components/Layout";

const Motion = motion;

export default function App() {
  const { stabilityScore } = usePlanetStore();

  // Derivar estado de victoria
  const isVictory = stabilityScore >= 100;
  const finalScore = useMemo(() => stabilityScore, [stabilityScore]);

  // Valor de carbonIndex por defecto (puede ser dinámico en el futuro)
  const carbonIndex = 50;

  // Handlers para restart y main menu
  const handleRestart = () => {
    const { resetStabilization } = usePlanetStore.getState();
    resetStabilization();
  };

  const handleMainMenu = () => {
    const { resetStabilization } = usePlanetStore.getState();
    resetStabilization();
    // TODO: Navigate to main menu if implemented
  };

  // Key handlers para testing
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'v') {
        // Forzar victoria estabilizando ambas zonas
        const { stabilizeZone } = usePlanetStore.getState();
        stabilizeZone('satellite', [0, 0, 0]);
        stabilizeZone('astronaut', [0, 0, 0]);
      }
      if (e.key === 'r') {
        const { resetStabilization } = usePlanetStore.getState();
        resetStabilization();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <>
      <Layout>
        <div className="flex flex-col items-center justify-center relative">
          {/* PANEL DE SIMULACIÓN DE API */}
          <Motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full bg-black/70 border-t border-[#00FFB2]/30 backdrop-blur-lg p-10 text-sm font-mono text-[#8DFD1B] overflow-y-auto max-h-[30vh]"
          >
            <h3 className="text-[#00E0FF] mb-4 font-bold tracking-widest">
              API RESPONSE STREAM
            </h3>
            <Dashboard />
          </Motion.div>
        </div>
      </Layout>

      {/* GameHUD siempre visible - overlay global */}
      <GameHUD carbonIndex={carbonIndex} stabilityScore={stabilityScore} />

      {/* GameOverScreen solo en modo victoria - overlay global */}
      <GameOverScreen
        isVisible={isVictory}
        onRestart={handleRestart}
        onMainMenu={handleMainMenu}
        finalScore={finalScore}
        cause="idempotent_victory"
        message="La idempotencia ha sido alcanzada. El sistema se sostiene a sí mismo."
      />
    </>
  );
}
