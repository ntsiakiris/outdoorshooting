"use client";

import * as THREE from "three";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, BallCollider, type RapierRigidBody } from "@react-three/rapier";
import { useGame, distanceFromHoop } from "@/lib/store";
import {
  aimToVelocity,
  windAccel,
  BALL_RADIUS,
  BALL_MASS,
  HOOP,
} from "@/lib/physics";

const ZERO = new THREE.Vector3();
const HOLD_Y = 1.75;
const RIM_Y = HOOP.center.y;
const RIM_Z = HOOP.center.z;
const RESET_DELAY = 1.4;

export default function Ball() {
  const body = useRef<RapierRigidBody>(null);
  const spin = useRef<THREE.Group>(null);
  const lastSeq = useRef(0);
  const prevY = useRef(HOLD_Y);
  const launchT = useRef(0);
  const resolveT = useRef(0);
  const scored = useRef(false);
  const windLocal = useRef(new THREE.Vector3());

  const place = (x: number, y: number, z: number) => {
    const b = body.current;
    if (!b) return;
    b.setTranslation({ x, y, z }, true);
    b.setLinvel({ x: 0, y: 0, z: 0 }, true);
    b.setAngvel({ x: 0, y: 0, z: 0 }, true);
  };

  useFrame((state, dtRaw) => {
    const b = body.current;
    if (!b) return;
    const dt = Math.min(dtRaw, 1 / 30);
    const g = useGame.getState();
    const t = state.clock.elapsedTime;

    // ---- AIMING: hold the ball at the shooter, idle spin, ignore gravity ----
    if (g.phase === "aiming") {
      b.setGravityScale(0, true);
      place(g.shooter.x, HOLD_Y, g.shooter.z);
      prevY.current = HOLD_Y;
      scored.current = false;
      if (spin.current) {
        spin.current.rotation.x -= dt * 1.2;
        spin.current.rotation.y += dt * 0.6;
      }
      return;
    }

    // mid-flight the RigidBody itself spins (angvel); keep the visual group
    // neutral so it tracks the body rotation instead of double-spinning.
    if (spin.current) spin.current.rotation.set(0, 0, 0);

    // ---- LAUNCH: detect a new shot sequence ----
    if (g.shotSeq !== lastSeq.current) {
      lastSeq.current = g.shotSeq;
      const vel = aimToVelocity(g.aim);
      b.setGravityScale(1, true);
      place(g.shooter.x, HOLD_Y, g.shooter.z);
      b.setLinvel({ x: vel.x, y: vel.y, z: vel.z }, true);
      // backspin: spin about the axis perpendicular to travel
      b.setAngvel({ x: -6, y: 0, z: 0 }, true);
      launchT.current = t;
      scored.current = false;
      windLocal.current.copy(g.windEnabled ? windAccel(g.wind) : ZERO);
    }

    // ---- FLYING: apply wind, watch for score / miss ----
    if (g.phase === "flying") {
      // hard mode: wind direction drifts mid-air
      if (g.hardMode) {
        const a = 0.6 * dt;
        const w = windLocal.current;
        const nx = w.x * Math.cos(a) - w.z * Math.sin(a);
        const nz = w.x * Math.sin(a) + w.z * Math.cos(a);
        w.set(nx, 0, nz);
      }
      // F = m * a  -> impulse = F * dt
      const imp = windLocal.current;
      b.applyImpulse(
        { x: imp.x * BALL_MASS * dt, y: 0, z: imp.z * BALL_MASS * dt },
        true
      );

      const p = b.translation();
      const v = b.linvel();

      // crossing the rim plane on the way down, inside the ring => SCORE
      if (
        !scored.current &&
        prevY.current > RIM_Y &&
        p.y <= RIM_Y &&
        v.y < 0
      ) {
        const dx = p.x - 0;
        const dz = p.z - RIM_Z;
        if (Math.sqrt(dx * dx + dz * dz) < HOOP.rimRadius * 2.6) {
          scored.current = true;
          const dist = distanceFromHoop(g.shooter.x, g.shooter.z);
          g.resolveScore(!g.rimTouched, dist);
          resolveT.current = t;
        }
      }

      // miss: ball has settled low and slow, or timed out
      const speed = Math.hypot(v.x, v.y, v.z);
      const settled = p.y < 0.4 && speed < 1.4 && t - launchT.current > 0.5;
      const timeout = t - launchT.current > 6;
      const outOfPlay = p.y < -2 || Math.abs(p.x) > 16 || p.z > 9;
      if (!scored.current && (settled || timeout || outOfPlay)) {
        g.resolveMiss();
        resolveT.current = t;
      }

      prevY.current = p.y;
      return;
    }

    // ---- RESOLVED (scored/missed): let it bounce, then reset ----
    if (g.phase === "scored" || g.phase === "missed") {
      if (t - resolveT.current > RESET_DELAY) {
        g.resetForNext();
      }
    }
  });

  return (
    <RigidBody
      ref={body}
      colliders={false}
      mass={BALL_MASS}
      restitution={0.62}
      friction={0.7}
      linearDamping={0.12}
      angularDamping={0.25}
      ccd
      position={[0, HOLD_Y, 0]}
      onCollisionEnter={(e) => {
        const name = (e.other.rigidBody?.userData as { name?: string })?.name;
        if (name === "rim" || name === "board") useGame.getState().markRim();
      }}
    >
      <BallCollider args={[BALL_RADIUS]} />
      <group ref={spin}>
        <mesh castShadow>
          <sphereGeometry args={[BALL_RADIUS, 32, 32]} />
          <meshStandardMaterial color="#e8702a" roughness={0.85} metalness={0.05} />
        </mesh>
        {/* seams */}
        {[
          [0, 0, 0],
          [Math.PI / 2, 0, 0],
          [0, 0, Math.PI / 2],
        ].map((r, i) => (
          <mesh key={i} rotation={r as [number, number, number]}>
            <torusGeometry args={[BALL_RADIUS, 0.004, 8, 40]} />
            <meshStandardMaterial color="#1a120b" roughness={0.9} />
          </mesh>
        ))}
      </group>
    </RigidBody>
  );
}
