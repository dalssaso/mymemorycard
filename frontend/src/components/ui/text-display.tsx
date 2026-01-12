import React, { type ElementType } from "react";
import { cn } from "@/lib/utils";

export type TextDisplayProps<T extends ElementType = "div"> = React.ComponentPropsWithoutRef<T> & {
  as?: T;
  variant?: "primary" | "secondary" | "muted";
  size?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl";
  weight?: "regular" | "medium" | "semibold" | "bold";
};

type Variant = "primary" | "secondary" | "muted";
type Size = "xs" | "sm" | "base" | "lg" | "xl" | "2xl";
type Weight = "regular" | "medium" | "semibold" | "bold";

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

export const TextDisplay = React.forwardRef<HTMLElement, TextDisplayProps<ElementType>>(
  (
    {
      variant = "primary",
      size = "base",
      weight = "regular",
      as: component = "div",
      children,
      className,
      ...props
    }: TextDisplayProps<ElementType>,
    ref
  ) => {
    const Component = component as React.ElementType;
    const v = variant as Variant;
    const s = size as Size;
    const w = weight as Weight;

    return (
      <Component
        ref={ref}
        className={cn(variantStyles[v], sizeStyles[s], weightStyles[w], className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

TextDisplay.displayName = "TextDisplay";
