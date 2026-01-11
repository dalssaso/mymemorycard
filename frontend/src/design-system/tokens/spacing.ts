/**
 * Spacing tokens matching CSS variables in tokens.css
 */

export const spacing = {
  1: "var(--space-1)",
  2: "var(--space-2)",
  3: "var(--space-3)",
  4: "var(--space-4)",
  5: "var(--space-5)",
  6: "var(--space-6)",
  8: "var(--space-8)",
  10: "var(--space-10)",
  12: "var(--space-12)",
  16: "var(--space-16)",
} as const

export const layout = {
  navRailWidth: "var(--nav-rail-width)",
  topBarHeight: "var(--top-bar-height)",
  bottomTabHeight: "var(--bottom-tab-height)",
  contentMaxWidth: "var(--content-max-width)",
} as const

export type SpacingToken = keyof typeof spacing
