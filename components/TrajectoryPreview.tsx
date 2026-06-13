"use client";

import * as THREE from "three";
import { useMemo } from "react";
import { Line } from "@react-three/drei";
import { useGame } from "@/lib/store";
import { predictArc } from "@/lib/physics";

const HOLD_Y = 1.75;

export default function TrajectoryPreview() {
  const charging = useGame((s) => s.charging);
  const phase = useGame((s) => s.phase);
  const aim = useGame((s) => s.aim);
  const wind = useGame((s) => s.wind);
  const shooter = useGame((s) => s.shooter);

  const points = useMemo(() => {
    const origin = new THREE.Vector3(shooter.x, HOLD_Y, shooter.z);
    return predictArc(origin, aim, wind).map(
      (v) => [v.x, v.y, v.z] as [number, number, number]
    );
  }, [aim, wind, shooter]);

  if (!charging || phase !== "aiming" || points.length < 2) return null;

  const landing = points[points.length - 1];

  return (
    <group>
      <Line
        points={points}
        color="#ff8a3d"
        lineWidth={2}
        dashed
        dashSize={0.18}
        gapSize={0.12}
        transparent
        opacity={0.9}
      />
      {/* landing marker */}
      <mesh position={landing} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.12, 0.18, 24]} />
        <meshBasicMaterial color="#ff5722" transparent opacity={0.9} />
      </mesh>
    </group>
  );
}
