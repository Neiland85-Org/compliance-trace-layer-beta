import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const Astronaut = ({ position = [0, 0, 0], scale = 1, showLabel = false, isControlled = false }) => {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      // Rotación suave del astronauta
      meshRef.current.rotation.y += 0.01;
      // Flotación suave
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime) * 0.1;
    }
  });

  return (
    <group ref={meshRef} position={position}>
      {/* Cuerpo del astronauta (esfera blanca) */}
      <mesh>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      {/* Casco (esfera más pequeña y transparente) */}
      <mesh position={[0, 0.2, 0]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial
          color="#87CEEB"
          transparent
          opacity={0.7}
          metalness={0.1}
          roughness={0.1}
        />
      </mesh>

      {/* Brazos */}
      <mesh position={[-0.4, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.6]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.4, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.6]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      {/* Piernas */}
      <mesh position={[-0.15, -0.5, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.4]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.15, -0.5, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.4]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </group>
  );
};

export default Astronaut;