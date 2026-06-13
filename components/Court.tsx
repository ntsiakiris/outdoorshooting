"use client";

import * as THREE from "three";
import { useMemo } from "react";
import { Line } from "@react-three/drei";
import { RigidBody, CuboidCollider } from "@react-three/rapier";

const CHALK = "#e9e2d0";
const HOOP_Z = -7;

function arcPoints(
  cx: number,
  cz: number,
  radius: number,
  a0: number,
  a1: number,
  segments = 64
) {
  const pts: [number, number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const t = a0 + ((a1 - a0) * i) / segments;
    pts.push([cx + Math.cos(t) * radius, 0.02, cz + Math.sin(t) * radius]);
  }
  return pts;
}

/** A single low-poly tree built from primitives. */
function Tree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.8, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.18, 1.6, 6]} />
        <meshStandardMaterial color="#5b3a24" roughness={1} />
      </mesh>
      <mesh position={[0, 2.1, 0]} castShadow>
        <icosahedronGeometry args={[1.05, 0]} />
        <meshStandardMaterial color="#3f6f3a" roughness={1} flatShading />
      </mesh>
      <mesh position={[0.4, 2.7, 0.2]} castShadow>
        <icosahedronGeometry args={[0.7, 0]} />
        <meshStandardMaterial color="#4f8245" roughness={1} flatShading />
      </mesh>
    </group>
  );
}

export default function Court() {
  // three-point arc (radius 6.75 from rim), clamped to a half circle facing shooter
  const threeArc = useMemo(
    () => arcPoints(0, HOOP_Z, 6.75, Math.PI * 0.08, Math.PI * 0.92),
    []
  );
  // free-throw circle
  const ftCircle = useMemo(
    () => arcPoints(0, HOOP_Z + 4.6, 1.8, 0, Math.PI * 2),
    []
  );

  const fencePosts = useMemo(() => {
    const arr: [number, number, number][] = [];
    for (let x = -13; x <= 13; x += 2) arr.push([x, 0, -9.5]);
    return arr;
  }, []);

  return (
    <group>
      {/* ---- Asphalt floor + physics collider ---- */}
      <RigidBody type="fixed" friction={0.9} restitution={0.45}>
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0, -3]}
          receiveShadow
        >
          <planeGeometry args={[60, 60]} />
          <meshStandardMaterial color="#2b2a2c" roughness={0.95} />
        </mesh>
        <CuboidCollider args={[30, 0.1, 30]} position={[0, -0.1, -3]} />
      </RigidBody>

      {/* painted playing surface */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.01, -3]}
        receiveShadow
      >
        <planeGeometry args={[18, 17]} />
        <meshStandardMaterial color="#1f3d52" roughness={0.85} />
      </mesh>

      {/* court lines */}
      <Line points={threeArc} color={CHALK} lineWidth={3} />
      <Line points={ftCircle} color={CHALK} lineWidth={2} />
      {/* key / lane */}
      <Line
        points={[
          [-0.95, 0.02, HOOP_Z],
          [-0.95, 0.02, HOOP_Z + 4.6],
          [0.95, 0.02, HOOP_Z + 4.6],
          [0.95, 0.02, HOOP_Z],
        ]}
        color={CHALK}
        lineWidth={2}
      />
      {/* baseline + sideline frame */}
      <Line
        points={[
          [-8.5, 0.02, HOOP_Z - 0.4],
          [8.5, 0.02, HOOP_Z - 0.4],
          [8.5, 0.02, 5],
          [-8.5, 0.02, 5],
          [-8.5, 0.02, HOOP_Z - 0.4],
        ]}
        color={CHALK}
        lineWidth={2}
      />

      {/* ---- Surroundings ---- */}
      <Tree position={[-11, 0, -8]} />
      <Tree position={[11.5, 0, -7]} />
      <Tree position={[-12.5, 0, 1]} />
      <Tree position={[12, 0, 0]} />

      {/* chain-link fence (visual posts + rail) */}
      {fencePosts.map((p, i) => (
        <mesh key={i} position={[p[0], 1, p[2]]} castShadow>
          <boxGeometry args={[0.08, 2, 0.08]} />
          <meshStandardMaterial color="#3a3a3a" metalness={0.4} roughness={0.6} />
        </mesh>
      ))}
      <mesh position={[0, 1.9, -9.5]}>
        <boxGeometry args={[26, 0.06, 0.06]} />
        <meshStandardMaterial color="#3a3a3a" metalness={0.4} roughness={0.6} />
      </mesh>
      <mesh position={[0, 1, -9.55]}>
        <planeGeometry args={[26, 2]} />
        <meshStandardMaterial
          color="#9aa6b2"
          transparent
          opacity={0.08}
          side={THREE.DoubleSide}
          wireframe
        />
      </mesh>
    </group>
  );
}
