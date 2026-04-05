/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        accent: "var(--accent)",
        "accent-dim": "var(--accent-dim)",
        "bg-primary": "#0a0a0a",
        "bg-secondary": "#111111",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        glitch: "glitch 0.15s infinite",
        blink: "blink 1s step-end infinite",
        scanline: "scanline 1.5s linear infinite",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
      },
      keyframes: {
        glitch: {
          "0%": { transform: "translateX(0)", color: "var(--accent)" },
          "20%": { transform: "translateX(-2px)", color: "#ff3b3b" },
          "40%": { transform: "translateX(2px)", color: "#ffffff" },
          "60%": { transform: "translateX(-1px)", color: "var(--accent)" },
          "80%": { transform: "translateX(1px)", color: "#ff3b3b" },
          "100%": { transform: "translateX(0)", color: "var(--accent)" },
        },
        blink: {
          "0%, 49%": { opacity: "1" },
          "50%, 100%": { opacity: "0" },
        },
        scanline: {
          "0%": { top: "0%" },
          "100%": { top: "100%" },
        },
        pulseGlow: {
          "0%, 100%": { transform: "scale(1)", filter: "brightness(1)" },
          "50%": { transform: "scale(1.05)", filter: "brightness(1.15)" },
        },
      },
    },
  },
  plugins: [],
};
