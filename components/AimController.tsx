"use client";

import { useEffect, useRef } from "react";
import { useGame } from "@/lib/store";
import { clamp } from "@/lib/physics";

const MIN_ELEV = (22 * Math.PI) / 180;
const MAX_ELEV = (66 * Math.PI) / 180;
const POWER_PX = 260;

/**
 * Headless input layer. Binds window listeners and writes aim/launch into the
 * store. Three input paths:
 *   - Left-drag: down = charge power, sideways = yaw aim. Release to shoot.
 *   - Wheel / Up-Down arrows: launch elevation.
 *   - Hold Space: auto-ramp power, release to shoot. Left/Right arrows: yaw.
 */
export default function AimController() {
  const dragging = useRef(false);
  const start = useRef({ x: 0, y: 0 });
  const spaceCharging = useRef(false);
  const raf = useRef<number>();

  useEffect(() => {
    const g = () => useGame.getState();

    const overUI = (t: EventTarget | null) =>
      t instanceof Element && !!t.closest("[data-ui]");

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      if (overUI(e.target)) return;
      if (g().phase !== "aiming") return;
      dragging.current = true;
      start.current = { x: e.clientX, y: e.clientY };
      g().setCharging(true);
      g().setAim({ power: 0.05 });
    };

    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      const s = g();
      const dx = e.clientX - start.current.x;
      const dy = e.clientY - start.current.y;
      // drag UP toward the rim to charge (up the screen = -dy)
      const power = clamp(Math.max(0, -dy) / POWER_PX, 0.05, 1);
      // aim is anchored at the hoop; sideways drag only fine-tunes it
      const yaw = clamp(
        s.baseYaw + dx * 0.0013,
        s.baseYaw - 0.45,
        s.baseYaw + 0.45
      );
      s.setAim({ power, yaw });
    };

    const onUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      if (g().aim.power > 0.12 && g().phase === "aiming") g().launch();
      else g().setCharging(false);
    };

    const onWheel = (e: WheelEvent) => {
      if (g().phase !== "aiming") return;
      if (overUI(e.target)) return;
      e.preventDefault();
      const next = clamp(
        g().aim.elevation - e.deltaY * 0.0009,
        MIN_ELEV,
        MAX_ELEV
      );
      g().setAim({ elevation: next });
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const s = g();
      if (s.phase !== "aiming") return;
      switch (e.code) {
        case "Space":
          e.preventDefault();
          if (!spaceCharging.current) {
            spaceCharging.current = true;
            s.setCharging(true);
            const t0 = performance.now();
            const loop = () => {
              if (!spaceCharging.current) return;
              const el = (performance.now() - t0) / 1100; // ~1.1s to full
              const p = clamp(el % 2 < 1 ? el % 1 : 1 - (el % 1), 0.05, 1);
              useGame.getState().setAim({ power: p });
              raf.current = requestAnimationFrame(loop);
            };
            raf.current = requestAnimationFrame(loop);
          }
          break;
        case "ArrowLeft":
          s.setAim({
            yaw: clamp(s.aim.yaw - 0.03, s.baseYaw - 0.45, s.baseYaw + 0.45),
          });
          break;
        case "ArrowRight":
          s.setAim({
            yaw: clamp(s.aim.yaw + 0.03, s.baseYaw - 0.45, s.baseYaw + 0.45),
          });
          break;
        case "ArrowUp":
          s.setAim({ elevation: clamp(s.aim.elevation + 0.02, MIN_ELEV, MAX_ELEV) });
          break;
        case "ArrowDown":
          s.setAim({ elevation: clamp(s.aim.elevation - 0.02, MIN_ELEV, MAX_ELEV) });
          break;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space" && spaceCharging.current) {
        spaceCharging.current = false;
        if (raf.current) cancelAnimationFrame(raf.current);
        const s = g();
        if (s.phase === "aiming" && s.aim.power > 0.12) s.launch();
        else s.setCharging(false);
      }
    };

    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  return null;
}
