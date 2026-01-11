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
      backlog: "bg-status-backlog/20 border border-status-backlog/50 text-status-backlog",
      playing: "bg-status-playing/20 border border-status-playing rounded-lg text-status-playing",
      finished:
        "bg-status-finished/20 border border-status-finished rounded-lg text-status-finished",
      dropped: "bg-status-dropped/20 border border-status-dropped rounded-lg text-status-dropped",
      completed:
        "bg-status-completed/20 border border-status-completed rounded-lg text-status-completed",
    };
    variantStyles = statusStyles[status];
  } else if (variant === "platform") {
    variantStyles = "bg-accent/20 border border-accent rounded-lg text-accent";
  } else if (variant === "genre") {
    variantStyles =
      "bg-status-playing/10 border border-status-playing/30 rounded text-status-playing";
  } else {
    variantStyles = "bg-surface text-text-secondary";
  }

  return (
    <span className={`${baseStyles} ${variantStyles} ${className}`} {...props}>
      {children}
    </span>
  );
}
