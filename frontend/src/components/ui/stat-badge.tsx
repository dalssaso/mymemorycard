import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface StatBadgeProps {
  variant?: "success" | "warning" | "error" | "info" | "neutral";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
  className?: string;
}

const variantStyles = {
  success: "bg-status-finished/20 text-status-finished border-status-finished",
  warning: "bg-status-playing/20 text-status-playing border-status-playing",
  error: "bg-status-dropped/20 text-status-dropped border-status-dropped",
  info: "bg-accent/20 text-accent border-accent",
  neutral: "bg-surface text-text-secondary border-border",
} as const;

const sizeStyles = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-sm",
  lg: "px-3 py-1.5 text-base",
} as const;

export function StatBadge({
  variant = "neutral",
  size = "md",
  children,
  className,
}: StatBadgeProps): JSX.Element {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg border font-medium transition-colors duration-quick ease-out",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </span>
  );
}
