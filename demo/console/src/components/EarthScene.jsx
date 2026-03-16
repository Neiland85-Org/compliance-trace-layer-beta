import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { useEffect, useState } from "react";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";

import Astronaut from "./Astronaut";
import Satellite from "./Satellite";
import BlackHole from "./BlackHole";
import CookieBanner from "./CookieBanner";
import Planet from "./Planet";
import { usePlanetStore } from "../hooks/usePlanetStore";

export default function EarthScene() {
  const {
    stabilityScore,
    getStabilityPercentage,
    resetStabilization,
    stabilizeZone,
    isZoneStabilized,
    recordIdempotentClick,
  } = usePlanetStore();

  const [cookieConsent, setCookieConsent] = useState(null);
  const stabilityPercentage = getStabilityPercentage();
  const blackHoleActive = stabilityScore < 100;
  const blackHoleIntensity = Math.max(0.35, 1.8 - stabilityPercentage / 65);

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key.toLowerCase() === "r") {
        resetStabilization();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [resetStabilization]);

  const handleStabilizeClick = (objectId, position) => {
    if (isZoneStabilized(objectId)) {
      recordIdempotentClick(objectId);
      return;
    }
    stabilizeZone(objectId, position);
  };

  return (
    <div className="absolute top-0 left-0 z-0 h-screen w-full">
      <div className="absolute top-4 left-4 z-10 rounded-lg border border-cyan-400/40 bg-black/80 p-3 font-mono text-sm text-cyan-300">
        <div>Stability: {Math.round(stabilityPercentage)}%</div>
        <div>Score: {Math.round(stabilityScore)}/100</div>
        <div>BlackHole: {blackHoleActive ? "ACTIVE" : "STABLE"}</div>
        <div>Press R to reset</div>
      </div>

      <Canvas camera={{ position: [0, 3, 12], fov: 60 }} gl={{ antialias: true }}>
        <color attach="background" args={["#000000"]} />
        <Stars radius={220} depth={65} count={8000} factor={5} fade />

        <ambientLight intensity={0.75} />
        <directionalLight position={[6, 6, 3]} intensity={1.3} />
        <pointLight position={[-8, -2, -4]} intensity={0.8} color="#00d9ff" />
        <pointLight position={[9, 4, 10]} intensity={0.6} color="#ffffff" />

        <Planet
          name="Earth"
          color="#00ffc6"
          position={[0, 0, 0]}
          scale={1.5}
          showLabel
          hasAtmosphere
          atmosphereColor="#3ec5ff"
        />
        <Planet name="Mars" color="#ff6f61" position={[8, 2, -3]} scale={0.95} />
        <Planet name="Titan" color="#f8d274" position={[-10, -2, -4]} scale={1.1} />

        <group onClick={() => handleStabilizeClick("satellite", [-6, 2, -4])}>
          <Satellite position={[-6, 2, -4]} scale={0.06} showLabel isTarget rotationSpeed={0.28} />
        </group>

        <group onClick={() => handleStabilizeClick("astronaut", [4, 1, 3])}>
          <Astronaut position={[4, 1, 3]} scale={0.012} showLabel isControlled={false} />
        </group>

        <BlackHole position={[0, -5, -10]} stabilityScore={stabilityScore} showLabel={blackHoleActive} />

        <OrbitControls
          enableZoom
          enablePan
          autoRotate={false}
          minDistance={5}
          maxDistance={30}
        />

        <EffectComposer>
          <Bloom
            intensity={blackHoleActive ? blackHoleIntensity : Math.max(0.35, stabilityPercentage / 120)}
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
          <Vignette
            offset={blackHoleActive ? 0.33 : 0.18}
            darkness={blackHoleActive ? 0.75 : 0.35}
            blendFunction={BlendFunction.NORMAL}
          />
        </EffectComposer>
      </Canvas>

      <CookieBanner
        onAccept={() => setCookieConsent({ accepted: true })}
        onReject={() => setCookieConsent({ accepted: false })}
        onCustomize={() => setCookieConsent({ customized: true })}
      />

      {import.meta.env.DEV && (
        <div className="fixed bottom-4 left-4 z-50 rounded bg-black/80 p-2 font-mono text-xs text-white">
          Consent: {cookieConsent ? JSON.stringify(cookieConsent) : "pending"}
        </div>
      )}
    </div>
  );
}
