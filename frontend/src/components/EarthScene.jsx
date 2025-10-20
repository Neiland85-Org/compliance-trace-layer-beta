/**
Compliance Trace Layer — v0.1.0-beta

© 2025 Neil Muñoz Lago. All rights reserved.

Private research prototype for environmental blockchain visualization and

carbon-credit traceability. Developed using React Three Fiber, Framer Motion,

and Node.js backend services for compliance data integrity.

This software is proprietary and not open source.

Unauthorized reproduction, modification, or redistribution of this code,

in whole or in part, is strictly prohibited without prior written consent

from the author.

This project is not affiliated with TRAYCER, TRACYER, or any external framework.
*/
import * as THREE from "three";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls, Stars, Environment } from "@react-three/drei";
import { useRef } from "react";

// componente de planeta genérico
function Planet({ texturePath, position, baseScale = 1, color }) {
  const mesh = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    mesh.current.rotation.y += 0.001;
    const pulse = Math.sin(t) * 0.05;
    mesh.current.scale.setScalar(baseScale + pulse);
  });

  const texture = useLoader(THREE.TextureLoader, texturePath);

  return (
    <mesh ref={mesh} position={position}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshStandardMaterial
        map={texture}
        color={color}
        roughness={0.8}
        metalness={0.1}
      />
    </mesh>
  );
}

export default function EarthScene() {
  return (
    <div className="absolute inset-0 w-full h-full z-0">
      <Canvas camera={{ position: [0, 0, 6], fov: 55 }}>
        <color attach="background" args={["#000000"]} />
        <Stars radius={300} depth={80} count={8000} factor={6} fade />
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1.5} />

        {/* PLANETAS */}
        <Planet
          texturePath="/textures/earth/earth_daymap.jpg"
          position={[0, 0, 0]}
          baseScale={2}
          color="#ffffff"
        />
        <Planet
          texturePath="/textures/mars/mars_1k_color.jpg"
          position={[5, 1, -2]}
          baseScale={1.2}
          color="#ff5533"
        />
        <Planet
          texturePath="/textures/titan/jupiter_2k.jpg"
          position={[-5, -1, -2]}
          baseScale={1.4}
          color="#ffcc66"
        />

        <Environment preset="sunset" />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.3} />
      </Canvas>
    </div>
  );
}
