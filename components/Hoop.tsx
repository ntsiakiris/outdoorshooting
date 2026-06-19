"use client";

import { useMemo } from "react";
import { RigidBody, CuboidCollider, BallCollider } from "@react-three/rapier";
import { HOOP } from "@/lib/physics";
import Net from "./Net";

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

      {/* ---- Connector bracket: links rim back to backboard ---- */}
      <mesh position={[0, RIM_Y, RIM_Z - RIM_R - 0.06]} castShadow>
        <boxGeometry args={[0.12, 0.05, 0.18]} />
        <meshStandardMaterial color="#ff5722" metalness={0.7} roughness={0.3} />
      </mesh>

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

      {/* ---- Net (animated visual + colliders) ---- */}
      <Net />
    </group>
  );
}
