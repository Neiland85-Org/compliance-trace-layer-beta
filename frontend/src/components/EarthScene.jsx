import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { useState, useEffect, useRef, Suspense } from "react";
import * as THREE from "three";
import Planet from "./Planet";
import TradeLink from './TradeLink';
import GameHUD from './GameHUD';
import { usePlanetStore } from '../hooks/usePlanetStore';

function CameraController() {
  const { camera } = useThree();

  useFrame(() => {
    const targetZ = 25;
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.05);
  });

  return null;
}

export default function EarthScene() {
  const [carbonIndex, setCarbonIndex] = useState(80);
  const [starCount, setStarCount] = useState(8000);
  const marsPositionRef = useRef([8, 2, 0]);
  const titanPositionRef = useRef([-8, -2, 0]);
  const { selectedPlanet, selectPlanet } = usePlanetStore();

  useEffect(() => {
    const updateStarCount = () => {
      setStarCount(window.innerWidth < 768 ? 2000 : 8000);
    };
    updateStarCount();
    window.addEventListener('resize', updateStarCount);
    return () => window.removeEventListener('resize', updateStarCount);
  }, []);

function OrbitalUpdater({ marsPositionRef, titanPositionRef }) {
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    // Mars orbit: radius 8, slow orbit
    const marsX = Math.cos(time * 0.1) * 8;
    const marsZ = Math.sin(time * 0.1) * 8;
    marsPositionRef.current = [marsX, 2, marsZ];
    
    // Titan orbit: radius 10, slower orbit
    const titanX = Math.cos(time * 0.05) * 10;
    const titanZ = Math.sin(time * 0.05) * 10;
    titanPositionRef.current = [titanX, -2, titanZ];
  });

  return null;
}

  return (
    <div className="relative h-[600px] md:h-[800px] xl:h-[900px] bg-black/60 rounded-3xl border border-[#00E0FF]/30 overflow-hidden shadow-2xl">
      <Canvas camera={{ position: [0, 0, 25], fov: 55 }}>
        <fog attach="fog" args={["#000010", 0.02]} />
        <CameraController />
        <OrbitalUpdater marsPositionRef={marsPositionRef} titanPositionRef={titanPositionRef} />
        <ambientLight intensity={0.3} color="#88aaff" />
        <directionalLight position={[50, 0, 25]} intensity={2.0} color="#fff5cc" />
        <Stars radius={200} depth={100} count={starCount} factor={4} fade speed={1} />
        
        <Suspense fallback={null}>
          <Planet
            name="Earth"
            color="#00E0FF"
            position={[0, 0, 0]}
            scale={carbonIndex < 60 ? 1.2 : 1}
            emissiveIntensity={selectedPlanet === "Earth" ? 2.0 : (carbonIndex < 60 ? 1.2 : 0.5)}
            onClick={() => selectPlanet("Earth")}
            showLabel={true}
            hasAtmosphere={true}
            atmosphereColor="#00E0FF"
            atmosphereIntensity={carbonIndex < 50 ? 1.0 : 0.5}
            rotationSpeed={0.05}
            isSelected={selectedPlanet === "Earth"}
          />
          <Planet
            name="Mars"
            color="#FF4D4D"
            position={marsPositionRef.current}
            scale={carbonIndex > 60 ? 1.3 : 1}
            emissiveIntensity={selectedPlanet === "Mars" ? 2.5 : (carbonIndex > 60 ? 1.5 : 0.4)}
            onClick={() => selectPlanet("Mars")}
            showLabel={true}
            hasAtmosphere={true}
            atmosphereColor="#FF4D4D"
            atmosphereIntensity={0.3}
            rotationSpeed={0.03}
            isSelected={selectedPlanet === "Mars"}
          />
          <Planet
            name="Titan"
            color="#FFD166"
            position={titanPositionRef.current}
            scale={carbonIndex < 40 ? 1.2 : 1}
            emissiveIntensity={selectedPlanet === "Titan" ? 2.2 : (carbonIndex < 40 ? 1.3 : 0.4)}
            onClick={() => selectPlanet("Titan")}
            showLabel={true}
            hasAtmosphere={true}
            atmosphereColor="#FFD166"
            atmosphereIntensity={0.8}
            rotationSpeed={0.02}
            isSelected={selectedPlanet === "Titan"}
          />
          <TradeLink start={marsPositionRef.current} end={[0, 0, 0]} color="#FF4D4D" lineWidth={3} visible={carbonIndex > 60} />
          <TradeLink start={titanPositionRef.current} end={[0, 0, 0]} color="#00E0FF" lineWidth={3} visible={carbonIndex < 40} />
        </Suspense>
        
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.6} />
      </Canvas>
      <GameHUD carbonIndex={carbonIndex} />
    </div>
  );
}
