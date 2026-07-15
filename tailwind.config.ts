import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#f4efe7",
        surface: "#fffaf2",
        ink: "#172033",
        muted: "#5f687c",
        accent: "#0f766e",
        accentSoft: "#d9f2ef",
        warning: "#d97706",
        danger: "#b42318",
        success: "#15803d"
      },
      boxShadow: {
        soft: "0 18px 60px rgba(15, 23, 42, 0.12)"
      },
      borderRadius: {
        xl: "1.25rem"
      }
    }
  },
  plugins: []
};

export default config;