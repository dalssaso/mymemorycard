import { type HTMLAttributes } from "react";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "rectangular" | "circular";
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  variant = "rectangular",
  width,
  height,
  className = "",
  ...props
}: SkeletonProps) {
  const baseStyles = "animate-pulse bg-ctp-surface0/50";

  const variantStyles = {
    text: "h-4 rounded",
    rectangular: "rounded-lg",
    circular: "rounded-full",
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === "number" ? `${width}px` : width;
  if (height) style.height = typeof height === "number" ? `${height}px` : height;

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      style={style}
      {...props}
    />
  );
}

// Pre-built skeleton components for common use cases
export function GameCardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton variant="rectangular" className="aspect-[3/4] w-full" />
      <Skeleton variant="text" width="80%" />
      <Skeleton variant="text" width="60%" />
    </div>
  );
}

export function GameRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4">
      <Skeleton variant="rectangular" width={80} height={120} />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="40%" />
        <Skeleton variant="text" width="30%" />
      </div>
    </div>
  );
}
