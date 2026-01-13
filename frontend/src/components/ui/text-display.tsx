import React, { type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "muted";
type Size = "xs" | "sm" | "base" | "lg" | "xl" | "2xl";
type Weight = "regular" | "medium" | "semibold" | "bold";

export type TextDisplayProps<T extends React.ElementType = "div"> = {
  as?: T;
  variant?: Variant;
  size?: Size;
  weight?: Weight;
  children?: ReactNode;
  className?: string;
} & Omit<
  React.ComponentPropsWithoutRef<T>,
  "as" | "variant" | "size" | "weight" | "children" | "className"
>;

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

interface TextDisplayComponent extends React.ForwardRefExoticComponent<
  TextDisplayProps & React.RefAttributes<HTMLElement>
> {
  <T extends React.ElementType = "div">(
    props: TextDisplayProps<T> & React.RefAttributes<HTMLElement>,
    ref?: React.ForwardedRef<HTMLElement>
  ): React.ReactElement | null;
}

const TextDisplayImpl = React.forwardRef<HTMLElement, TextDisplayProps<React.ElementType>>(
  (
    {
      variant = "primary",
      size = "base",
      weight = "regular",
      as: component = "div" as React.ElementType,
      children,
      className,
      ...props
    },
    ref
  ): React.ReactElement | null => {
    const variantClass = variantStyles[variant as Variant] ?? variantStyles.primary;
    const sizeClass = sizeStyles[size as Size] ?? sizeStyles.base;
    const weightClass = weightStyles[weight as Weight] ?? weightStyles.regular;

    return React.createElement(
      component as React.ElementType,
      {
        ref,
        className: cn(variantClass, sizeClass, weightClass, className),
        ...(props as Record<string, unknown>),
      },
      children
    );
  }
);

TextDisplayImpl.displayName = "TextDisplay";

export const TextDisplay = TextDisplayImpl as unknown as TextDisplayComponent;
