import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const BlackHole = ({ position = [0, 0, 0], stabilityScore = 100, showLabel = false }) => {
  const meshRef = useRef();
  const accretionDiskRef = useRef();

  // Crear shader material para el efecto de agujero negro
  const blackHoleMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(0x000000) },
      },
      vertexShader: `
        varying vec3 vPosition;
        void main() {
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 color;
        varying vec3 vPosition;

        void main() {
          float dist = length(vPosition);
          float alpha = 1.0 - smoothstep(0.0, 1.0, dist);
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
    });
  }, []);

  // Material para el disco de acreción
  const accretionDiskMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        varying vec2 vUv;

        void main() {
          vec2 center = vec2(0.5, 0.5);
          float dist = distance(vUv, center);

          // Crear efecto de remolino
          float angle = atan(vUv.y - center.y, vUv.x - center.x);
          float swirl = sin(angle * 8.0 + time * 2.0) * 0.5 + 0.5;

          // Gradiente radial con remolino
          float ring = smoothstep(0.3, 0.7, dist) * (1.0 - smoothstep(0.7, 1.0, dist));
          float intensity = ring * swirl;

          vec3 orange = vec3(1.0, 0.5, 0.0);
          vec3 red = vec3(1.0, 0.0, 0.0);

          vec3 finalColor = mix(orange, red, intensity);
          gl_FragColor = vec4(finalColor, intensity * 0.8);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
    });
  }, []);

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    if (blackHoleMaterial) {
      blackHoleMaterial.uniforms.time.value = time;
    }

    if (accretionDiskMaterial) {
      accretionDiskMaterial.uniforms.time.value = time;
    }

    if (accretionDiskRef.current) {
      accretionDiskRef.current.rotation.z += 0.01;
    }
  });

  return (
    <group position={position}>
      {/* Disco de acreción */}
      <mesh ref={accretionDiskRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.2, 2.5, 64]} />
        <primitive object={accretionDiskMaterial} />
      </mesh>

      {/* Agujero negro principal */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1.0, 32, 32]} />
        <primitive object={blackHoleMaterial} />
      </mesh>

      {/* Efecto de distorsión gravitacional (anillos concéntricos) */}
      {[1.5, 2.0, 2.5].map((radius, index) => (
        <mesh key={index} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius - 0.05, radius + 0.05, 64]} />
          <meshBasicMaterial
            color="#330000"
            transparent
            opacity={0.2 - index * 0.05}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
};

export default BlackHole;