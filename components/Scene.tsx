"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { OrbitControls, Sky, ContactShadows } from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import * as THREE from "three";
import { useGame } from "@/lib/store";
import Court from "./Court";
import Hoop from "./Hoop";
import Ball from "./Ball";
import TrajectoryPreview from "./TrajectoryPreview";
import WindParticles from "./WindParticles";

export default function Scene() {
  const charging = useGame((s) => s.charging);

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      camera={{ position: [0, 2.4, 6.5], fov: 50, near: 0.1, far: 200 }}
    >
      <color attach="background" args={["#0c0a09"]} />
      <fog attach="fog" args={["#1b2a4a", 18, 55]} />

      <Sky
        distance={450000}
        sunPosition={[8, 6, -12]}
        inclination={0.52}
        azimuth={0.25}
        turbidity={6}
        rayleigh={1.2}
      />

      {/* lighting: warm daylight key + cool fill */}
      <ambientLight intensity={0.45} />
      <hemisphereLight args={["#cfe3ff", "#3a2e22", 0.5]} />
      <directionalLight
        position={[7, 11, -4]}
        intensity={2.1}
        color="#fff1d8"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={40}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
        shadow-bias={-0.0004}
      />

      <Suspense fallback={null}>
        <Physics gravity={[0, -9.81, 0]} timeStep="vary">
          <Court />
          <Hoop />
          <Ball />
        </Physics>
        <TrajectoryPreview />
        <WindParticles />
        <ContactShadows
          position={[0, 0.02, -3]}
          scale={26}
          blur={2.2}
          far={6}
          opacity={0.5}
          color="#000000"
        />
      </Suspense>

      <OrbitControls
        enablePan={false}
        enabled={!charging}
        minDistance={3}
        maxDistance={16}
        maxPolarAngle={Math.PI / 2 - 0.04}
        target={[0, 2.2, -3]}
        mouseButtons={{
          LEFT: undefined as unknown as number,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.ROTATE,
        }}
        touches={{
          // one finger = aim/shoot (handled by AimController), not orbit
          ONE: undefined as unknown as number,
          // two fingers = rotate camera + pinch zoom
          TWO: THREE.TOUCH.DOLLY_ROTATE,
        }}
      />
    </Canvas>
  );
}
