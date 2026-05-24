/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["Poppins", "sans-serif"],
        body: ["DM Sans", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#f0f0ff",
          100: "#e0e0ff",
          200: "#c4bfff",
          300: "#9e8fff",
          400: "#7c5cff",
          500: "#6c3bff",
          600: "#5b21f0",
          700: "#4c1cd4",
          800: "#3b1a9e",
          900: "#2e1670",
          950: "#1a0a40",
        },
        accent: {
          50: "#fdf4ff",
          100: "#fae8ff",
          200: "#f5d0fe",
          300: "#f0abfc",
          400: "#e879f9",
          500: "#d946ef",
          600: "#c026d3",
          700: "#a21caf",
          800: "#86198f",
          900: "#701a75",
        },
        surface: {
          dark: "#0f0a2e",
          DEFAULT: "#1a1040",
          light: "#221a4a",
          card: "#2a2255",
          secondary: "#191a23",
          hover: "#2e2e3a",
          border: "#3a3070",
          muted: "#6b6390",
        },
        error: {
          DEFAULT: "#ef4444",
          dark: "#dc2626",
          light: "#f87171",
        },
        success: {
          DEFAULT: "#22c55e",
          dark: "#16a34a",
          light: "#4ade80",
        },
        warning: {
          DEFAULT: "#eab308",
          light: "#facc15",
        },
      },
      boxShadow: {
        card: "0 2px 8px rgba(0, 0, 0, 0.3)",
        "card-hover": "0 8px 24px rgba(108, 59, 255, 0.15)",
        "glow-indigo": "0 0 20px rgba(108, 59, 255, 0.15)",
        modal: "0 20px 60px rgba(0, 0, 0, 0.5)",
      },
      animation: {
        "fade-in-up": "fadeInUp 0.6s ease-out forwards",
        "fade-in": "fadeIn 0.4s ease-out forwards",
        "slide-in-left": "slideInLeft 0.4s ease-out forwards",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        shimmer: "shimmer 2s infinite linear",
        "spin-slow": "spin 3s linear infinite",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideInLeft: {
          "0%": { opacity: "0", transform: "translateX(-16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 8px rgba(124, 92, 255, 0.3)" },
          "50%": { boxShadow: "0 0 24px rgba(124, 92, 255, 0.6)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      borderRadius: {
        button: '10px',
        card: '14px',
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
}