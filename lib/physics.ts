import * as THREE from "three";
import type { ShotInput, Wind } from "./store";

export const GRAVITY = 9.81;
export const BALL_RADIUS = 0.12;
export const BALL_MASS = 0.62; // kg, regulation basketball
export const MAX_SPEED = 16; // m/s at power = 1

/** Hoop geometry (world space). */
export const HOOP = {
  center: new THREE.Vector3(0, 3.05, -7), // 10 ft rim
  rimRadius: 0.23,
  backboardZ: -7.45,
};

/**
 * Convert an aim (yaw / elevation / power) at a shooter position into an
 * initial velocity vector. Ball fires toward -Z (the hoop) with yaw rotating
 * around Y. Skill-based: player controls all three.
 */
export function aimToVelocity(aim: ShotInput): THREE.Vector3 {
  const speed = aim.power * MAX_SPEED;
  const ce = Math.cos(aim.elevation);
  const se = Math.sin(aim.elevation);
  // forward is -Z; yaw rotates the horizontal component
  const horiz = speed * ce;
  const vx = horiz * Math.sin(aim.yaw);
  const vz = -horiz * Math.cos(aim.yaw);
  const vy = speed * se;
  return new THREE.Vector3(vx, vy, vz);
}

/** Wind acceleration vector (m/s^2) from a Wind, scaled by a drag-ish factor. */
export function windAccel(wind: Wind): THREE.Vector3 {
  const k = 0.26; // tuned so wind curves the shot without blowing it away
  return new THREE.Vector3(wind.dirX * wind.mag * k, 0, wind.dirZ * wind.mag * k);
}

/**
 * Predict a trajectory (array of points) under gravity + wind, ignoring
 * collisions. Used for the aim-assist preview line.
 */
export function predictArc(
  origin: THREE.Vector3,
  aim: ShotInput,
  wind: Wind,
  steps = 60,
  dt = 0.04
): THREE.Vector3[] {
  const pos = origin.clone();
  const vel = aimToVelocity(aim);
  const acc = windAccel(wind);
  const pts: THREE.Vector3[] = [pos.clone()];
  for (let i = 0; i < steps; i++) {
    vel.x += acc.x * dt;
    vel.z += acc.z * dt;
    vel.y -= GRAVITY * dt;
    pos.addScaledVector(vel, dt);
    pts.push(pos.clone());
    if (pos.y < BALL_RADIUS) break;
  }
  return pts;
}

export const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
