/**
 * Color tokens matching CSS variables in tokens.css
 * Use these for JS-based styling or dynamic color access
 */

export const colors = {
  // Background layers
  base: "var(--color-base)",
  surface: "var(--color-surface)",
  elevated: "var(--color-elevated)",
  border: "var(--color-border)",

  // Text hierarchy
  text: {
    primary: "var(--color-text-primary)",
    secondary: "var(--color-text-secondary)",
    muted: "var(--color-text-muted)",
  },

  // Accent
  accent: {
    DEFAULT: "var(--color-accent)",
    hover: "var(--color-accent-hover)",
  },

  // Status
  status: {
    playing: "var(--color-status-playing)",
    finished: "var(--color-status-finished)",
    completed: "var(--color-status-completed)",
    dropped: "var(--color-status-dropped)",
    backlog: "var(--color-status-backlog)",
  },
} as const

export type ColorToken = typeof colors
export type StatusColor = keyof typeof colors.status
