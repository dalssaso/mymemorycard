/**
 * Motion tokens matching CSS variables in tokens.css
 * Also includes Framer Motion compatible values
 */

export const duration = {
  instant: 0,
  quick: 100,
  standard: 200,
  smooth: 350,
  page: 400,
} as const;

export const durationCSS = {
  instant: "var(--duration-instant)",
  quick: "var(--duration-quick)",
  standard: "var(--duration-standard)",
  smooth: "var(--duration-smooth)",
  page: "var(--duration-page)",
} as const;

export const easing = {
  out: [0, 0, 0.2, 1] as const,
  in: [0.4, 0, 1, 1] as const,
  spring: [0.34, 1.56, 0.64, 1] as const,
} as const;

export const easingCSS = {
  out: "var(--ease-out)",
  in: "var(--ease-in)",
  spring: "var(--ease-spring)",
} as const;

// Framer Motion spring presets
export const spring = {
  default: { stiffness: 300, damping: 30 },
  bouncy: { stiffness: 400, damping: 25 },
  gentle: { stiffness: 200, damping: 35 },
} as const;

export type DurationToken = keyof typeof duration;
export type EasingToken = keyof typeof easing;
