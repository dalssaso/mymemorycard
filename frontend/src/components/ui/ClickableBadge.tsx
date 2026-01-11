import { Button } from "./button";

interface ClickableBadgeProps {
  label: string;
  percentage: number;
  color: string;
  onClick: () => void;
  className?: string;
}

export function ClickableBadge({
  label,
  percentage,
  color,
  onClick,
  className = "",
}: ClickableBadgeProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <Button
      type="button"
      onClick={onClick}
      onKeyDown={handleKeyDown}
      variant="ghost"
      className={`inline-flex h-auto cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all duration-150 ease-out hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 active:scale-95 ${className}`}
      style={{
        backgroundColor: `color-mix(in srgb, ${color} 20%, transparent)`,
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: `color-mix(in srgb, ${color} 50%, transparent)`,
        color: color,
      }}
      aria-label={`View ${label} progress details, currently at ${percentage}%`}
    >
      <span className="font-semibold">{label}:</span>
      <span>{percentage}%</span>
    </Button>
  );
}
