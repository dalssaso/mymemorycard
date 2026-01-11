/**
 * Typography tokens matching CSS variables in tokens.css
 */

export const fontFamily = "var(--font-family)" as const;

export const fontWeight = {
  regular: "var(--font-weight-regular)",
  medium: "var(--font-weight-medium)",
  semibold: "var(--font-weight-semibold)",
  bold: "var(--font-weight-bold)",
} as const;

export const fontSize = {
  xs: "var(--font-size-xs)",
  sm: "var(--font-size-sm)",
  base: "var(--font-size-base)",
  lg: "var(--font-size-lg)",
  xl: "var(--font-size-xl)",
  xxl: "var(--font-size-2xl)",
  xxxl: "var(--font-size-3xl)",
} as const;

export const lineHeight = {
  body: "var(--line-height-body)",
  heading: "var(--line-height-heading)",
} as const;

export type FontSizeToken = keyof typeof fontSize;
export type FontWeightToken = keyof typeof fontWeight;
