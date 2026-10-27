import type { Config } from "tailwindcss";

const v = (name: string) => `rgb(var(${name}) / <alpha-value>)`;
const neutral = Object.fromEntries(
  [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((s) => [s, v(`--n-${s}`)]),
);

const config: Config = {
  darkMode: "class",
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Semantic, theme-aware colours (see globals.css for light/dark values).
        royal: v("--c-bg"),
        card: v("--c-surface"),
        cream: v("--c-cream"),
        white: v("--c-ink"),
        neutral,
        maroon: { DEFAULT: v("--c-maroon"), deep: "#4A0E17" },
        gold: {
          DEFAULT: v("--c-gold"),
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
