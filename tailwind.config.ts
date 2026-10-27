import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#fff5f6",
        surface: "#fffafa",
        ink: "#172033",
        muted: "#5f687c",
        accent: "#e11d48",
        accentDark: "#be123c",
        accentSoft: "#ffe4e9",
        warning: "#d97706",
        danger: "#b42318",
        success: "#15803d"
      },
      boxShadow: {
        soft: "0 12px 32px rgba(225, 29, 72, 0.12)"
      },
      borderRadius: {
        xl: "1.25rem"
      }
    }
  },
  plugins: []
};

export default config;