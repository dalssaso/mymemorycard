import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui";
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
      <div className="border-ctp-surface0 space-y-3 border-t pt-3">
        <div className="flex justify-center">
          <div
            className="bg-ctp-surface0/50 border-ctp-surface0 text-ctp-teal flex h-10 w-10 items-center justify-center rounded-lg border text-sm"
            title="Platforms Selected"
          >
            {selectedCount}
          </div>
        </div>

        <div className="border-ctp-surface0 flex justify-center border-t pt-2">
          <Link
            to="/platforms"
            className="text-ctp-subtext0 hover:bg-ctp-surface0 hover:text-ctp-text rounded-lg p-2 transition-all"
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

        <div className="border-ctp-surface0 flex flex-col items-center gap-1 border-t pt-2">
          <Button
            type="button"
            onClick={onAddCustomPlatform}
            variant="ghost"
            size="icon"
            className="text-ctp-teal hover:bg-ctp-surface0 hover:text-ctp-text rounded-lg p-2 transition-all"
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
            className="text-ctp-mauve hover:bg-ctp-surface0 hover:text-ctp-text rounded-lg p-2 transition-all"
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
      <div className="bg-ctp-surface0/40 border-ctp-surface0 rounded-lg border p-4">
        <h3 className="text-ctp-text mb-1 text-sm font-semibold">Platform Setup</h3>
        <p className="text-ctp-subtext0 text-xs">
          Choose the platforms you use before importing games.
        </p>
        <div className="text-ctp-teal mt-3 text-sm">{selectedCount} selected</div>
      </div>

      <Link
        to="/platforms"
        className={[
          "flex w-full items-center justify-center gap-2 px-4 py-2.5",
          "bg-ctp-surface0 text-ctp-text hover:bg-ctp-surface1",
          "rounded-lg font-medium transition-colors",
        ].join(" ")}
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
        className={[
          "flex w-full items-center justify-center gap-2 px-4 py-2.5",
          "bg-ctp-teal/20 hover:bg-ctp-teal/30 text-ctp-teal",
          "rounded-lg font-medium transition-colors",
        ].join(" ")}
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Custom Platform
      </Button>

      <div>
        <h3 className="text-ctp-subtext0 mb-3 text-xs font-semibold uppercase tracking-wider">
          Steps
        </h3>
        <div className="text-ctp-subtext0 space-y-3 text-sm">
          <div className="bg-ctp-surface0/50 rounded-lg p-3">
            <p className="text-ctp-subtext1 mb-1 font-medium">1. Pick platforms</p>
            <p className="text-xs">Select the stores or systems you use.</p>
          </div>
          <div className="bg-ctp-surface0/50 rounded-lg p-3">
            <p className="text-ctp-subtext1 mb-1 font-medium">2. Save selection</p>
            <p className="text-xs">You can add more platforms later.</p>
          </div>
          <div className="bg-ctp-surface0/50 rounded-lg p-3">
            <p className="text-ctp-subtext1 mb-1 font-medium">3. Import games</p>
            <p className="text-xs">Head to import and bring in your library.</p>
          </div>
        </div>
      </div>

      <Link
        to="/import"
        className={[
          "flex w-full items-center justify-center gap-2 px-4 py-2.5",
          "hover:bg-ctp-mauve/80 bg-ctp-mauve text-ctp-base",
          "rounded-lg font-medium transition-colors",
        ].join(" ")}
      >
        Go to Import
      </Link>
    </div>
  );
}
