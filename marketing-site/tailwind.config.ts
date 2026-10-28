import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./trading/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#0A0B0D",
          surface: "#0E1015",
          card: "#12151D",
          cardHover: "#171B26",
          border: "#1E2433",
          borderLight: "#2D3748",
          green: "#00FFA3",
          greenHover: "#00E08F",
          greenMuted: "rgba(0, 255, 163, 0.12)",
          gold: "#FFD700",
          purple: "#A855F7",
          text: "#F3F4F6",
          muted: "#9CA3AF",
          subtle: "#6B7280",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        glow: "0 0 25px -5px rgba(0, 255, 163, 0.25)",
        glowSm: "0 0 15px -3px rgba(0, 255, 163, 0.2)",
        glowGold: "0 0 25px -5px rgba(255, 215, 0, 0.25)",
        card: "0 10px 30px -10px rgba(0, 0, 0, 0.7)",
      },
    },
  },
  plugins: [],
};

export default config;
