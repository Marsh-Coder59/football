import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#0b0f14",
          raised: "#111826",
          panel: "#151d2c",
          border: "#232e42",
        },
        ink: {
          DEFAULT: "#e7ecf3",
          muted: "#93a2b8",
          faint: "#5c6b82",
        },
        brand: {
          50: "#eef6ff",
          200: "#a9d3ff",
          400: "#4d9fff",
          500: "#2a83ef",
          600: "#1c66c2",
          700: "#174f96",
        },
        pos: "#2fbf71",
        neg: "#e05a5a",
        warn: "#e0a63a",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      borderRadius: {
        xl: "0.85rem",
      },
    },
  },
  plugins: [],
};

export default config;
