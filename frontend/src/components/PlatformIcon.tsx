import { useMemo } from "react";

// Legacy support - accepts string platform names
interface PlatformIconProps {
  platform: string;
  size?: "xs" | "sm" | "md" | "lg";
  showLabel?: boolean;
}

// New interface - accepts full platform objects
interface PlatformIconBadgeProps {
  platform: {
    displayName: string;
    iconUrl?: string | null;
    colorPrimary: string;
  };
  size?: "xs" | "sm" | "md" | "lg";
  showLabel?: boolean;
}

const SIZE_CLASSES = {
  xs: "w-4 h-4 text-[8px]", // 16px
  sm: "w-6 h-6 text-[10px]", // 24px
  md: "w-10 h-10 text-sm", // 40px
  lg: "w-12 h-12 text-base", // 48px
};

const PADDING_CLASSES = {
  xs: "p-0.5",
  sm: "p-1",
  md: "p-2",
  lg: "p-2.5",
};

// Default colors for legacy string-based platforms
const LEGACY_COLORS = new Map<string, string>([
  ["steam", "#1B2838"],
  ["playstation", "#0070CC"],
  ["xbox", "#107C10"],
  ["epic games", "#313131"],
  ["epic games store", "#313131"],
  ["nintendo", "#E60012"],
  ["nintendo switch", "#E60012"],
  ["gog", "#86328A"],
]);

function getLegacyColor(platform: string): string {
  const normalized = platform.toLowerCase();
  const directColor = LEGACY_COLORS.get(normalized);
  if (directColor) {
    return directColor;
  }
  if (normalized.includes("playstation") || normalized.includes("ps")) {
    return LEGACY_COLORS.get("playstation") ?? "#6B7280";
  }
  if (normalized.includes("xbox")) {
    return LEGACY_COLORS.get("xbox") ?? "#6B7280";
  }
  if (normalized.includes("nintendo") || normalized.includes("switch")) {
    return LEGACY_COLORS.get("nintendo") ?? "#6B7280";
  }
  if (normalized.includes("steam")) {
    return LEGACY_COLORS.get("steam") ?? "#6B7280";
  }
  if (normalized.includes("epic")) {
    return LEGACY_COLORS.get("epic games") ?? "#6B7280";
  }
  if (normalized.includes("gog")) {
    return LEGACY_COLORS.get("gog") ?? "#6B7280";
  }
  return "#6B7280"; // Default gray
}

export function getPlatformColor(platform: string): string {
  return getLegacyColor(platform);
}

// New component for platform icons with colors and SVG support
export function PlatformIconBadge({
  platform,
  size = "sm",
  showLabel = false,
}: PlatformIconBadgeProps) {
  const initial = platform.displayName?.charAt(0).toUpperCase() || "?";

  const colorPrimary = platform.colorPrimary || "#6B7280";

  // Determine if background is light (need dark icon)
  const isLightBackground = useMemo(() => {
    const hex = colorPrimary.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 155;
  }, [colorPrimary]);

  return (
    <div className={`flex items-center gap-1 ${showLabel ? "" : "inline-flex"}`}>
      <div
        className={`${SIZE_CLASSES[size]} ${PADDING_CLASSES[size]} flex flex-shrink-0 items-center justify-center rounded-lg`}
        style={{ backgroundColor: colorPrimary }}
        title={platform.displayName || "Unknown"}
      >
        {platform.iconUrl ? (
          <img
            src={platform.iconUrl}
            alt={platform.displayName || "Platform"}
            className={`h-full w-full object-contain ${
              isLightBackground ? "brightness-0 filter" : "brightness-0 invert filter"
            }`}
          />
        ) : (
          <span
            className={`font-semibold ${
              isLightBackground ? "text-text-muted" : "text-text-primary"
            }`}
          >
            {initial}
          </span>
        )}
      </div>
      {showLabel && (
        <span className="text-sm text-text-muted">{platform.displayName || "Unknown"}</span>
      )}
    </div>
  );
}

// Legacy component - kept for backward compatibility
export function PlatformIcon({ platform, size = "md", showLabel = false }: PlatformIconProps) {
  const colorPrimary = getLegacyColor(platform);

  return (
    <PlatformIconBadge
      platform={{
        displayName: platform,
        colorPrimary,
        iconUrl: null,
      }}
      size={size}
      showLabel={showLabel}
    />
  );
}

// Support for both string arrays and object arrays
interface PlatformIconsProps {
  platforms:
    | string[]
    | Array<{
        displayName: string;
        iconUrl?: string | null;
        colorPrimary: string;
      }>;
  size?: "xs" | "sm" | "md" | "lg";
  maxDisplay?: number;
}

export function PlatformIcons({ platforms, size = "md", maxDisplay = 5 }: PlatformIconsProps) {
  const displayPlatforms = platforms.slice(0, maxDisplay);
  const remainingCount = platforms.length - maxDisplay;

  return (
    <div className="flex items-center gap-1">
      {displayPlatforms.map((platform, index) => {
        if (typeof platform === "string") {
          return <PlatformIcon key={index} platform={platform} size={size} />;
        } else {
          return <PlatformIconBadge key={index} platform={platform} size={size} />;
        }
      })}
      {remainingCount > 0 && (
        <span className="ml-1 text-xs text-text-secondary">+{remainingCount}</span>
      )}
    </div>
  );
}
