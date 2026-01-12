import React, { type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "muted";
type Size = "xs" | "sm" | "base" | "lg" | "xl" | "2xl";
type Weight = "regular" | "medium" | "semibold" | "bold";

export type TextDisplayProps = {
  as?: React.ElementType;
  variant?: Variant;
  size?: Size;
  weight?: Weight;
  children?: ReactNode;
  className?: string;
} & Record<string, unknown>;

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

export const TextDisplay = React.forwardRef<HTMLElement, TextDisplayProps>(
  (
    {
      variant = "primary",
      size = "base",
      weight = "regular",
      as: component = "div",
      children,
      className,
      ...props
    },
    ref
  ): React.ReactElement | null => {
    const element = component as React.ElementType;

    const variantValue = (variant ?? "primary") as Variant;
    const sizeValue = (size ?? "base") as Size;
    const weightValue = (weight ?? "regular") as Weight;
    const classNameStr = typeof className === "string" ? className : "";

    return React.createElement(
      element,
      {
        ref,
        className: cn(
          variantStyles[variantValue],
          sizeStyles[sizeValue],
          weightStyles[weightValue],
          classNameStr
        ),
        ...(props as Record<string, unknown>),
      },
      children as ReactNode
    );
  }
);

TextDisplay.displayName = "TextDisplay";
