import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        emerald: {
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
        },
        neon: {
          green: "#00ff9d",
          pink: "#ff6eb4",
          emerald: "#00e87a",
        },
        luxury: {
          pink: "#f4a0c0",
          rose: "#ff85a1",
          blush: "#ffd6e0",
        },
        charcoal: {
          900: "#0a0a0f",
          800: "#0f0f1a",
          700: "#141420",
          600: "#1a1a2e",
          500: "#1e1e35",
        },
        silver: {
          300: "#d4d4d8",
          400: "#a1a1aa",
          500: "#71717a",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
        display: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "gradient-luxury": "linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 50%, #141420 100%)",
        "gradient-neon": "linear-gradient(135deg, #00ff9d20 0%, #ff6eb420 100%)",
        "gradient-hero": "radial-gradient(ellipse at top, #00ff9d15 0%, transparent 60%), radial-gradient(ellipse at bottom right, #ff6eb415 0%, transparent 60%)",
      },
      animation: {
        "float": "float 6s ease-in-out infinite",
        "float-slow": "float 8s ease-in-out infinite",
        "float-delayed": "float 6s ease-in-out 3s infinite",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        "scan": "scan 2s linear infinite",
        "shimmer": "shimmer 2s linear infinite",
        "rotate-slow": "rotate 20s linear infinite",
        "gradient-shift": "gradientShift 8s ease infinite",
        "fade-up": "fadeUp 0.6s ease-out forwards",
        "blob": "blob 7s infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 20px #00ff9d40, 0 0 60px #00ff9d20" },
          "50%": { boxShadow: "0 0 40px #00ff9d80, 0 0 120px #00ff9d40" },
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        gradientShift: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        blob: {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(30px, -50px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
          "100%": { transform: "translate(0px, 0px) scale(1)" },
        },
      },
      boxShadow: {
        "neon-green": "0 0 20px #00ff9d40, 0 0 60px #00ff9d20",
        "neon-pink": "0 0 20px #ff6eb440, 0 0 60px #ff6eb420",
        "neon-green-lg": "0 0 40px #00ff9d60, 0 0 100px #00ff9d30",
        "glass": "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255,255,255,0.05)",
        "luxury": "0 25px 50px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255,255,255,0.05)",
        "card": "0 4px 24px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255,255,255,0.04)",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};

export default config;
