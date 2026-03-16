import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const Satellite = ({ position = [0, 0, 0], orbitRadius = 2, scale = 1, showLabel = false, isTarget = false, rotationSpeed = 0.5 }) => {
  const groupRef = useRef();
  const satelliteRef = useRef();

  useFrame((state) => {
    if (groupRef.current && satelliteRef.current) {
      // Rotación orbital alrededor del punto central
      const time = state.clock.elapsedTime;
      groupRef.current.rotation.y = time * rotationSpeed;

      // Rotación del satélite sobre su propio eje
      satelliteRef.current.rotation.x = time * 2;
      satelliteRef.current.rotation.z = time * 1.5;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Órbita visual (opcional - anillo tenue) */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[orbitRadius - 0.02, orbitRadius + 0.02, 64]} />
        <meshBasicMaterial
          color="#444444"
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Satélite */}
      <group ref={satelliteRef} position={[orbitRadius, 0, 0]}>
        {/* Paneles solares */}
        <mesh position={[0, 0, 0.8]}>
          <boxGeometry args={[0.1, 1.2, 0.05]} />
          <meshStandardMaterial color="#FFD700" />
        </mesh>
        <mesh position={[0, 0, -0.8]}>
          <boxGeometry args={[0.1, 1.2, 0.05]} />
          <meshStandardMaterial color="#FFD700" />
        </mesh>

        {/* Cuerpo principal */}
        <mesh>
          <boxGeometry args={[0.4, 0.4, 0.4]} />
          <meshStandardMaterial color="#C0C0C0" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Antenas */}
        <mesh position={[0.2, 0.2, 0.2]}>
          <cylinderGeometry args={[0.02, 0.02, 0.3]} />
          <meshStandardMaterial color="#FF0000" />
        </mesh>
        <mesh position={[-0.2, 0.2, 0.2]}>
          <cylinderGeometry args={[0.02, 0.02, 0.3]} />
          <meshStandardMaterial color="#FF0000" />
        </mesh>
      </group>
    </group>
  );
};

export default Satellite;