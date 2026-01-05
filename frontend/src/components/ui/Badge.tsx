import { type HTMLAttributes } from "react";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "status" | "platform" | "genre";
  status?: "backlog" | "playing" | "finished" | "dropped" | "completed";
}

export function Badge({
  variant = "default",
  status,
  className = "",
  children,
  ...props
}: BadgeProps): JSX.Element {
  const baseStyles = "inline-flex items-center px-2 py-1 rounded text-xs font-medium";

  let variantStyles = "";

  if (variant === "status" && status) {
    const statusStyles = {
      backlog: "bg-ctp-surface1/50 border border-ctp-surface2 text-ctp-subtext0",
      playing: "bg-ctp-teal/20 border border-ctp-teal rounded-lg text-ctp-teal",
      finished: "bg-ctp-green/20 border border-ctp-green rounded-lg text-ctp-green",
      dropped: "bg-ctp-red/20 border border-ctp-red rounded-lg text-ctp-red",
      completed: "bg-ctp-yellow/20 border border-ctp-yellow rounded-lg text-ctp-yellow",
    };
    variantStyles = statusStyles[status];
  } else if (variant === "platform") {
    variantStyles = "bg-ctp-mauve/20 border border-ctp-mauve rounded-lg text-ctp-mauve";
  } else if (variant === "genre") {
    variantStyles = "bg-ctp-teal/10 border border-ctp-teal/30 rounded text-ctp-teal";
  } else {
    variantStyles = "bg-ctp-surface0 text-ctp-subtext1";
  }

  return (
    <span className={`${baseStyles} ${variantStyles} ${className}`} {...props}>
      {children}
    </span>
  );
}
