import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import GameHUD from "./components/GameHUD";
import GameOverScreen from "./components/GameOverScreen";
import { motion } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
<<<<<<< HEAD
import { usePlanetStore } from "./hooks/usePlanetStore";

export default function App() {
  const { stabilityScore, getStabilityPercentage } = usePlanetStore();
  const stabilityPercentage = getStabilityPercentage();

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
=======
import { usePlanetStore } from './hooks/usePlanetStore';

export default function App() {
  // Store subscriptions
  const gameState = usePlanetStore(state => state.gameState);
  const finalScore = usePlanetStore(state => state.finalScore);
  const totalClicks = usePlanetStore(state => state.totalClicks);
  const validPatterns = usePlanetStore(state => state.validPatterns);
  const gameStartTime = usePlanetStore(state => state.gameStartTime);
  const resetGame = usePlanetStore(state => state.resetGame);

  // Derive state
  const isGameOver = gameState === 'GAME_OVER';
  const isWin = gameState === 'WIN';

  // Calculate survival time
  const survivalTime = useMemo(() => {
    if (!gameStartTime) return '0:00';
    const elapsed = Date.now() - gameStartTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [gameStartTime, gameState]);
>>>>>>> a2ee324 (Implement complete game mechanics with physics-based astronaut movement, rhythm pattern validation, collision detection, and comprehensive UI feedback)

  return (
    <>
      <Layout>
        <div className="flex flex-col items-center justify-center relative">
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

      {/* GameHUD siempre visible - overlay global */}
      <GameHUD carbonIndex={carbonIndex} stabilityScore={stabilityScore} />

      {/* GameOverScreen solo en modo victoria - overlay global */}
      <GameOverScreen
<<<<<<< HEAD
        isVisible={isVictory}
        onRestart={handleRestart}
        onMainMenu={handleMainMenu}
        finalScore={finalScore}
        cause="idempotent_victory"
        message="La idempotencia ha sido alcanzada. El sistema se sostiene a sí mismo."
      />
    </>
=======
        isVisible={isGameOver || isWin}
        onRestart={() => {
          resetGame();
        }}
        onMainMenu={() => {
          resetGame();
          // TODO: Navigate to main menu if implemented
          window.location.reload(); // Temporary: reload page
        }}
        finalScore={finalScore}
        cause={isWin ? 'win' : 'rhythm'}
        totalClicks={totalClicks}
        validPatterns={validPatterns}
        survivalTime={survivalTime}
      />

      {/* Debug indicator */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 left-4 bg-black/80 text-white p-2 rounded text-xs font-mono z-50">
          Game State: {gameState}
        </div>
      )}
    </Layout>
>>>>>>> a2ee324 (Implement complete game mechanics with physics-based astronaut movement, rhythm pattern validation, collision detection, and comprehensive UI feedback)
  );
}
