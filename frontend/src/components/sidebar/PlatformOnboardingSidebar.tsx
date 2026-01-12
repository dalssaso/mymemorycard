import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/contexts/SidebarContext";

interface PlatformOnboardingSidebarProps {
  selectedCount: number;
  onAddCustomPlatform: () => void;
}

export function PlatformOnboardingSidebar({
  selectedCount,
  onAddCustomPlatform,
}: PlatformOnboardingSidebarProps) {
  const { isCollapsed } = useSidebar();

  if (isCollapsed) {
    return (
      <div className="space-y-3 border-t border-surface pt-3">
        <div className="flex justify-center">
          <div
            className="bg-surface/50 flex h-10 w-10 items-center justify-center rounded-lg border border-surface text-sm text-accent"
            title="Platforms Selected"
          >
            {selectedCount}
          </div>
        </div>

        <div className="flex justify-center border-t border-surface pt-2">
          <Link
            to="/platforms"
            className="rounded-lg p-2 text-text-secondary transition-all hover:bg-surface hover:text-text-primary"
            title="Manage Platforms"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 4h6a2 2 0 012 2v2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2v2a2 2 0 01-2 2H9a2 2 0 01-2-2v-2H5a2 2 0 01-2-2v-4a2 2 0 012-2h2V6a2 2 0 012-2z"
              />
            </svg>
          </Link>
        </div>

        <div className="flex flex-col items-center gap-1 border-t border-surface pt-2">
          <Button
            type="button"
            onClick={onAddCustomPlatform}
            variant="ghost"
            size="icon"
            className="rounded-lg p-2 text-accent transition-all hover:bg-surface hover:text-text-primary"
            title="Add Custom Platform"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </Button>
          <Link
            to="/import"
            className="rounded-lg p-2 text-accent transition-all hover:bg-surface hover:text-text-primary"
            title="Go to Import"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-surface/40 rounded-lg border border-surface p-4">
        <h3 className="mb-1 text-sm font-semibold text-text-primary">Platform Setup</h3>
        <p className="text-xs text-text-secondary">
          Choose the platforms you use before importing games.
        </p>
        <div className="mt-3 text-sm text-accent">{selectedCount} selected</div>
      </div>

      <Link
        to="/platforms"
        className={cn(
          "flex w-full items-center justify-center gap-2 px-4 py-2.5",
          "bg-surface text-text-primary hover:bg-elevated",
          "rounded-lg font-medium transition-colors duration-standard"
        )}
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 4h6a2 2 0 012 2v2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2v2a2 2 0 01-2 2H9a2 2 0 01-2-2v-2H5a2 2 0 01-2-2v-4a2 2 0 012-2h2V6a2 2 0 012-2z"
          />
        </svg>
        Manage Platforms
      </Link>

      <Button
        type="button"
        onClick={onAddCustomPlatform}
        variant="ghost"
        className={cn(
          "flex w-full items-center justify-center gap-2 px-4 py-2.5",
          "bg-accent/20 hover:bg-accent/30 text-accent",
          "rounded-lg font-medium transition-colors duration-standard"
        )}
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Custom Platform
      </Button>

      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-secondary">
          Steps
        </h3>
        <div className="space-y-3 text-sm text-text-secondary">
          <div className="bg-surface/50 rounded-lg p-3">
            <p className="mb-1 font-medium text-text-muted">1. Pick platforms</p>
            <p className="text-xs">Select the stores or systems you use.</p>
          </div>
          <div className="bg-surface/50 rounded-lg p-3">
            <p className="mb-1 font-medium text-text-muted">2. Save selection</p>
            <p className="text-xs">You can add more platforms later.</p>
          </div>
          <div className="bg-surface/50 rounded-lg p-3">
            <p className="mb-1 font-medium text-text-muted">3. Import games</p>
            <p className="text-xs">Head to import and bring in your library.</p>
          </div>
        </div>
      </div>

      <Link
        to="/import"
        className={cn(
          "flex w-full items-center justify-center gap-2 px-4 py-2.5",
          "hover:bg-accent/80 bg-accent text-text-primary",
          "rounded-lg font-medium transition-colors duration-standard"
        )}
      >
        Go to Import
      </Link>
    </div>
  );
}
