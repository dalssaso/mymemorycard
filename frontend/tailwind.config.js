import tailwindcssAnimate from "tailwindcss-animate"

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/shadcn-ui/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ctp: {
          base: "var(--ctp-base)",
          mantle: "var(--ctp-mantle)",
          crust: "var(--ctp-crust)",
          surface0: "var(--ctp-surface0)",
          surface1: "var(--ctp-surface1)",
          surface2: "var(--ctp-surface2)",
          overlay0: "var(--ctp-overlay0)",
          overlay1: "var(--ctp-overlay1)",
          overlay2: "var(--ctp-overlay2)",
          subtext0: "var(--ctp-subtext0)",
          subtext1: "var(--ctp-subtext1)",
          text: "var(--ctp-text)",
          rosewater: "var(--ctp-rosewater)",
          flamingo: "var(--ctp-flamingo)",
          pink: "var(--ctp-pink)",
          mauve: "var(--ctp-mauve)",
          red: "var(--ctp-red)",
          maroon: "var(--ctp-maroon)",
          peach: "var(--ctp-peach)",
          yellow: "var(--ctp-yellow)",
          green: "var(--ctp-green)",
          teal: "var(--ctp-teal)",
          sky: "var(--ctp-sky)",
          sapphire: "var(--ctp-sapphire)",
          blue: "var(--ctp-blue)",
          lavender: "var(--ctp-lavender)",
        },
        primary: {
          purple: "var(--ctp-mauve)",
          cyan: "var(--ctp-teal)",
          green: "var(--ctp-green)",
          red: "var(--ctp-red)",
          yellow: "var(--ctp-yellow)",
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        bg: {
          primary: "var(--ctp-base)",
          secondary: "var(--ctp-mantle)",
          tertiary: "var(--ctp-surface0)",
          hover: "var(--ctp-surface1)",
        },
        status: {
          backlog: "var(--ctp-overlay1)",
          playing: "var(--ctp-teal)",
          finished: "var(--ctp-green)",
          dropped: "var(--ctp-red)",
          completed: "var(--ctp-yellow)",
        },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
      },
      boxShadow: {
        "glow-purple": "0 0 20px rgba(139, 92, 246, 0.5)",
        "glow-cyan": "0 0 20px rgba(6, 182, 212, 0.5)",
        "glow-green": "0 0 20px rgba(16, 185, 129, 0.5)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
