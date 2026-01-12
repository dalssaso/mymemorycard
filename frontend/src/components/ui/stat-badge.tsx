import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface StatBadgeProps {
  variant?: "default" | "success" | "warning" | "danger";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
  className?: string;
}

const variantStyles = {
  default: "bg-surface text-text-secondary border-border",
  success: "bg-status-finished/20 text-status-finished border-status-finished",
  warning: "bg-status-dropped/20 text-status-dropped border-status-dropped",
  danger: "bg-status-dropped/20 text-status-dropped border-status-dropped",
} as const;

const sizeStyles = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-sm",
  lg: "px-3 py-1.5 text-base",
} as const;

export function StatBadge({
  variant = "default",
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
