import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        royal: "#121212",
        card: "#1a1a1a",
        gold: {
          DEFAULT: "#D4AF37",
          light: "#FCF6BA",
          dark: "#AA771C",
          muted: "#BF953F",
        },
      },
      backgroundImage: {
        "gold-gradient": "linear-gradient(135deg, #BF953F, #FCF6BA, #AA771C)",
      },
      fontFamily: {
        heading: ["var(--font-cinzel)", "serif"],
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
