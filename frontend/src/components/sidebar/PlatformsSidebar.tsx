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
      <div className="border-surface space-y-3 border-t pt-3">
        <div className="flex justify-center">
          <div
            className="bg-surface/50 border-surface text-accent flex h-10 w-10 items-center justify-center rounded-lg border text-sm"
            title="Platforms Saved"
          >
            {platformCount}
          </div>
        </div>
        <div className="border-surface flex justify-center border-t pt-2">
          <Button
            type="button"
            onClick={onAddCustomPlatform}
            variant="ghost"
            size="icon"
            className="text-accent hover:bg-surface hover:text-text-primary rounded-lg p-2 transition-all"
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
      <div className="bg-surface/40 border-surface rounded-lg border p-4">
        <h3 className="text-text-primary mb-1 text-sm font-semibold">Manage Platforms</h3>
        <p className="text-text-secondary text-xs">
          Keep your platform list current for accurate imports.
        </p>
        <div className="text-accent mt-3 text-sm">{platformCount} saved</div>
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
        <h3 className="text-text-secondary mb-3 text-xs font-semibold uppercase tracking-wider">
          Tips
        </h3>
        <div className="text-text-secondary space-y-3 text-sm">
          <div className="bg-surface/50 rounded-lg p-3">
            <p className="text-text-muted mb-1 font-medium">Add new platforms anytime</p>
            <p className="text-xs">
              Use the available list to add platforms as you expand your library.
            </p>
          </div>
          <div className="bg-surface/50 rounded-lg p-3">
            <p className="text-text-muted mb-1 font-medium">Keep notes updated</p>
            <p className="text-xs">Add usernames or links to help you remember account details.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
