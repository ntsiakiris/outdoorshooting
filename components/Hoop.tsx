"use client";

import * as THREE from "three";
import { useMemo } from "react";
import { RigidBody, CuboidCollider, BallCollider } from "@react-three/rapier";
import { HOOP } from "@/lib/physics";

const RIM_Y = HOOP.center.y; // 3.05
const RIM_Z = HOOP.center.z; // -7
const RIM_R = HOOP.rimRadius; // 0.23
const BOARD_Z = HOOP.backboardZ; // -7.45

export default function Hoop() {
  // small spheres around the rim circle = realistic rim physics
  const rimNodes = useMemo(() => {
    const n = 16;
    const arr: [number, number, number][] = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      arr.push([Math.cos(a) * RIM_R, 0, Math.sin(a) * RIM_R]);
    }
    return arr;
  }, []);

  // net: vertical strands fanning slightly inward
  const netLines = useMemo(() => {
    const lines: THREE.Vector3[][] = [];
    const n = 12;
    const depth = 0.42;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const top = new THREE.Vector3(
        Math.cos(a) * RIM_R,
        0,
        Math.sin(a) * RIM_R
      );
      const bot = new THREE.Vector3(
        Math.cos(a) * RIM_R * 0.55,
        -depth,
        Math.sin(a) * RIM_R * 0.55
      );
      lines.push([top, bot]);
    }
    return lines;
  }, []);

  const netGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pts: number[] = [];
    netLines.forEach(([a, b]) => {
      pts.push(a.x, a.y, a.z, b.x, b.y, b.z);
    });
    // horizontal weave ring mid-way
    const n = 12;
    const midY = -0.22;
    const midR = RIM_R * 0.78;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2;
      const a1 = ((i + 1) / n) * Math.PI * 2;
      pts.push(
        Math.cos(a0) * midR,
        midY,
        Math.sin(a0) * midR,
        Math.cos(a1) * midR,
        midY,
        Math.sin(a1) * midR
      );
    }
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, [netLines]);

  return (
    <group>
      {/* ---- Pole + arm (visual only) ---- */}
      <mesh position={[0, 1.6, BOARD_Z - 0.45]} castShadow>
        <cylinderGeometry args={[0.09, 0.11, 3.2, 12]} />
        <meshStandardMaterial color="#1c1c1e" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, RIM_Y + 0.55, BOARD_Z - 0.22]} castShadow>
        <boxGeometry args={[0.1, 0.1, 0.5]} />
        <meshStandardMaterial color="#1c1c1e" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* ---- Backboard (visual + collider) ---- */}
      <RigidBody type="fixed" restitution={0.55} friction={0.4} userData={{ name: "board" }}>
        <mesh position={[0, RIM_Y + 0.45, BOARD_Z]} castShadow>
          <boxGeometry args={[1.8, 1.05, 0.05]} />
          <meshStandardMaterial
            color="#f5f0e6"
            transparent
            opacity={0.92}
            roughness={0.2}
          />
        </mesh>
        {/* shooter's square */}
        <mesh position={[0, RIM_Y + 0.28, BOARD_Z + 0.03]}>
          <boxGeometry args={[0.62, 0.46, 0.01]} />
          <meshStandardMaterial color="#ff5722" />
        </mesh>
        <CuboidCollider
          args={[0.9, 0.525, 0.03]}
          position={[0, RIM_Y + 0.45, BOARD_Z]}
        />
      </RigidBody>

      {/* ---- Rim: visual torus + ring of sphere colliders ---- */}
      <mesh
        position={[0, RIM_Y, RIM_Z]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
      >
        <torusGeometry args={[RIM_R, 0.022, 12, 32]} />
        <meshStandardMaterial color="#ff5722" metalness={0.7} roughness={0.3} />
      </mesh>
      <RigidBody type="fixed" restitution={0.6} friction={0.25} userData={{ name: "rim" }}>
        {rimNodes.map((p, i) => (
          <BallCollider
            key={i}
            args={[0.024]}
            position={[p[0], RIM_Y, RIM_Z + p[2]]}
          />
        ))}
      </RigidBody>

      {/* ---- Net (visual) ---- */}
      <group position={[0, RIM_Y, RIM_Z]}>
        <lineSegments geometry={netGeo}>
          <lineBasicMaterial color="#f5f0e6" transparent opacity={0.7} />
        </lineSegments>
      </group>
    </group>
  );
}
