import Link from "next/link";

export default function Home() {
  return (
    <main className="grain relative h-screen w-screen overflow-hidden bg-court">
      {/* atmospheric gradient + court line motif */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 120%, #ff5722 0%, #7a1e0a 22%, #1b2a4a 55%, #0c0a09 100%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent 0 38px, rgba(245,240,230,0.5) 38px 39px), repeating-linear-gradient(90deg, transparent 0 38px, rgba(245,240,230,0.5) 38px 39px)",
          maskImage: "radial-gradient(80% 60% at 50% 50%, black, transparent)",
          WebkitMaskImage:
            "radial-gradient(80% 60% at 50% 50%, black, transparent)",
        }}
      />

      {/* big arc */}
      <svg
        className="absolute -bottom-[40vh] left-1/2 -translate-x-1/2"
        width="160vh"
        height="160vh"
        viewBox="0 0 100 100"
      >
        <circle
          cx="50"
          cy="50"
          r="46"
          fill="none"
          stroke="#f5f0e6"
          strokeWidth="0.25"
          opacity="0.25"
        />
        <circle
          cx="50"
          cy="50"
          r="30"
          fill="none"
          stroke="#ff5722"
          strokeWidth="0.3"
          opacity="0.5"
        />
      </svg>

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <span className="mb-3 font-mono text-xs uppercase tracking-mega text-ember">
          Outdoor · Wind · Skill
        </span>
        <h1 className="font-display text-[clamp(4rem,18vw,16rem)] leading-[0.82] text-chalk">
          DOWN<span className="text-flame">TOWN</span>
        </h1>
        <p className="mt-3 max-w-md font-body text-sm font-light leading-relaxed text-chalk/65">
          A physics 3-point shootout where the wind never sits still. Read the
          gust, dial the arc, drain it from deep.
        </p>

        <Link
          href="/game"
          className="group mt-9 inline-flex items-center gap-3 rounded-full bg-flame px-9 py-4 font-mono text-sm uppercase tracking-widest text-court transition-all hover:gap-5 hover:bg-ember"
        >
          Step to the line
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </Link>

        <div className="mt-12 flex gap-8 font-mono text-[11px] uppercase tracking-mega text-chalk/40">
          <span>Drag to shoot</span>
          <span className="text-flame">·</span>
          <span>Beat the wind</span>
          <span className="text-flame">·</span>
          <span>Chase the streak</span>
        </div>
      </div>
    </main>
  );
}
