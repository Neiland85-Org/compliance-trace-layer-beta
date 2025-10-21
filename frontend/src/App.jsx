import Layout from "./components/Layout";
import EarthScene from "./components/EarthScene";
import Dashboard from "./components/Dashboard";
import GameOverScreen from "./components/GameOverScreen";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export default function App() {
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameOverData, setGameOverData] = useState({ finalScore: 0, cause: 'rhythm' });

  // Testing trigger - TODO: Remove in production
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'g') {
        setIsGameOver(true);
        setGameOverData({ finalScore: 75, cause: 'rhythm' });
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
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

      <GameOverScreen
        isVisible={isGameOver}
        onRestart={() => { setIsGameOver(false); /* TODO: Reset game state */ }}
        onMainMenu={() => { setIsGameOver(false); /* TODO: Navigate to main menu */ }}
        finalScore={gameOverData.finalScore}
        cause={gameOverData.cause}
      />
    </Layout>
  );
}
