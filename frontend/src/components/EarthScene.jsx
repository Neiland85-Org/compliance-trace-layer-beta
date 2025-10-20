import * as THREE from "three";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { useRef } from "react";

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
  return (
    <div className="absolute top-0 left-0 w-full z-0" style={{ height: "100vh" }}>
      <Canvas
        camera={{ position: [0, 0, 14], fov: 45 }}
        gl={{ antialias: true }}
        style={{ height: "100%", width: "100%" }}
      >
        <color attach="background" args={["#000000"]} />
        <Stars radius={200} depth={60} count={7000} factor={5} fade />
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1.5} />
        <pointLight position={[-5, -5, -5]} intensity={1} color={"#00ffff"} />

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

        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.3} />
      </Canvas>
    </div>
  );
}
