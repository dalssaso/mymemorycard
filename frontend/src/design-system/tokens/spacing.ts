/**
 * Spacing tokens matching CSS variables in tokens.css
 */

export const spacing = {
  space1: "var(--space-1)",
  space2: "var(--space-2)",
  space3: "var(--space-3)",
  space4: "var(--space-4)",
  space5: "var(--space-5)",
  space6: "var(--space-6)",
  space8: "var(--space-8)",
  space10: "var(--space-10)",
  space12: "var(--space-12)",
  space16: "var(--space-16)",
} as const;

export const layout = {
  navRailWidth: "var(--nav-rail-width)",
  topBarHeight: "var(--top-bar-height)",
  bottomTabHeight: "var(--bottom-tab-height)",
  contentMaxWidth: "var(--content-max-width)",
} as const;

export type SpacingToken = keyof typeof spacing;
