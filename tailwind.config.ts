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
        brand: {
          bg: "#050505",
          surface: "#0A0A0A",
          surface2: "#111111",
          surface3: "#161616",
          border: "#1A1A1A",
          borderStrong: "#262626",
          text: "#FFFFFF",
          muted: "#9CA3AF",
          dimmed: "#6B7280",
          success: "#22C55E",
          danger: "#EF4444",
          warning: "#F59E0B",
          accent: "#00E599",
          accentMuted: "rgba(0, 229, 153, 0.15)",
        },
      },
      fontFamily: {
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Inter",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgba(0, 0, 0, 0.4)",
        glow: "0 0 20px -5px rgba(0, 229, 153, 0.15)",
        dangerGlow: "0 0 20px -5px rgba(239, 68, 68, 0.2)",
      },
    },
  },
  plugins: [],
};

export default config;
