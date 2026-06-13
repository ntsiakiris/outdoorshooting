import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
        body: ["var(--font-body)", "sans-serif"],
      },
      colors: {
        court: "#0c0a09",
        flame: "#ff5722",
        ember: "#ff8a3d",
        chalk: "#f5f0e6",
        sky1: "#1b2a4a",
      },
      keyframes: {
        floatup: {
          "0%": { opacity: "0", transform: "translateY(12px) scale(0.9)" },
          "15%": { opacity: "1", transform: "translateY(0) scale(1)" },
          "85%": { opacity: "1", transform: "translateY(-18px) scale(1)" },
          "100%": { opacity: "0", transform: "translateY(-40px) scale(0.95)" },
        },
        pulseRing: {
          "0%": { transform: "scale(0.8)", opacity: "0.8" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
      },
      animation: {
        floatup: "floatup 1.6s ease-out forwards",
        pulseRing: "pulseRing 1.2s ease-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
