interface PlatformTypeIconProps {
  type: "pc" | "console" | "mobile" | "physical";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  color?: string;
}

const PLATFORM_TYPE_CONFIG = {
  pc: { icon: "computer", label: "PC" },
  console: { icon: "videogame_asset", label: "Console" },
  mobile: { icon: "smartphone", label: "Mobile" },
  physical: { icon: "album", label: "Physical" },
};

const SIZE_CLASSES = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

export function PlatformTypeIcon({
  type,
  size = "sm",
  showLabel = false,
  color,
}: PlatformTypeIconProps) {
  const config = PLATFORM_TYPE_CONFIG[type];
  const containerClasses = color
    ? "inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-white"
    : "inline-flex w-fit items-center gap-1";
  const textClasses = !color ? "text-text-secondary" : "";

  return (
    <div className={containerClasses} style={color ? { backgroundColor: color } : undefined}>
      <span className={`material-symbols-outlined ${SIZE_CLASSES[size]} ${textClasses}`}>
        {config.icon}
      </span>
      {showLabel && (
        <span className={`${size === "sm" ? "text-xs" : "text-sm"} ${textClasses}`}>
          {config.label}
        </span>
      )}
    </div>
  );
}
