import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { useMemo } from 'react';

const Motion = motion;

export default function RhythmFeedback({
  isPatternValid,
  patternScore,
  streak,
  failureCount
}) {
  const scorePercentage = Math.round(patternScore || 0);

  // Calculate circular progress path
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scorePercentage / 100) * circumference;

  return (
    <Motion.div
      className="fixed top-4 right-4 z-40 pointer-events-none"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
    >
      {/* Pattern Status Indicator */}
      <Motion.div
        className={`bg-black/60 backdrop-blur-xl border rounded-2xl p-4 mb-2 ${isPatternValid === true
            ? 'border-green-500/50 shadow-[0_0_20px_rgba(0,255,178,0.3)]'
            : isPatternValid === false
              ? 'border-red-500/50 shadow-[0_0_20px_rgba(255,0,0,0.3)]'
              : 'border-gray-500/30'
          }`}
        animate={isPatternValid === true ? { scale: [1, 1.1, 1] } : { scale: 1 }}
        transition={{ duration: 0.3 }}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-3">
          <div className="text-2xl">
            {isPatternValid === true ? '✓' : isPatternValid === false ? '✗' : '○'}
          </div>
          <div className="flex-1">
            <div className={`text-sm font-bold ${isPatternValid === true ? 'text-green-400' :
                isPatternValid === false ? 'text-red-400' : 'text-gray-400'
              }`}>
              {isPatternValid === true ? 'PATRÓN VÁLIDO' :
                isPatternValid === false ? 'PATRÓN INVÁLIDO' : 'ESPERANDO PATRÓN'}
            </div>
            <div className="text-xs text-gray-300">
              Precisión: {scorePercentage}%
            </div>
          </div>

          {/* Circular Progress Indicator */}
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 70 70">
              <circle
                cx="35"
                cy="35"
                r={radius}
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                className="text-gray-600"
              />
              <Motion.circle
                cx="35"
                cy="35"
                r={radius}
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 0.5 }}
                className={
                  scorePercentage >= 80 ? 'text-green-400' :
                    scorePercentage >= 60 ? 'text-yellow-400' : 'text-red-400'
                }
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-white">{scorePercentage}%</span>
            </div>
          </div>
        </div>
      </Motion.div>

      {/* Streak Counter */}
      {streak > 0 && (
        <Motion.div
          className="bg-gradient-to-r from-cyan-500/20 to-green-500/20 border border-cyan-500/50 rounded-xl p-3 mb-2"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          key={streak}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="text-center">
            <div className="text-2xl font-bold text-cyan-300">{streak}</div>
            <div className="text-xs text-cyan-400">RACHA</div>
            <div className="text-xs text-cyan-500">×{streak}</div>
          </div>
        </Motion.div>
      )}

      {/* Failure Warning */}
      {failureCount > 0 && (
        <Motion.div
          className={`border rounded-xl p-3 ${failureCount >= 3
              ? 'bg-red-900/30 border-red-500/50'
              : failureCount === 2
                ? 'bg-orange-900/30 border-orange-500/50'
                : 'bg-yellow-900/30 border-yellow-500/50'
            }`}
          animate={failureCount > 0 ? { x: [-5, 5, -5, 5, 0] } : { x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center gap-2">
            <div className="text-lg">⚠️</div>
            <div>
              <div className="text-sm font-bold text-white">
                FALLOS: {failureCount}/3
              </div>
              <div className="text-xs text-gray-300">
                {failureCount >= 3 ? '¡AGUJERO NEGRO ACTIVADO!' :
                  failureCount === 2 ? '¡Peligro inminente!' : 'Cuidado...'}
              </div>
            </div>
          </div>

          {/* Danger Progress Bar */}
          <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
            <Motion.div
              className={`h-2 rounded-full ${failureCount >= 3 ? 'bg-red-500' :
                  failureCount === 2 ? 'bg-orange-500' : 'bg-yellow-500'
                }`}
              initial={{ width: 0 }}
              animate={{ width: `${(failureCount / 3) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </Motion.div>
      )}
    </Motion.div>
  );
}

RhythmFeedback.propTypes = {
  isPatternValid: PropTypes.bool,
  patternScore: PropTypes.number,
  streak: PropTypes.number,
  failureCount: PropTypes.number
};
