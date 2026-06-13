"use client";

import { create } from "zustand";

export type Mode = "free" | "three";
export type Phase = "aiming" | "flying" | "scored" | "missed";

export interface Wind {
  /** unit direction in world XZ (x east, z south on screen) */
  dirX: number;
  dirZ: number;
  /** magnitude in m/s */
  mag: number;
  /** compass-ish angle in radians for UI arrow (atan2) */
  angle: number;
}

export interface ShotInput {
  /** yaw aim offset in radians, + = right */
  yaw: number;
  /** launch elevation angle in radians from ground */
  elevation: number;
  /** 0..1 normalized power */
  power: number;
}

export interface Toast {
  id: number;
  text: string;
  kind: "score" | "miss" | "info";
}

/** Shooting spots. z- is toward hoop (hoop sits near z = -7). */
const SPOTS: Record<Mode, { x: number; z: number }[]> = {
  free: [{ x: 0, z: -2.1 }],
  three: [
    { x: 0, z: 0.2 },
    { x: -5.5, z: -1.4 },
    { x: 5.5, z: -1.4 },
    { x: -4.2, z: 1.6 },
    { x: 4.2, z: 1.6 },
  ],
};

function rollWind(): Wind {
  // Pure crosswind: pushes the ball left/right only, never down-court.
  // A down-court (tailwind) component overshoots the hoop; an up-court
  // (headwind) component makes shots impossible. Both are unfair, so the
  // wind is sideways-only — a clean skill test of lateral aim.
  const dirX = Math.random() < 0.5 ? -1 : 1;
  const dirZ = 0;
  const mag = +(Math.random() * 1.4).toFixed(1); // 0..1.4 m/s
  return { dirX, dirZ, mag, angle: Math.atan2(dirX, -dirZ) };
}

interface GameState {
  mode: Mode;
  phase: Phase;
  wind: Wind;
  hardMode: boolean; // wind shifts mid-air

  spotIndex: number;
  shooter: { x: number; z: number };
  baseYaw: number; // yaw that points straight at the rim from the current spot

  // live aim (updated while charging)
  charging: boolean;
  aim: ShotInput;
  shotSeq: number; // increments each launch -> Ball reads & fires

  // scoring
  score: number;
  attempts: number;
  makes: number;
  streak: number;
  bestStreak: number;
  high: number;

  // per-shot flags set by physics callbacks
  rimTouched: boolean;
  toasts: Toast[];

  // actions
  setMode: (m: Mode) => void;
  setSpot: (i: number) => void;
  toggleHard: () => void;
  setCharging: (b: boolean) => void;
  setAim: (a: Partial<ShotInput>) => void;
  launch: () => void;
  markRim: () => void;
  resolveScore: (swish: boolean, distance: number) => void;
  resolveMiss: () => void;
  resetForNext: () => void;
  pushToast: (text: string, kind: Toast["kind"]) => void;
  dropToast: (id: number) => void;
}

const distanceFromHoop = (x: number, z: number) => {
  // hoop center approx (0, -7)
  const dx = x - 0;
  const dz = z - -7;
  return Math.sqrt(dx * dx + dz * dz);
};

/** Yaw (rad) whose horizontal heading points from a spot straight at the rim. */
const yawToHoop = (s: { x: number; z: number }) =>
  Math.atan2(-s.x, 7 + s.z); // forward is -Z; hoop at (0,-7)

export const useGame = create<GameState>((set, get) => ({
  mode: "three",
  phase: "aiming",
  wind: rollWind(),
  hardMode: false,

  spotIndex: 0,
  shooter: SPOTS.three[0],
  baseYaw: yawToHoop(SPOTS.three[0]),

  charging: false,
  aim: { yaw: yawToHoop(SPOTS.three[0]), elevation: Math.PI / 4, power: 0.55 },
  shotSeq: 0,

  score: 0,
  attempts: 0,
  makes: 0,
  streak: 0,
  bestStreak: 0,
  high: 0,

  rimTouched: false,
  toasts: [],

  setMode: (m) =>
    set((s) => {
      const shooter = SPOTS[m][0];
      const baseYaw = yawToHoop(shooter);
      return {
        mode: m,
        spotIndex: 0,
        shooter,
        baseYaw,
        phase: "aiming",
        wind: rollWind(),
        aim: { ...s.aim, yaw: baseYaw, power: 0.55 },
      };
    }),

  setSpot: (i) => {
    const { mode, aim } = get();
    const spots = SPOTS[mode];
    const idx = ((i % spots.length) + spots.length) % spots.length;
    const shooter = spots[idx];
    const baseYaw = yawToHoop(shooter);
    set({
      spotIndex: idx,
      shooter,
      baseYaw,
      phase: "aiming",
      wind: rollWind(),
      aim: { ...aim, yaw: baseYaw, power: 0.55 },
    });
  },

  toggleHard: () => set((s) => ({ hardMode: !s.hardMode })),

  setCharging: (b) => set({ charging: b }),
  setAim: (a) => set((s) => ({ aim: { ...s.aim, ...a } })),

  launch: () =>
    set((s) => ({
      phase: "flying",
      charging: false,
      shotSeq: s.shotSeq + 1,
      rimTouched: false,
      attempts: s.attempts + 1,
    })),

  markRim: () => set({ rimTouched: true }),

  resolveScore: (swish, distance) =>
    set((s) => {
      if (s.phase !== "flying") return {};
      const base = s.mode === "free" ? 1 : 3;
      const swishBonus = swish && s.mode === "three" ? 1 : 0;
      const distMult = s.mode === "three" && distance > 8.5 ? 2 : 1;
      const pts = (base + swishBonus) * distMult;
      const streak = s.streak + 1;
      const text =
        (swish ? "SWISH " : "") +
        `+${pts}` +
        (distMult > 1 ? " ·2 DEEP" : "") +
        (streak >= 3 ? `  🔥${streak}` : "");
      const id = Date.now() + Math.random();
      return {
        phase: "scored",
        score: s.score + pts,
        makes: s.makes + 1,
        streak,
        bestStreak: Math.max(s.bestStreak, streak),
        high: Math.max(s.high, s.score + pts),
        toasts: [...s.toasts, { id, text, kind: "score" }],
      };
    }),

  resolveMiss: () =>
    set((s) => {
      if (s.phase !== "flying") return {};
      const id = Date.now() + Math.random();
      return {
        phase: "missed",
        streak: 0,
        toasts: [...s.toasts, { id, text: "MISS", kind: "miss" }],
      };
    }),

  resetForNext: () =>
    set((s) => ({
      phase: "aiming",
      rimTouched: false,
      wind: rollWind(),
      aim: { ...s.aim, yaw: s.baseYaw, power: 0.55 },
    })),

  pushToast: (text, kind) =>
    set((s) => ({
      toasts: [...s.toasts, { id: Date.now() + Math.random(), text, kind }],
    })),

  dropToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export { distanceFromHoop, SPOTS, rollWind };
