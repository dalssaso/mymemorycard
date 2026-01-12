import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface TextDisplayProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "primary" | "secondary" | "muted";
  size?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl";
  weight?: "regular" | "medium" | "semibold" | "bold";
  as?: ElementType;
  children: ReactNode;
}

const variantStyles = {
  primary: "text-text-primary",
  secondary: "text-text-secondary",
  muted: "text-text-muted",
} as const;

const sizeStyles = {
  xs: "text-xs",
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
  // eslint-disable-next-line @typescript-eslint/naming-convention
  "2xl": "text-2xl",
} as const;

const weightStyles = {
  regular: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
} as const;

export function TextDisplay({
  variant = "primary",
  size = "base",
  weight = "regular",
  as: component = "p",
  children,
  className,
  ...props
}: TextDisplayProps): JSX.Element {
  const Component = component;

  return (
    <Component
      className={cn(variantStyles[variant], sizeStyles[size], weightStyles[weight], className)}
      {...props}
    >
      {children}
    </Component>
  );
}
