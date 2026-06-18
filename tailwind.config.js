/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        spirit: {
          midnight: "#0a0e27",
          deep: "#0f1638",
          purple: "#7c3aed",
          mint: "#5eead4",
          gold: "#fbbf24",
          pink: "#fda4af",
          ocean: "#0ea5e9",
          soft: "#1e1b4b",
        },
      },
      fontFamily: {
        display: ["'LXGW WenKai'", "'Noto Serif SC'", "serif"],
        body: ["'HarmonyOS Sans'", "'Noto Sans SC'", "sans-serif"],
      },
      animation: {
        "float-slow": "float 8s ease-in-out infinite",
        "float-medium": "float 5s ease-in-out infinite",
        "pulse-glow": "pulseGlow 3s ease-in-out infinite",
        "ripple": "ripple 2s ease-out infinite",
        "aurora": "aurora 20s linear infinite",
        "breathing": "breathing 8s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.5", boxShadow: "0 0 20px rgba(124,58,237,0.3)" },
          "50%": { opacity: "1", boxShadow: "0 0 60px rgba(124,58,237,0.8)" },
        },
        ripple: {
          "0%": { transform: "scale(0.8)", opacity: "0.8" },
          "100%": { transform: "scale(2)", opacity: "0" },
        },
        aurora: {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        breathing: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.7" },
          "50%": { transform: "scale(1.3)", opacity: "1" },
        },
      },
      boxShadow: {
        "glow-purple": "0 0 40px rgba(124,58,237,0.6)",
        "glow-mint": "0 0 40px rgba(94,234,212,0.6)",
        "glow-gold": "0 0 40px rgba(251,191,36,0.6)",
        "glow-soft": "0 0 20px rgba(255,255,255,0.3)",
      },
    },
  },
  plugins: [],
};
