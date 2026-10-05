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
          DEFAULT: "#111827",
          sidebar: "#1B365D",
        },
        ground: {
          DEFAULT: "#F7F6F2",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          alt: "#F9FAFB",
        },
        line: {
          DEFAULT: "#E2E8F0",
        },
        mutedText: {
          DEFAULT: "#64748B",
        },
        primary: {
          DEFAULT: "#1E56D8",
          hover: "#174CBF",
          accent: "#3B82F6",
        },
        chasing: {
          DEFAULT: "#C25E00",
          tint: "#FEF3C7",
        },
        shared: {
          DEFAULT: "#2563EB",
          tint: "#EFF6FF",
        },
        danger: {
          DEFAULT: "#DC2626",
          tint: "#FEE2E2",
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
      boxShadow: {
        "2xs": "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
      },
      spacing: {
        "panel-p": "18px",
        "page-p": "28px",
        "0.2": "1px",
        "0.1": "0.5px",
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
