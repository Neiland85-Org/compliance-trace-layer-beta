import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars, Html } from "@react-three/drei";
import { useState, useRef } from "react";
import * as THREE from "three";

function Planet({ name, color, position, buttons, active, onClick }) {
  const planetRef = useRef();
  return (
    <group position={position} onClick={onClick}>
      <mesh ref={planetRef} scale={active ? 1.3 : 1}>
        <sphereGeometry args={[1.5, 48, 48]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={active ? 1.5 : 0.4}
          roughness={0.4}
          metalness={0.8}
        />
      </mesh>
      {active && (
        <Html center>
          <div className="flex flex-col items-center gap-2 bg-black/70 p-4 rounded-2xl border border-[#00FFB2]/30 text-xs text-[#8DFD1B]">
            <p className="orbit-font text-[#00E0FF] mb-2 font-bold">{name}</p>
            {buttons.map((btn, i) => (
              <button
                key={i}
                className="px-3 py-1 bg-[#00FFB2]/20 border border-[#00FFB2]/40 rounded hover:bg-[#00E0FF]/30 transition"
              >
                {btn}
              </button>
            ))}
          </div>
        </Html>
      )}
    </group>
  );
}

export default function EarthScene() {
  const [activePlanet, setActivePlanet] = useState(null);
  const { camera } = useThree();

  useFrame(() => {
    const targetZ = activePlanet ? 10 : 25;
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.05);
  });

  return (
    <div className="h-[900px] bg-black/60 rounded-3xl border border-[#00E0FF]/30 overflow-hidden shadow-2xl">
      <Canvas camera={{ position: [0, 0, 25], fov: 55 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 10]} intensity={1.2} />
        <Stars radius={200} depth={100} count={8000} factor={4} fade speed={1} />
        <Planet
          name="Compliance Node"
          color="#00E0FF"
          position={[-8, 0, 0]}
          active={activePlanet === "Compliance"}
          onClick={() => setActivePlanet(activePlanet === "Compliance" ? null : "Compliance")}
          buttons={["Validate", "KYC", "AML"]}
        />
        <Planet
          name="Trade Node"
          color="#8DFD1B"
          position={[0, 5, 0]}
          active={activePlanet === "Trade"}
          onClick={() => setActivePlanet(activePlanet === "Trade" ? null : "Trade")}
          buttons={["Transactions", "API", "Stream"]}
        />
        <Planet
          name="Impact Node"
          color="#FFB703"
          position={[8, -2, 0]}
          active={activePlanet === "Impact"}
          onClick={() => setActivePlanet(activePlanet === "Impact" ? null : "Impact")}
          buttons={["Reports", "Export", "Certify"]}
        />
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.6} />
      </Canvas>
    </div>
  );
}
