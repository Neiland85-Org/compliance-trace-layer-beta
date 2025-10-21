import * as THREE from "three";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { useRef, useState, useEffect } from "react";
import Astronaut from './Astronaut';
import Satellite from './Satellite';
import BlackHole from './BlackHole';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import useRhythmPattern from '../hooks/useRhythmPattern';

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
  const rhythm = useRhythmPattern({
    minPatternLength: 3,
    requiredRepetitions: 2,
    tolerancePercent: 10,
    debug: true
  });

  const [blackHoleActive, setBlackHoleActive] = useState(false);
  const [astronautPosition, setAstronautPosition] = useState([5, 0, 5]);

  // Testing controls - TODO: Remove in production
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'b') setBlackHoleActive(prev => !prev);
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <div className="absolute top-0 left-0 w-full z-0" style={{ height: "100vh" }}>
      <Canvas
        camera={{ position: [0, 5, 18], fov: 50 }}
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
          position={[-8, 3, -6]}
          scale={0.05}
          showLabel={true}
          isTarget={true}
          rotationSpeed={0.2}
          onClick={() => console.log('Satellite clicked')}
        />

        {/* 🧑‍🚀 ASTRONAUTA */}
        <Astronaut
          position={[5, 0, 5]}
          scale={0.01}
          showLabel={true}
          isControlled={false}
          onClick={rhythm.handleClick}
        />

        {/* 🌀 AGUJERO NEGRO */}
        <BlackHole
          position={[0, -5, -10]}
          scale={2}
          isActive={blackHoleActive}
          attractionSpeed={0.5}
          targetPosition={astronautPosition}
          onAstronautCaptured={() => console.log('Astronaut captured by black hole!')}
          intensity={blackHoleActive ? 2.0 : 0.5}
          showLabel={blackHoleActive}
        />

        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.3} />

        <EffectComposer>
          <Bloom
            intensity={blackHoleActive ? 2.0 : 0.8}
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
          <Vignette
            offset={blackHoleActive ? 0.3 : 0.5}
            darkness={blackHoleActive ? 0.8 : 0.5}
            blendFunction={BlendFunction.NORMAL}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
