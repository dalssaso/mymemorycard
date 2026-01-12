import { type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>): JSX.Element {
  return <div className={cn("bg-accent/10 animate-pulse rounded-md", className)} {...props} />;
}

function GameCardSkeleton(): JSX.Element {
  return (
    <div className="bg-surface/40 rounded-xl border border-border p-4">
      <Skeleton className="h-40 w-full rounded-lg" />
      <div className="mt-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-4 w-10" />
        </div>
      </div>
    </div>
  );
}

function GameRowSkeleton(): JSX.Element {
  return (
    <div className="bg-surface/40 flex items-center gap-4 rounded-lg border border-border p-4">
      <Skeleton className="h-16 w-12 rounded-md" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="h-6 w-16" />
    </div>
  );
}

function SkeletonCard(): JSX.Element {
  return <GameCardSkeleton />;
}

function SkeletonTable(): JSX.Element {
  return <GameRowSkeleton />;
}

export { Skeleton, GameCardSkeleton, GameRowSkeleton, SkeletonCard, SkeletonTable };
