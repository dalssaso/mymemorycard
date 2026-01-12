import { Button } from "./button";
import { useAnimatedNumber } from "@/hooks/use-animated-number";
import { getStatusConfig } from "@/lib/constants/status";
import { cn } from "@/lib/utils";

interface StatusButtonProps {
  id: string;
  mode: "collapsed" | "expanded";
  isActive?: boolean;
  count?: number;
  onClick: () => void;
  className?: string;
}

export function StatusButton({
  id,
  mode,
  isActive = false,
  count,
  onClick,
  className,
}: StatusButtonProps): JSX.Element | null {
  const config = getStatusConfig(id);
  const animatedCount = useAnimatedNumber(count ?? 0);

  if (!config) {
    console.warn(`StatusButton: Unknown status id "${id}"`);
    return null;
  }

  if (mode === "collapsed") {
    // Icon-only button with tooltip
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={onClick}
        className={cn("rounded-lg p-2", className)}
        style={{ color: `var(--${config.color})` }}
        title={config.label}
      >
        <svg
          className="h-5 w-5"
          fill={config.iconFill ? "currentColor" : "none"}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={config.icon} />
        </svg>
      </Button>
    );
  }

  // Expanded mode: icon + label + count
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      style={isActive ? config.activeStyle : config.bgStyle}
      className={cn(
        "flex h-auto w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm",
        isActive && "border border-border bg-surface",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <svg
          className="h-4 w-4"
          style={{ color: `var(--${config.color})` }}
          fill={config.iconFill ? "currentColor" : "none"}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={config.icon} />
        </svg>
        <span className="text-text-secondary">{config.label}</span>
      </div>
      {count !== undefined && (
        <span className="min-w-[2rem] text-right font-semibold text-text-primary">
          {animatedCount}
        </span>
      )}
    </Button>
  );
}
