"use client";

import { useEffect } from "react";
import { useGame } from "@/lib/store";

const RAD2DEG = 180 / Math.PI;

function compassGlyph(dirX: number, dirZ: number) {
  // screen angle measured from "up" (downcourt = -z)
  const deg = (Math.atan2(dirX, -dirZ) * RAD2DEG + 360) % 360;
  const arrows = ["↑", "↗", "→", "↘", "↓", "↙", "←", "↖"];
  return arrows[Math.round(deg / 45) % 8];
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-start leading-none">
      <span className="font-mono text-[9px] uppercase tracking-mega text-chalk/45 sm:text-[10px]">
        {label}
      </span>
      <span className="font-display text-xl text-chalk sm:text-3xl">{value}</span>
    </div>
  );
}

function Toasts() {
  const toasts = useGame((s) => s.toasts);
  const drop = useGame((s) => s.dropToast);

  useEffect(() => {
    const timers = toasts.map((t) =>
      setTimeout(() => drop(t.id), 1500)
    );
    return () => timers.forEach(clearTimeout);
  }, [toasts, drop]);

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`animate-floatup absolute font-display tracking-wide ${
            t.kind === "score"
              ? "text-flame text-6xl md:text-7xl drop-shadow-[0_4px_0_rgba(0,0,0,0.4)]"
              : t.kind === "miss"
              ? "text-chalk/60 text-5xl"
              : "text-ember text-4xl"
          }`}
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}

export default function UI() {
  const {
    mode,
    setMode,
    wind,
    score,
    makes,
    attempts,
    streak,
    bestStreak,
    high,
    aim,
    charging,
    spotIndex,
    setSpot,
    hardMode,
    toggleHard,
  } = useGame();

  const pct = attempts > 0 ? Math.round((makes / attempts) * 100) : 0;
  const elevDeg = Math.round(aim.elevation * RAD2DEG);
  const windScreenDeg = (Math.atan2(wind.dirX, -wind.dirZ) * RAD2DEG) % 360;
  const windStrength = wind.mag < 0.9 ? "CALM" : wind.mag < 1.7 ? "BREEZY" : "GUSTY";

  return (
    <div className="pointer-events-none absolute inset-0 select-none">
      {/* ---- Top bar ---- */}
      <div className="absolute left-0 right-0 top-0 flex items-start justify-between gap-2 p-3 pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:p-5 md:p-7">
        {/* scoreboard */}
        <div
          data-ui
          className="pointer-events-auto flex items-end gap-3 rounded-xl border border-chalk/10 bg-black/35 px-3 py-2 backdrop-blur-md sm:gap-6 sm:px-5 sm:py-3"
        >
          <div className="flex flex-col leading-none">
            <span className="font-mono text-[9px] uppercase tracking-mega text-flame sm:text-[10px]">
              Downtown
            </span>
            <span className="font-display text-4xl text-chalk sm:text-6xl">{score}</span>
          </div>
          <div className="mb-1 flex gap-2 sm:gap-5">
            <Stat label="Made" value={`${makes}/${attempts}`} />
            <Stat label="FG%" value={`${pct}`} />
            <Stat label="Streak" value={streak} />
            <Stat label="Best" value={bestStreak} />
          </div>
        </div>

        {/* wind */}
        <div
          data-ui
          className="pointer-events-auto flex items-center gap-2 rounded-xl border border-chalk/10 bg-black/35 px-3 py-2 backdrop-blur-md sm:gap-4 sm:px-5 sm:py-3"
        >
          <div className="flex flex-col items-end leading-none">
            <span className="font-mono text-[9px] uppercase tracking-mega text-chalk/45 sm:text-[10px]">
              Wind · {windStrength}
            </span>
            <span className="font-mono text-base font-bold text-ember sm:text-2xl">
              {compassGlyph(wind.dirX, wind.dirZ)} {wind.mag.toFixed(1)}
              <span className="text-xs text-chalk/50 sm:text-sm"> m/s</span>
            </span>
          </div>
          <div className="relative grid h-9 w-9 place-items-center rounded-full border border-chalk/15 sm:h-12 sm:w-12">
            <span
              className="text-2xl text-flame transition-transform duration-300"
              style={{ transform: `rotate(${windScreenDeg}deg)` }}
            >
              ↑
            </span>
            {wind.mag > 1.7 && (
              <span className="absolute inset-0 rounded-full border border-flame/40 animate-pulseRing" />
            )}
          </div>
        </div>
      </div>

      {/* ---- Bottom-left: mode + spot + hard ---- */}
      <div className="absolute bottom-5 left-5 flex flex-col gap-2 md:bottom-7 md:left-7">
        <div data-ui className="pointer-events-auto flex overflow-hidden rounded-lg border border-chalk/15">
          {(["free", "three"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-4 py-2 font-mono text-xs uppercase tracking-widest transition-colors ${
                mode === m
                  ? "bg-flame text-court"
                  : "bg-black/40 text-chalk/60 hover:text-chalk"
              }`}
            >
              {m === "free" ? "Free Throw" : "3-Point"}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {mode === "three" && (
            <div data-ui className="pointer-events-auto flex items-center gap-1 rounded-lg border border-chalk/15 bg-black/40">
              <button
                onClick={() => setSpot(spotIndex - 1)}
                className="px-3 py-2 font-mono text-sm text-chalk/70 hover:text-flame"
              >
                ‹
              </button>
              <span className="font-mono text-xs uppercase tracking-widest text-chalk/60">
                Spot {spotIndex + 1}
              </span>
              <button
                onClick={() => setSpot(spotIndex + 1)}
                className="px-3 py-2 font-mono text-sm text-chalk/70 hover:text-flame"
              >
                ›
              </button>
            </div>
          )}
          <button
            data-ui
            onClick={toggleHard}
            className={`pointer-events-auto rounded-lg border px-3 py-2 font-mono text-xs uppercase tracking-widest transition-colors ${
              hardMode
                ? "border-flame bg-flame/20 text-flame"
                : "border-chalk/15 bg-black/40 text-chalk/55 hover:text-chalk"
            }`}
          >
            Hard Wind {hardMode ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      {/* ---- Bottom-center: power + elevation ---- */}
      <div className="absolute bottom-28 left-1/2 flex w-[min(420px,92vw)] -translate-x-1/2 flex-col items-center gap-2 sm:bottom-6">
        <div className="flex w-full items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-mega text-chalk/45">
            Pow
          </span>
          <div className="relative h-3 flex-1 overflow-hidden rounded-full border border-chalk/15 bg-black/40">
            <div
              className="h-full rounded-full transition-[width] duration-75"
              style={{
                width: `${aim.power * 100}%`,
                background:
                  "linear-gradient(90deg,#ff8a3d,#ff5722 60%,#ff2d2d)",
                boxShadow: charging ? "0 0 14px #ff5722" : "none",
              }}
            />
            {/* sweet-spot ticks */}
            {[0.45, 0.62, 0.78].map((p) => (
              <span
                key={p}
                className="absolute top-0 h-full w-px bg-chalk/30"
                style={{ left: `${p * 100}%` }}
              />
            ))}
          </div>
          <span className="w-10 text-right font-mono text-xs text-ember">
            {Math.round(aim.power * 100)}
          </span>
        </div>
        <div className="flex w-full items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-mega text-chalk/45">
            Arc
          </span>
          <input
            data-ui
            type="range"
            min={22}
            max={66}
            value={elevDeg}
            onChange={(e) =>
              useGame.getState().setAim({
                elevation: (Number(e.target.value) * Math.PI) / 180,
              })
            }
            className="pointer-events-auto flex-1 accent-flame"
          />
          <span className="w-10 text-right font-mono text-xs text-ember">
            {elevDeg}°
          </span>
        </div>
      </div>

      {/* ---- Controls hint ---- */}
      <div className="absolute bottom-7 right-7 hidden text-right md:block">
        <p className="font-mono text-[11px] leading-relaxed text-chalk/40">
          <span className="text-chalk/70">Drag up</span> toward the rim to shoot
          <br />
          <span className="text-chalk/70">Sideways</span> fine-tunes aim ·{" "}
          <span className="text-chalk/70">Wheel / ↑↓</span> arc
          <br />
          <span className="text-chalk/70">Space</span> auto-power ·{" "}
          <span className="text-chalk/70">Right-drag</span> orbit
        </p>
      </div>

      <Toasts />
    </div>
  );
}
