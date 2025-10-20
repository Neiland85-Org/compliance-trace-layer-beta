import * as THREE from "three";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
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
    <div className="absolute top-0 left-0 w-full h-[50vh] z-0">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 55 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={["#000000"]} />
        <Stars radius={200} depth={60} count={5000} factor={5} fade />

        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 5, 5]} intensity={1.5} />
        <pointLight position={[-5, -5, -5]} intensity={1} color={"#00ffff"} />

        {/* Planetas */}
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

        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.3} />
      </Canvas>
    </div>
  );
}
