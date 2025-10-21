import * as THREE from "three";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { useRef, useState, useEffect, useCallback } from "react";
import Astronaut from './Astronaut';
import Satellite from './Satellite';
import BlackHole from './BlackHole';
<<<<<<< HEAD
import CookieBanner from './CookieBanner';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
=======
import RhythmFeedback from './RhythmFeedback';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import useRhythmPattern from '../hooks/useRhythmPattern';
>>>>>>> a2ee324 (Implement complete game mechanics with physics-based astronaut movement, rhythm pattern validation, collision detection, and comprehensive UI feedback)
import { usePlanetStore } from '../hooks/usePlanetStore';

function Planet({ texturePath, position, baseScale }) {
  const mesh = useRef();
  const texture = useLoader(THREE.TextureLoader, texturePath);

  useFrame(() => {
    mesh.current.rotation.y += 0.001;
  });

  return (
    <mesh ref={mesh} position={position}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshStandardMaterial map={texture} roughness={0.8} metalness={0.2} />
    </mesh>
  );
}

export default function EarthScene() {
  const { stabilityScore, getStabilityPercentage, resetStabilization } = usePlanetStore();
  const stabilityPercentage = getStabilityPercentage();

<<<<<<< HEAD
  const [astronautPosition, setAstronautPosition] = useState([5, 0, 5]);

  // Estado para consentimiento de cookies
  const [cookieConsent, setCookieConsent] = useState(null);

  // Handler de cambio de consentimiento
  const handleConsentChange = (preferences) => {
    setCookieConsent(preferences);
    console.log('Cookie consent updated:', preferences);
  };

  // El BlackHole se activa cuando la estabilidad es baja (< 100)
  // Su intensidad es inversamente proporcional a la estabilidad
  const blackHoleActive = stabilityScore < 100;
  const blackHoleIntensity = Math.max(0.3, 2.0 - (stabilityPercentage / 50));

  useEffect(() => {
    console.log('🌍 EarthScene mounted - stability:', stabilityScore, 'percentage:', stabilityPercentage);
  }, []);

  useEffect(() => {
    console.log('🔄 Stability updated:', stabilityScore, 'blackHoleActive:', blackHoleActive);
  }, [stabilityScore, blackHoleActive]);

  // Keybind para reset de estabilización
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'r') {
        console.log('🔄 Resetting stabilization...');
        resetStabilization();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [resetStabilization]);
=======
  // Store subscriptions
  const gameState = usePlanetStore(state => state.gameState);
  const astronautPosition = usePlanetStore(state => state.astronautPosition);
  const satellitePosition = usePlanetStore(state => state.satellitePosition);
  const blackHoleActive = usePlanetStore(state => state.blackHoleActive);
  const patternStreak = usePlanetStore(state => state.patternStreak);
  const handleValidPattern = usePlanetStore(state => state.handleValidPattern);
  const handleInvalidPattern = usePlanetStore(state => state.handleInvalidPattern);
  const handleClickStore = usePlanetStore(state => state.handleClick);
  const triggerWin = usePlanetStore(state => state.triggerWin);
  const triggerGameOver = usePlanetStore(state => state.triggerGameOver);

  // Connect rhythm pattern to store
  useEffect(() => {
    if (rhythm.isPatternValid) {
      handleValidPattern(rhythm.patternScore);
    } else if (rhythm.clickHistory.length >= 3) {
      // Only trigger invalid after enough clicks
      handleInvalidPattern();
    }
  }, [rhythm.isPatternValid, rhythm.patternScore, rhythm.clickHistory.length]);

  // Collision detection
  useFrame(() => {
    if (gameState !== 'PLAYING') return;

    // Calculate distance between astronaut and satellite
    const dx = astronautPosition[0] - satellitePosition[0];
    const dy = astronautPosition[1] - satellitePosition[1];
    const dz = astronautPosition[2] - satellitePosition[2];
    const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);

    // Win condition: astronaut reaches satellite
    if (distance < 2.0) {
      triggerWin();
    }
  });
>>>>>>> a2ee324 (Implement complete game mechanics with physics-based astronaut movement, rhythm pattern validation, collision detection, and comprehensive UI feedback)

  return (
    <div className="absolute top-0 left-0 w-full z-0" style={{ height: "100vh" }}>
      {/* Debug Panel */}
      <div className="absolute top-4 left-4 z-10 bg-black/80 text-cyan-400 p-3 rounded-lg font-mono text-sm border border-cyan-400/40">
        <div>Stability: {stabilityPercentage.toFixed(0)}%</div>
        <div>Score: {stabilityScore}/100</div>
        <div>BlackHole: {blackHoleActive ? 'ACTIVE' : 'STABLE'}</div>
        <div>Press 'R' to reset</div>
      </div>

      <Canvas
        camera={{ position: [0, 3, 12], fov: 60 }}
        gl={{ antialias: true }}
        style={{ height: "100%", width: "100%" }}
      >
        <color attach="background" args={["#000000"]} />
        <Stars radius={200} depth={60} count={7000} factor={5} fade />
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} intensity={1.5} />
        <pointLight position={[-5, -5, -5]} intensity={1} color={"#00ffff"} />
        <pointLight position={[10, 5, 10]} intensity={0.8} color={"#ffffff"} />

        {/* 🌍 PLANETAS */}
        <Planet
          texturePath="/textures/earth/earth_daymap.jpg"
          position={[0, 0, 0]}
          baseScale={3.5}
        />
        <Planet
          texturePath="/textures/mars/mars_1k_color.jpg"
          position={[8, 2, -3]}
          baseScale={2.2}
        />
        <Planet
          texturePath="/textures/titan/jupiter_2k.jpg"
          position={[-10, -2, -4]}
          baseScale={2.8}
        />

        {/* 🛰️ SATÉLITE DE OPERACIONES */}
        <Satellite
<<<<<<< HEAD
          position={[-6, 2, -4]}
          scale={0.08}
=======
          scale={0.05}
>>>>>>> a2ee324 (Implement complete game mechanics with physics-based astronaut movement, rhythm pattern validation, collision detection, and comprehensive UI feedback)
          showLabel={true}
          isTarget={true}
          rotationSpeed={0.3}
        />

        {/* 🧑‍🚀 ASTRONAUTA */}
        <Astronaut
<<<<<<< HEAD
          position={[4, 1, 3]}
          scale={0.015}
          showLabel={true}
          isControlled={false}
=======
          scale={0.01}
          showLabel={true}
          onClick={() => {
            handleClickStore();
            rhythm.handleClick();
          }}
>>>>>>> a2ee324 (Implement complete game mechanics with physics-based astronaut movement, rhythm pattern validation, collision detection, and comprehensive UI feedback)
        />

        {/* 🌀 AGUJERO NEGRO */}
        <BlackHole
<<<<<<< HEAD
          position={[0, -3, -8]}
          stabilityScore={stabilityScore}
          showLabel={true}
=======
          position={[0, -5, -10]}
          scale={2}
          isActive={blackHoleActive}
          attractionSpeed={0.5}
          targetPosition={astronautPosition}
          onAstronautCaptured={() => {
            triggerGameOver('rhythm');
          }}
          intensity={blackHoleActive ? 2.0 : 0.5}
          showLabel={blackHoleActive}
>>>>>>> a2ee324 (Implement complete game mechanics with physics-based astronaut movement, rhythm pattern validation, collision detection, and comprehensive UI feedback)
        />

        <OrbitControls 
          enableZoom={true} 
          enablePan={true} 
          autoRotate={false} 
          autoRotateSpeed={0.3}
          minDistance={5}
          maxDistance={30}
        />

        <EffectComposer>
          <Bloom
<<<<<<< HEAD
            intensity={blackHoleActive ? blackHoleIntensity : Math.max(0.3, stabilityPercentage / 100)}
=======
            intensity={rhythm.isPatternValid ? 1.5 : (blackHoleActive ? 2.0 : 0.8)}
>>>>>>> a2ee324 (Implement complete game mechanics with physics-based astronaut movement, rhythm pattern validation, collision detection, and comprehensive UI feedback)
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
          <Vignette
            offset={blackHoleActive ? 0.3 : Math.max(0.1, 0.5 - (stabilityPercentage / 200))}
            darkness={blackHoleActive ? 0.8 : Math.max(0.1, 0.5 - (stabilityPercentage / 200))}
            blendFunction={BlendFunction.NORMAL}
          />
        </EffectComposer>
      </Canvas>

<<<<<<< HEAD
      {/* 🍪 BANNER DE COOKIES - Overlay HTML */}
      <CookieBanner onAccept={() => handleConsentChange({ accepted: true })} onReject={() => handleConsentChange({ accepted: false })} onCustomize={() => handleConsentChange({ customized: true })} />
=======
      {gameState === 'PLAYING' && (
        <RhythmFeedback
          isPatternValid={rhythm.isPatternValid}
          patternScore={rhythm.patternScore}
          streak={patternStreak}
          failureCount={usePlanetStore(state => state.failureCount)}
        />
      )}

      {/* Debug logging */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black/80 text-white p-2 rounded text-xs font-mono z-50">
          State: {gameState} | Streak: {patternStreak} | Black Hole: {blackHoleActive ? 'ON' : 'OFF'}
        </div>
      )}
>>>>>>> a2ee324 (Implement complete game mechanics with physics-based astronaut movement, rhythm pattern validation, collision detection, and comprehensive UI feedback)
    </div>
  );
}
