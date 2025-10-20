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
import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import PropTypes from "prop-types";
import * as THREE from "three";

export default function TradeLink({
  start,
  end,
  color = "#00E0FF",
  lineWidth = 2,
  visible = true
}) {
  const lineRef = useRef();

  useFrame((state) => {
    if (lineRef.current && lineRef.current.material) {
      const opacity = Math.sin(state.clock.elapsedTime * 2) * 0.3 + 0.7;
      lineRef.current.material.opacity = opacity;
    }
  });

  const startArray = start.toArray ? start.toArray() : start;
  const endArray = end.toArray ? end.toArray() : end;

  return (
    <Line
      ref={lineRef}
      points={[startArray, endArray]}
      color={color}
      lineWidth={lineWidth}
      transparent
      visible={visible}
    />
  );
}

TradeLink.propTypes = {
  start: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.number),
    PropTypes.instanceOf(THREE.Vector3)
  ]).isRequired,
  end: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.number),
    PropTypes.instanceOf(THREE.Vector3)
  ]).isRequired,
  color: PropTypes.string,
  lineWidth: PropTypes.number,
  visible: PropTypes.bool
};