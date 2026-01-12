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
      <div className="space-y-3 border-t border-surface pt-3">
        <div className="flex justify-center">
          <div
            className="bg-surface/50 flex h-10 w-10 items-center justify-center rounded-lg border border-surface text-sm text-accent"
            title="Platforms Saved"
          >
            {platformCount}
          </div>
        </div>
        <div className="flex justify-center border-t border-surface pt-2">
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
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-surface/40 rounded-lg border border-surface p-4">
        <h3 className="mb-1 text-sm font-semibold text-text-primary">Manage Platforms</h3>
        <p className="text-xs text-text-secondary">
          Keep your platform list current for accurate imports.
        </p>
        <div className="mt-3 text-sm text-accent">{platformCount} saved</div>
      </div>

      <Button
        type="button"
        onClick={onAddCustomPlatform}
        variant="ghost"
        className={[
          "flex w-full items-center justify-center gap-2 px-4 py-2.5",
          "bg-accent/20 hover:bg-accent/30 text-accent",
          "rounded-lg font-medium transition-colors",
        ].join(" ")}
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Custom Platform
      </Button>

      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-secondary">
          Tips
        </h3>
        <div className="space-y-3 text-sm text-text-secondary">
          <div className="bg-surface/50 rounded-lg p-3">
            <p className="mb-1 font-medium text-text-muted">Add new platforms anytime</p>
            <p className="text-xs">
              Use the available list to add platforms as you expand your library.
            </p>
          </div>
          <div className="bg-surface/50 rounded-lg p-3">
            <p className="mb-1 font-medium text-text-muted">Keep notes updated</p>
            <p className="text-xs">Add usernames or links to help you remember account details.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
