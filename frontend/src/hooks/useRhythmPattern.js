import { useState, useCallback, useRef, useEffect } from 'react';
import Meyda from 'meyda';

/**
 * Custom React hook for detecting and validating rhythmic click patterns with optional Meyda audio analysis.
 *
 * Example usage:
 * const rhythm = useRhythmPattern({
 *   minPatternLength: 3,
 *   requiredRepetitions: 2,
 *   tolerancePercent: 10
 * });
 *
 * // For audio-based rhythm analysis (optional):
 * const rhythmWithAudio = useRhythmPattern({
 *   useMeyda: true,
 *   meydaFeatures: ['rms', 'spectralFlux'],
 *   meydaBufferSize: 512
 * });
 *
 * // Initialize with audio when available:
 * const { initMeyda, startMeyda, stopMeyda } = rhythmWithAudio;
 * if (audioContext && source) {
 *   initMeyda({ audioContext, source });
 *   startMeyda();
 * }
 *
 * <Astronaut onClick={rhythm.handleClick} />
 * {rhythm.isPatternValid && <div>Valid! Score: {rhythm.patternScore}</div>}
 */
function useRhythmPattern(options = {}) {
  const {
    minPatternLength = 3,
    requiredRepetitions = 2,
    tolerancePercent = 10,
    maxHistorySize = 20,
    patternTimeout = 3000,
    debug = false,
    useMeyda = false,
    meydaFeatures = ['rms', 'spectralFlux'],
    meydaBufferSize = 512
  } = options;

  // State variables
  const [clickHistory, setClickHistory] = useState([]);
  const [isPatternValid, setIsPatternValid] = useState(false);
  const [patternScore, setPatternScore] = useState(0);
  const [currentPattern, setCurrentPattern] = useState(null);
  const [detectedRepetitions, setDetectedRepetitions] = useState(0);
  const [streak, setStreak] = useState(0);

  // Refs
  const timeoutRef = useRef(null);
  const clickCountRef = useRef(0);
  const meydaAnalyzerRef = useRef(null);

  // Initialize Meyda for potential audio analysis (placeholder for future audio-based rhythm detection)
  useEffect(() => {
    // Meyda requires an audio source; currently no audio input, so analyzer is null
    // Future: meydaAnalyzerRef.current = Meyda.createMeydaAnalyzer({ audioContext, source, bufferSize: 512, featureExtractors: ['rms', 'spectralFlux'] });
    meydaAnalyzerRef.current = null; // Placeholder
  }, []);

  // Meyda integration callbacks
  const initMeyda = useCallback(({ audioContext, source, featureExtractors = meydaFeatures, bufferSize = meydaBufferSize }) => {
    if (!useMeyda) {
      meydaAnalyzerRef.current = {
        start: () => {},
        stop: () => {}
      };
      return false;
    }

    if (!audioContext || !source) {
      meydaAnalyzerRef.current = {
        start: () => {},
        stop: () => {}
      };
      return false;
    }

    try {
      meydaAnalyzerRef.current = Meyda.createMeydaAnalyzer({
        audioContext,
        source,
        bufferSize,
        featureExtractors,
        callback: (features) => {
          // Optionally map features to timing stability signals later
          if (debug) {
            console.log('Meyda features:', features);
          }
        }
      });
      return true;
    } catch (error) {
      console.warn('Failed to initialize Meyda analyzer:', error);
      meydaAnalyzerRef.current = {
        start: () => {},
        stop: () => {}
      };
      return false;
    }
  }, [useMeyda, meydaFeatures, meydaBufferSize, debug]);

  const startMeyda = useCallback(() => {
    if (meydaAnalyzerRef.current && typeof meydaAnalyzerRef.current.start === 'function') {
      try {
        meydaAnalyzerRef.current.start();
      } catch (error) {
        console.warn('Failed to start Meyda analyzer:', error);
      }
    }
  }, []);

  const stopMeyda = useCallback(() => {
    if (meydaAnalyzerRef.current && typeof meydaAnalyzerRef.current.stop === 'function') {
      try {
        meydaAnalyzerRef.current.stop();
      } catch (error) {
        console.warn('Failed to stop Meyda analyzer:', error);
      }
    }
  }, []);

  // Helper functions
  const intervalsMatch = useCallback((pattern1, pattern2, tolerance) => {
    if (pattern1.length !== pattern2.length) return false;
    for (let i = 0; i < pattern1.length; i++) {
      const base = Math.max(1, Math.max(pattern1[i], pattern2[i])); // symmetric epsilon
      const variance = Math.abs(pattern1[i] - pattern2[i]) / base * 100;
      if (variance > tolerance) return false;
    }
    return true;
  }, []);

  const calculateScore = useCallback((intervals, matchedSegments) => {
    if (!currentPattern || !matchedSegments || matchedSegments.length < requiredRepetitions) return 0;

    let totalVariance = 0;
    let pairCount = 0;

    // Calculate variance only for matched segments against currentPattern
    matchedSegments.forEach(({ start, end }) => {
      const segment = intervals.slice(start, end);
      if (segment.length === currentPattern.length) {
        for (let j = 0; j < segment.length; j++) {
          const base = Math.max(1, Math.max(segment[j], currentPattern[j])); // symmetric epsilon
          const variance = Math.abs(segment[j] - currentPattern[j]) / base * 100;
          totalVariance += variance;
          pairCount++;
        }
      }
    });

    const averageVariance = pairCount > 0 ? totalVariance / pairCount : 0;
    const score = Math.max(0, Math.min(100, 100 - (averageVariance / tolerancePercent * 100)));
    return Math.round(score);
  }, [currentPattern, requiredRepetitions, tolerancePercent]);

  const detectRepetition = useCallback((intervals) => {
    if (intervals.length < (minPatternLength - 1)) return null;

    let bestResult = null;

    // Try different pattern lengths
    for (let len = minPatternLength - 1; len <= Math.floor(intervals.length / 2); len++) {
      // Try different starting positions
      for (let start = 0; start <= intervals.length - len * requiredRepetitions; start++) {
        const template = intervals.slice(start, start + len);
        let repetitions = 0;
        let matchedSegments = [];

        // Check for contiguous repetitions
        for (let offset = 0; offset < requiredRepetitions; offset++) {
          const segmentStart = start + offset * len;
          const segment = intervals.slice(segmentStart, segmentStart + len);
          if (segment.length === len && intervalsMatch(template, segment, tolerancePercent)) {
            repetitions++;
            matchedSegments.push({ start: segmentStart, end: segmentStart + len });
          } else {
            break;
          }
        }

        if (repetitions >= requiredRepetitions) {
          // Keep the one with most repetitions
          if (!bestResult || repetitions > bestResult.repetitions) {
            bestResult = { pattern: template, repetitions, matchedSegments, startOffset: start };
          }
        }
      }
    }

    return bestResult;
  }, [minPatternLength, requiredRepetitions, tolerancePercent, intervalsMatch]);

  const analyzePattern = useCallback((history) => {
    const currentHistory = history || clickHistory;
    if (currentHistory.length < minPatternLength) return;

    // Calculate intervals
    const intervals = [];
    for (let i = 0; i < currentHistory.length - 1; i++) {
      intervals.push(currentHistory[i + 1].time - currentHistory[i].time);
    }

    const repetitionResult = detectRepetition(intervals);

    if (repetitionResult) {
      setCurrentPattern(repetitionResult.pattern);
      setDetectedRepetitions(repetitionResult.repetitions);
      setIsPatternValid(true);
      setStreak(prev => prev + 1);
      const score = calculateScore(intervals, repetitionResult.matchedSegments);
      setPatternScore(score);

      if (debug) {
        console.log('Pattern detected:', repetitionResult.pattern, 'Repetitions:', repetitionResult.repetitions, 'Score:', score);
      }
    } else {
      setIsPatternValid(false);
      setPatternScore(0);
      setStreak(0);
      setCurrentPattern(null);
      setDetectedRepetitions(0);
    }
  }, [clickHistory, minPatternLength, detectRepetition, calculateScore, debug]);

  const handleClick = useCallback(() => {
    const now = performance.now();
    const newClick = { time: now, index: clickCountRef.current++ };

    const updatedHistory = [...clickHistory, newClick].slice(-maxHistorySize);
    setClickHistory(updatedHistory);

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      if (debug) console.log('Pattern timeout - resetting');
      reset();
    }, patternTimeout);

    // Analyze with updated history
    analyzePattern(updatedHistory);

    if (debug) {
      console.log('Click recorded at', now);
    }
  }, [clickHistory, maxHistorySize, patternTimeout, debug, analyzePattern, reset]);

  const reset = useCallback(() => {
    setClickHistory([]);
    setIsPatternValid(false);
    setPatternScore(0);
    setCurrentPattern(null);
    setDetectedRepetitions(0);
    setStreak(0);
    clickCountRef.current = 0;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Stop Meyda analyzer if running
    stopMeyda();

    if (debug) {
      console.log('Rhythm pattern reset');
    }
  }, [debug, stopMeyda]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // Stop Meyda analyzer on unmount
      stopMeyda();
    };
  }, [stopMeyda]);

  return {
    handleClick,
    isPatternValid,
    patternScore,
    clickHistory,
    currentPattern,
    detectedRepetitions,
    streak,
    reset,
    initMeyda,
    startMeyda,
    stopMeyda,
    ...(debug && {
      lastAnalysis: {
        intervals: clickHistory.length > 1 ?
          clickHistory.slice(1).map((click, i) => click.time - clickHistory[i].time) : [],
        patternValid: isPatternValid,
        score: patternScore
      }
    })
  };
}

export default useRhythmPattern;