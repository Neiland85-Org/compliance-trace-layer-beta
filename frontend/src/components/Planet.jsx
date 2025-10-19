import { Html } from "@react-three/drei";
import { useFrame, useThree, useLoader } from "@react-three/fiber";
import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import PropTypes from 'prop-types';

export default function Planet({
  name,
  color = '#ffffff',
  position = [0, 0, 0],
  emissiveIntensity = 0.4,
  scale = 1,
  onClick,
  showLabel = false,
  rotationSpeed,
  hasAtmosphere = false,
  atmosphereColor,
  atmosphereIntensity = 0.5
}) {
  const meshRef = useRef();
  const { gl } = useThree();

  const texturePaths = useMemo(() => {
    const baseMap = {
      'Earth': {
        map: '/textures/earth/earth_daymap.jpg'
        // bumpMap and specularMap removed due to invalid files
      },
      'Mars': {
        map: '/textures/mars/mars_1k_color.jpg'
      },
      'Titan': {
        map: '/textures/titan/jupiter_2k.jpg'
      }
    };
    return baseMap[name] || null;
  }, [name]);

  const textures = useMemo(() => {
    if (!texturePaths) return null;
    const loaded = {};
    try {
      if (texturePaths.map) loaded.map = useLoader(THREE.TextureLoader, texturePaths.map);
      // Removed bumpMap and specularMap loading due to invalid files
    } catch (e) {
      // If loading fails, return partial textures
    }
    return loaded;
  }, [texturePaths]);

  // Configure texture properties
  if (textures?.map) {
    textures.map.colorSpace = THREE.SRGBColorSpace;
    textures.map.anisotropy = gl.capabilities.getMaxAnisotropy();
  }
  if (textures?.bumpMap) {
    textures.bumpMap.colorSpace = THREE.NoColorSpace;
  }
  if (textures?.specularMap) {
    textures.specularMap.colorSpace = THREE.NoColorSpace;
  }

  // Default rotation speeds
  const defaultRotationSpeed = useMemo(() => {
    switch (name) {
      case 'Earth': return 0.05;
      case 'Mars': return 0.03;
      case 'Titan': return 0.02;
      default: return 0.05;
    }
  }, [name]);

  const actualRotationSpeed = rotationSpeed !== undefined ? rotationSpeed : defaultRotationSpeed;

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * actualRotationSpeed;
    }
  });

  return (
    <group position={position} onClick={onClick}>
      <mesh ref={meshRef} scale={scale}>
        <sphereGeometry args={[1.5, 48, 48]} />
        <meshStandardMaterial
          map={textures?.map}
          color={textures?.map ? '#ffffff' : color}
          emissive={color}
          emissiveIntensity={emissiveIntensity}
          roughness={0.4}
          metalness={0.8}
        />
      </mesh>
      {hasAtmosphere && (
        <mesh scale={scale * 1.08}>
          <sphereGeometry args={[1.5, 48, 48]} />
          <meshBasicMaterial
            color={atmosphereColor || color}
            transparent
            opacity={atmosphereIntensity * 0.3}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}
      {showLabel && (
        <Html center>
          <div className="flex flex-col items-center bg-black/70 p-4 rounded-2xl border border-[#00FFB2]/30 text-[#8DFD1B]">
            <p className="font-orbit text-[#00E0FF] font-bold text-sm">{name}</p>
          </div>
        </Html>
      )}
    </group>
  );
}

Planet.propTypes = {
  name: PropTypes.string,
  color: PropTypes.string.isRequired,
  position: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.number),
    PropTypes.object
  ]).isRequired,
  emissiveIntensity: PropTypes.number,
  scale: PropTypes.number,
  onClick: PropTypes.func,
  showLabel: PropTypes.bool,
  rotationSpeed: PropTypes.number,
  hasAtmosphere: PropTypes.bool,
  atmosphereColor: PropTypes.string,
  atmosphereIntensity: PropTypes.number
};