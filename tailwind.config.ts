import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sky: {
          50: "#F0F9FF",
          100: "#B0E2FF",
          200: "#82CAFA",
          300: "#6BB8E8",
        },
        surface: "#FFFFFF",
        ink: "#0A0A0A",
      },
      fontFamily: {
        sans: [
          "Cairo",
          "IBM Plex Sans Arabic",
          "Noto Sans Arabic",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
      },
      boxShadow: {
        soft: "0 4px 16px -4px rgba(0,0,0,0.08)",
        card: "0 2px 8px rgba(0,0,0,0.06), 0 12px 32px -8px rgba(130,202,250,0.18)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #B0E2FF, #FFFFFF, #82CAFA)",
      },
    },
  },
  plugins: [],
};
export default config;
