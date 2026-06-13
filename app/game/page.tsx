"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import UI from "@/components/UI";
import AimController from "@/components/AimController";

// R3F + Rapier must run client-side only (WASM physics, WebGL).
const Scene = dynamic(() => import("@/components/Scene"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center bg-court">
      <div className="text-center">
        <p className="font-display text-5xl text-flame">Chalking up…</p>
        <p className="mt-2 font-mono text-xs uppercase tracking-mega text-chalk/40">
          loading court
        </p>
      </div>
    </div>
  ),
});

export default function GamePage() {
  // Wind is randomized at store init, so the HUD is non-deterministic. Render
  // it only after mount to avoid an SSR/client hydration mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <main className="grain relative h-screen w-screen overflow-hidden bg-court">
      <Scene />
      {mounted && (
        <>
          <UI />
          <AimController />
        </>
      )}
    </main>
  );
}
