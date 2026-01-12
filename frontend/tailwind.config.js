import tailwindcssAnimate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-family)"],
      },
      colors: {
        // Core background colors
        base: "var(--color-base)",
        surface: "var(--color-surface)",
        elevated: "var(--color-elevated)",

        // Text colors
        "text-primary": "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
        "text-muted": "var(--color-text-muted)",

        // Accent
        accent: {
          DEFAULT: "var(--color-accent)",
          hover: "var(--color-accent-hover)",
        },

        // Status colors
        status: {
          playing: "var(--color-status-playing)",
          finished: "var(--color-status-finished)",
          completed: "var(--color-status-completed)",
          dropped: "var(--color-status-dropped)",
          backlog: "var(--color-status-backlog)",
          favorites: "var(--color-status-favorites)",
        },

        // shadcn compatibility
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
      },
      spacing: {
        "space-1": "var(--space-1)",
        "space-2": "var(--space-2)",
        "space-3": "var(--space-3)",
        "space-4": "var(--space-4)",
        "space-5": "var(--space-5)",
        "space-6": "var(--space-6)",
        "space-8": "var(--space-8)",
        "space-10": "var(--space-10)",
        "space-12": "var(--space-12)",
        "space-16": "var(--space-16)",
        "nav-rail": "var(--nav-rail-width)",
        "top-bar": "var(--top-bar-height)",
        "bottom-tab": "var(--bottom-tab-height)",
      },
      maxWidth: {
        content: "var(--content-max-width)",
      },
      fontSize: {
        xs: ["var(--font-size-xs)", { lineHeight: "var(--line-height-body)" }],
        sm: ["var(--font-size-sm)", { lineHeight: "var(--line-height-body)" }],
        base: ["var(--font-size-base)", { lineHeight: "var(--line-height-body)" }],
        lg: ["var(--font-size-lg)", { lineHeight: "var(--line-height-body)" }],
        xl: ["var(--font-size-xl)", { lineHeight: "var(--line-height-heading)" }],
        "2xl": ["var(--font-size-2xl)", { lineHeight: "var(--line-height-heading)" }],
        "3xl": ["var(--font-size-3xl)", { lineHeight: "var(--line-height-heading)" }],
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        DEFAULT: "var(--radius-md)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        full: "var(--radius-full)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow-md)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        "card-hover": "var(--shadow-card-hover)",
      },
      transitionDuration: {
        instant: "var(--duration-instant)",
        quick: "var(--duration-quick)",
        standard: "var(--duration-standard)",
        smooth: "var(--duration-smooth)",
        page: "var(--duration-page)",
      },
      transitionTimingFunction: {
        out: "var(--ease-out)",
        in: "var(--ease-in)",
        spring: "var(--ease-spring)",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
