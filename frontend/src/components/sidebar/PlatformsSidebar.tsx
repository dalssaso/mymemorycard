import { useSidebar } from "@/contexts/SidebarContext";
import { Button } from "@/components/ui";

interface PlatformsSidebarProps {
  platformCount: number;
  onAddCustomPlatform: () => void;
}

export function PlatformsSidebar({ platformCount, onAddCustomPlatform }: PlatformsSidebarProps) {
  const { isCollapsed } = useSidebar();

  if (isCollapsed) {
    return (
      <div className="space-y-3 border-t border-ctp-surface0 pt-3">
        <div className="flex justify-center">
          <div
            className="bg-ctp-surface0/50 flex h-10 w-10 items-center justify-center rounded-lg border border-ctp-surface0 text-sm text-ctp-teal"
            title="Platforms Saved"
          >
            {platformCount}
          </div>
        </div>
        <div className="flex justify-center border-t border-ctp-surface0 pt-2">
          <Button
            type="button"
            onClick={onAddCustomPlatform}
            variant="ghost"
            size="icon"
            className="rounded-lg p-2 text-ctp-teal transition-all hover:bg-ctp-surface0 hover:text-ctp-text"
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
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-ctp-surface0/40 rounded-lg border border-ctp-surface0 p-4">
        <h3 className="mb-1 text-sm font-semibold text-ctp-text">Manage Platforms</h3>
        <p className="text-xs text-ctp-subtext0">
          Keep your platform list current for accurate imports.
        </p>
        <div className="mt-3 text-sm text-ctp-teal">{platformCount} saved</div>
      </div>

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
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ctp-subtext0">
          Tips
        </h3>
        <div className="space-y-3 text-sm text-ctp-subtext0">
          <div className="bg-ctp-surface0/50 rounded-lg p-3">
            <p className="mb-1 font-medium text-ctp-subtext1">Add new platforms anytime</p>
            <p className="text-xs">
              Use the available list to add platforms as you expand your library.
            </p>
          </div>
          <div className="bg-ctp-surface0/50 rounded-lg p-3">
            <p className="mb-1 font-medium text-ctp-subtext1">Keep notes updated</p>
            <p className="text-xs">Add usernames or links to help you remember account details.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
