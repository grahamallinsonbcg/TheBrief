import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: "#6366f1",
          dark: "#4f46e5",
          light: "#eef2ff",
          muted: "#c7d2fe",
        },
      },
    },
  },
  plugins: [],
};

export default config;
