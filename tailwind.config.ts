import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        civic: {
          navy: "#0F172A",
          blue: "#1D4ED8",
          red: "#DC2626",
          amber: "#D97706",
          emerald: "#059669",
          slate: "#F8FAFC",
          border: "#E2E8F0",
        },
        agency: {
          gcc: "#4338CA",
          cmwssb: "#0284C7",
          tangedco: "#EA580C",
          cmrl: "#7E22CE",
          telecom: "#0D9488",
        },
      },
    },
  },
  plugins: [],
};

export default config;
