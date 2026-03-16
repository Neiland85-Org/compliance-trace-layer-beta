import React from 'react';
import { motion } from 'framer-motion';

const Motion = motion;

const GameOverScreen = ({ finalScore, onRestart, onMainMenu }) => {
  return (
    <Motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
    >
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-8 max-w-md w-full mx-4 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Game Over</h2>
        <p className="text-xl text-gray-300 mb-6">
          Final Score: <span className="text-green-400 font-semibold">{finalScore}</span>
        </p>
        <div className="space-y-3">
          <button
            onClick={onRestart}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Restart Game
          </button>
          <button
            onClick={onMainMenu}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Main Menu
          </button>
        </div>
      </div>
    </Motion.div>
  );
};

export default GameOverScreen;