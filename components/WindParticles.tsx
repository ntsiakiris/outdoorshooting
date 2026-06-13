"use client";

import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGame } from "@/lib/store";

const COUNT = 140;
const BOX = { x: 30, y: 8, z: 28, cz: -5 };

/** Drifting dust/leaf motes that move with the current wind vector. */
export default function WindParticles() {
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const arr = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      arr[i * 3] = (Math.random() - 0.5) * BOX.x;
      arr[i * 3 + 1] = Math.random() * BOX.y;
      arr[i * 3 + 2] = BOX.cz + (Math.random() - 0.5) * BOX.z;
    }
    return arr;
  }, []);

  useFrame((_, dtRaw) => {
    const pts = ref.current;
    if (!pts) return;
    const dt = Math.min(dtRaw, 1 / 30);
    const { wind, windEnabled } = useGame.getState();
    const attr = pts.geometry.attributes.position as THREE.BufferAttribute;
    const a = attr.array as Float32Array;
    const vx = windEnabled ? wind.dirX * wind.mag * 0.5 : 0;
    const vz = windEnabled ? wind.dirZ * wind.mag * 0.5 : 0;
    for (let i = 0; i < COUNT; i++) {
      a[i * 3] += vx * dt;
      a[i * 3 + 1] -= 0.15 * dt; // slow fall
      a[i * 3 + 2] += vz * dt;
      // wrap
      if (a[i * 3] > BOX.x / 2) a[i * 3] = -BOX.x / 2;
      if (a[i * 3] < -BOX.x / 2) a[i * 3] = BOX.x / 2;
      if (a[i * 3 + 1] < 0) a[i * 3 + 1] = BOX.y;
      if (a[i * 3 + 2] > BOX.cz + BOX.z / 2) a[i * 3 + 2] = BOX.cz - BOX.z / 2;
      if (a[i * 3 + 2] < BOX.cz - BOX.z / 2) a[i * 3 + 2] = BOX.cz + BOX.z / 2;
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={COUNT}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.07}
        color="#d8c9a0"
        transparent
        opacity={0.5}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}
