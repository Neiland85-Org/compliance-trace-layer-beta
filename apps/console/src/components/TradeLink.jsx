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