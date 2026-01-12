import type { CSSProperties } from "react";
import { colors } from "@/design-system/tokens/colors";

export interface StatusConfig {
  id: string;
  label: string;
  icon: string;
  iconFill?: boolean; // For favorites (filled heart)
  color: string;
  bgStyle: CSSProperties;
  activeStyle: CSSProperties;
}

export const STATUS_CONFIGS: Record<string, StatusConfig> = {
  total: {
    id: "total",
    label: "Total Games",
    icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
    color: "status-backlog",
    bgStyle: {
      backgroundColor: `color-mix(in srgb, ${colors.status.backlog} 35%, transparent)`,
    },
    activeStyle: {
      backgroundColor: `color-mix(in srgb, ${colors.status.backlog} 35%, transparent)`,
      borderColor: `color-mix(in srgb, ${colors.status.backlog} 55%, transparent)`,
    },
  },
  playing: {
    id: "playing",
    label: "Playing",
    icon: "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664zM21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    color: "status-playing",
    bgStyle: {
      backgroundColor: `color-mix(in srgb, ${colors.status.playing} 35%, transparent)`,
    },
    activeStyle: {
      backgroundColor: `color-mix(in srgb, ${colors.status.playing} 35%, transparent)`,
      borderColor: `color-mix(in srgb, ${colors.status.playing} 55%, transparent)`,
    },
  },
  completed: {
    id: "completed",
    label: "Completed",
    icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    color: "status-completed",
    bgStyle: {
      backgroundColor: `color-mix(in srgb, ${colors.status.completed} 35%, transparent)`,
    },
    activeStyle: {
      backgroundColor: `color-mix(in srgb, ${colors.status.completed} 35%, transparent)`,
      borderColor: `color-mix(in srgb, ${colors.status.completed} 55%, transparent)`,
    },
  },
  backlog: {
    id: "backlog",
    label: "Backlog",
    icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    color: "status-backlog",
    bgStyle: {
      backgroundColor: `color-mix(in srgb, ${colors.status.backlog} 30%, transparent)`,
    },
    activeStyle: {
      backgroundColor: `color-mix(in srgb, ${colors.status.backlog} 30%, transparent)`,
      borderColor: `color-mix(in srgb, ${colors.status.backlog} 55%, transparent)`,
    },
  },
  dropped: {
    id: "dropped",
    label: "Dropped",
    icon: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636",
    color: "status-dropped",
    bgStyle: {
      backgroundColor: `color-mix(in srgb, ${colors.status.dropped} 35%, transparent)`,
    },
    activeStyle: {
      backgroundColor: `color-mix(in srgb, ${colors.status.dropped} 35%, transparent)`,
      borderColor: `color-mix(in srgb, ${colors.status.dropped} 55%, transparent)`,
    },
  },
  favorites: {
    id: "favorites",
    label: "Favorites",
    icon: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
    iconFill: true,
    color: "status-dropped",
    bgStyle: {
      backgroundColor: `color-mix(in srgb, ${colors.status.dropped} 35%, transparent)`,
    },
    activeStyle: {
      backgroundColor: `color-mix(in srgb, ${colors.status.dropped} 35%, transparent)`,
      borderColor: `color-mix(in srgb, ${colors.status.dropped} 55%, transparent)`,
    },
  },
  // Aliases for backward compatibility
  finished: {
    id: "finished",
    label: "Finished",
    icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    color: "status-finished",
    bgStyle: {
      backgroundColor: `color-mix(in srgb, ${colors.status.finished} 35%, transparent)`,
    },
    activeStyle: {
      backgroundColor: `color-mix(in srgb, ${colors.status.finished} 35%, transparent)`,
      borderColor: `color-mix(in srgb, ${colors.status.finished} 55%, transparent)`,
    },
  },
};

// Ordered array for consistent display
export const STATUS_ORDER: string[] = [
  "total",
  "playing",
  "completed",
  "backlog",
  "dropped",
  "favorites",
];

// Helper to get status config with fallback
export function getStatusConfig(id: string): StatusConfig | undefined {
  return STATUS_CONFIGS[id];
}
