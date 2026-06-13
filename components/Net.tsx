"use client";

import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, BallCollider } from "@react-three/rapier";
import { useGame } from "@/lib/store";
import { HOOP } from "@/lib/physics";

const RIM_Y = HOOP.center.y;
const RIM_Z = HOOP.center.z;
const RIM_R = HOOP.rimRadius;

const STRANDS = 12;
const DEPTH = 0.42;
const TOP_R = RIM_R;
const BOT_R = RIM_R * 0.55;
const MID_Y = -0.22;
const MID_R = RIM_R * 0.78;

export default function Net() {
  const grp = useRef<THREE.Group>(null);
  const lastSeq = useRef(0);
  const trigT = useRef(-10);

  // line geometry: vertical strands + one horizontal weave ring
  const netGeo = useMemo(() => {
    const pts: number[] = [];
    for (let i = 0; i < STRANDS; i++) {
      const a = (i / STRANDS) * Math.PI * 2;
      pts.push(
        Math.cos(a) * TOP_R, 0, Math.sin(a) * TOP_R,
        Math.cos(a) * BOT_R, -DEPTH, Math.sin(a) * BOT_R
      );
    }
    for (let i = 0; i < STRANDS; i++) {
      const a0 = (i / STRANDS) * Math.PI * 2;
      const a1 = ((i + 1) / STRANDS) * Math.PI * 2;
      pts.push(
        Math.cos(a0) * MID_R, MID_Y, Math.sin(a0) * MID_R,
        Math.cos(a1) * MID_R, MID_Y, Math.sin(a1) * MID_R
      );
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);

  // collider nodes along the strands so the ball brushes the net (swish),
  // thin enough that a clean center shot still drops through.
  const colliders = useMemo(() => {
    const nodes: [number, number, number][] = [];
    for (let i = 0; i < STRANDS; i++) {
      const a = (i / STRANDS) * Math.PI * 2;
      for (const f of [0.45, 0.85]) {
        const r = THREE.MathUtils.lerp(TOP_R, BOT_R, f);
        nodes.push([Math.cos(a) * r, -DEPTH * f, Math.sin(a) * r]);
      }
    }
    return nodes;
  }, []);

  useFrame((state) => {
    const g = grp.current;
    if (!g) return;
    const ns = useGame.getState().netSeq;
    if (ns !== lastSeq.current) {
      lastSeq.current = ns;
      trigT.current = state.clock.elapsedTime;
    }
    const t = state.clock.elapsedTime - trigT.current;
    if (t < 1.2) {
      const env = Math.exp(-t * 5);
      g.scale.y = 1 + 0.7 * env; // ball stretches the net downward
      const bulge = 1 + 0.16 * env * Math.sin(t * 26); // damped sideways swish
      g.scale.x = bulge;
      g.scale.z = bulge;
    } else if (g.scale.y !== 1) {
      g.scale.set(1, 1, 1);
    }
  });

  return (
    <group position={[0, RIM_Y, RIM_Z]}>
      {/* collider funnel (static; ball reacts physically) */}
      <RigidBody type="fixed" restitution={0.05} friction={0.7} userData={{ name: "net" }}>
        {colliders.map((p, i) => (
          <BallCollider key={i} args={[0.02]} position={p} />
        ))}
      </RigidBody>

      {/* animated visual net */}
      <group ref={grp}>
        <lineSegments geometry={netGeo}>
          <lineBasicMaterial color="#f5f0e6" transparent opacity={0.7} />
        </lineSegments>
      </group>
    </group>
  );
}
