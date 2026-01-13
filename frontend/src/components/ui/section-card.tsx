import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface SectionCardProps {
  variant?: "base" | "surface" | "elevated";
  padding?: "none" | "sm" | "md" | "lg";
  children: ReactNode;
  className?: string;
}

const variantStyles = {
  base: "bg-base border-border",
  surface: "bg-surface border-border",
  elevated: "bg-elevated border-border",
} as const;

const paddingStyles = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
} as const;

export function SectionCard({
  variant = "surface",
  padding = "md",
  children,
  className,
}: SectionCardProps): JSX.Element {
  return (
    <div
      className={cn(
        "rounded-lg border transition-colors duration-quick ease-out",
        variantStyles[variant],
        paddingStyles[padding],
        className
      )}
    >
      {children}
    </div>
  );
}
