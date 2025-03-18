import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: "#FFD700", // Gold color
        black: "#000000",
        white: "#FFFFFF",
        gray: {
          100: "#f3f4f6",
          600: "#4b5563",
          900: "#111827",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
