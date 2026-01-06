import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ctp-mauve disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-ctp-mauve text-ctp-base shadow hover:bg-ctp-lavender hover:text-ctp-base",
        destructive: "bg-ctp-red text-ctp-base shadow-sm hover:bg-ctp-maroon hover:text-ctp-text",
        outline:
          "border border-ctp-surface1 bg-ctp-base shadow-sm hover:bg-ctp-surface0 hover:text-ctp-text hover:border-ctp-surface2",
        secondary: "bg-ctp-teal text-ctp-base shadow-sm hover:bg-ctp-sapphire hover:text-ctp-base",
        ghost: "hover:bg-ctp-surface0 hover:text-ctp-text",
        link: "text-ctp-mauve underline-offset-4 hover:underline hover:text-ctp-lavender",
        // New specialized variants for colored action buttons
        "outline-teal":
          "border border-ctp-teal/40 bg-ctp-teal/15 text-ctp-teal shadow-sm hover:bg-ctp-teal hover:text-ctp-base hover:border-ctp-teal",
        "outline-green":
          "border border-ctp-green/40 bg-ctp-green/15 text-ctp-green shadow-sm hover:bg-ctp-green hover:text-ctp-base hover:border-ctp-green",
        "outline-red":
          "border border-ctp-red/40 bg-ctp-red/15 text-ctp-red shadow-sm hover:bg-ctp-red hover:text-ctp-base hover:border-ctp-red",
        "outline-mauve":
          "border border-ctp-mauve/40 bg-ctp-mauve/15 text-ctp-mauve shadow-sm hover:bg-ctp-mauve hover:text-ctp-base hover:border-ctp-mauve",
        // Text-only hover variant (no background change)
        "ghost-text": "text-ctp-subtext0 hover:text-ctp-text",
        // Backwards-compatible aliases
        primary: "bg-ctp-mauve text-ctp-base shadow hover:bg-ctp-lavender hover:text-ctp-base",
        danger: "bg-ctp-red text-ctp-base shadow-sm hover:bg-ctp-maroon hover:text-ctp-text",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
        // Backwards-compatible alias
        md: "h-9 px-4 py-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
