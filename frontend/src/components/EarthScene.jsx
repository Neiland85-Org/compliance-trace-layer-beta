import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Html, Environment } from "@react-three/drei";
import { useRef, useState } from "react";
import * as THREE from "three";

function Planet({ textureUrl, position, baseScale = 1, color, emission }) {
  const meshRef = useRef();
  const [pulse, setPulse] = useState(0);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    // rotación y respiración "ecológica"
    meshRef.current.rotation.y += 0.001;
    const breathing = Math.sin(t * 1.5) * 0.04; // respiración sutil
    const targetScale = baseScale + breathing;
    meshRef.current.scale.set(targetScale, targetScale, targetScale);
    setPulse((Math.sin(t * 2) + 1) / 2);
  });

  const texture = new THREE.TextureLoader().load(textureUrl);

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshStandardMaterial
        map={texture}
        emissive={new THREE.Color(color || "#00ffc6")}
        emissiveIntensity={0.1 + emission * 0.2}
        roughness={0.7}
        metalness={0.2}
      />
    </mesh>
  );
}

export default function EarthScene() {
  return (
    <div className="absolute inset-0 w-full h-full z-0">
      <Canvas camera={{ position: [0, 0, 6], fov: 60 }}>
        {/* Fondo cósmico */}
        <color attach="background" args={["#000000"]} />
        <Stars radius={200} depth={50} count={8000} factor={6} saturation={0} fade />

        {/* Luz ambiental suave */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1.5} />

        {/* Planetas con respiración */}
        <Planet
          textureUrl="/textures/earth_daymap.jpg"
          position={[0, 0, 0]}
          baseScale={1.8}
          color="#00ffc6"
          emission={0.5}
        />
        <Planet
          textureUrl="/textures/mars.jpg"
          position={[4, 1, -2]}
          baseScale={0.8}
          color="#ff5522"
          emission={0.3}
        />
        <Planet
          textureUrl="/textures/titan.jpg"
          position={[-4, -1, -2]}
          baseScale={1}
          color="#ffaa33"
          emission={0.2}
        />

        {/* Ambiente reflectante */}
        <Environment preset="sunset" />

        {/* Control de cámara */}
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 2.5}
          maxPolarAngle={Math.PI / 2}
          autoRotate
          autoRotateSpeed={0.4}
        />

        {/* Texto holográfico central */}
        <Html position={[0, -2.4, 0]}>
          <div className="text-[#00ffc6]/80 text-center text-sm font-mono tracking-widest animate-pulse">
            Carbon Index Synchronization Active
          </div>
        </Html>
      </Canvas>
    </div>
  );
}
