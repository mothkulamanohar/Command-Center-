import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#17191E",
          sidebar: "#17191E",
        },
        ground: {
          DEFAULT: "#F4F2EC",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          alt: "#FBFAF7",
        },
        line: {
          DEFAULT: "#E3E0D8",
        },
        mutedText: {
          DEFAULT: "#5B5F68",
        },
        primary: {
          DEFAULT: "#0E6E66",
          hover: "#0A4F49",
          accent: "#3FB8AC",
        },
        chasing: {
          DEFAULT: "#9A4A08",
          tint: "#F6E4D0",
        },
        shared: {
          DEFAULT: "#5B3FA6",
          tint: "#E7E1F4",
        },
        danger: {
          DEFAULT: "#B42318",
          tint: "#FBE3E0",
        },
      },
      borderRadius: {
        control: "8px",
        card: "10px",
        panel: "14px",
      },
      fontFamily: {
        sans: ["var(--font-ibm-plex-sans)", "IBM Plex Sans", "sans-serif"],
        mono: ["var(--font-ibm-plex-mono)", "IBM Plex Mono", "monospace"],
      },
      spacing: {
        "panel-p": "18px",
        "page-p": "28px",
      },
      minHeight: {
        touch: "44px",
      },
      minWidth: {
        touch: "44px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
