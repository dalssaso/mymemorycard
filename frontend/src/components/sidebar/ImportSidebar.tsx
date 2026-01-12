import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui";
import { useSidebar } from "@/contexts/SidebarContext";

interface Platform {
  id: string;
  name: string;
  display_name: string;
}

interface ImportSidebarProps {
  platforms: Platform[];
  selectedPlatform: string;
  onPlatformSelect: (platformId: string) => void;
  isImporting?: boolean;
}

export function ImportSidebar({
  platforms,
  selectedPlatform,
  onPlatformSelect,
  isImporting,
}: ImportSidebarProps) {
  const { isCollapsed } = useSidebar();

  if (isCollapsed) {
    return (
      <div className="space-y-3 border-t border-surface pt-3">
        <div className="flex justify-center">
          <Link
            to="/platforms"
            className="rounded-lg p-2 text-text-secondary transition-colors duration-standard hover:bg-surface hover:text-text-primary"
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
          {platforms.map((platform) => (
            <Button
              key={platform.id}
              onClick={() => onPlatformSelect(platform.id)}
              disabled={isImporting}
              variant="ghost"
              size="icon"
              className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-semibold transition-all disabled:opacity-50 ${
                selectedPlatform === platform.id
                  ? "bg-accent/20 text-accent ring-2 ring-accent"
                  : "text-text-secondary hover:bg-surface hover:text-text-primary"
              }`}
              title={platform.display_name}
            >
              {platform.display_name.trim().charAt(0).toUpperCase() || "?"}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to="/platforms"
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-surface px-4 py-2.5 font-medium text-text-primary transition-colors hover:bg-elevated"
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

      <div>
        <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
          <svg
            className="h-4 w-4 text-accent"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          Quick Platform Select
        </h3>
        <div className="space-y-1">
          {platforms.map((platform) => (
            <Button
              key={platform.id}
              onClick={() => onPlatformSelect(platform.id)}
              disabled={isImporting}
              variant="ghost"
              className={`h-auto w-full rounded-lg px-3 py-2 text-left text-sm transition-all disabled:opacity-50 ${
                selectedPlatform === platform.id
                  ? "bg-accent/20 border-accent/30 border text-accent"
                  : "text-text-secondary hover:bg-surface hover:text-text-primary"
              }`}
            >
              {platform.display_name}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
          <svg
            className="h-4 w-4 text-accent"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Import Tips
        </h3>
        <div className="space-y-3 text-sm text-text-secondary">
          <div className="bg-surface/50 rounded-lg p-3">
            <p className="mb-1 font-medium text-text-muted">One game per line</p>
            <p className="text-xs">Enter each game name on its own line for best results.</p>
          </div>
          <div className="bg-surface/50 rounded-lg p-3">
            <p className="mb-1 font-medium text-text-muted">Use official names</p>
            <p className="text-xs">
              &quot;The Witcher 3: Wild Hunt&quot; works better than &quot;Witcher 3&quot;.
            </p>
          </div>
          <div className="bg-surface/50 rounded-lg p-3">
            <p className="mb-1 font-medium text-text-muted">Review matches</p>
            <p className="text-xs">
              If a game isn&apos;t matched exactly, you&apos;ll be able to pick from candidates.
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
          <svg
            className="h-4 w-4 text-status-finished"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
            />
          </svg>
          Data Source
        </h3>
        <div className="bg-surface/50 rounded-lg p-3">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-accent text-base">
              <span className="text-xs font-bold">R</span>
            </div>
            <span className="text-sm text-text-muted">RAWG.io</span>
          </div>
          <p className="text-xs text-text-muted">
            Games are enriched with metadata from RAWG including cover art, descriptions, ratings,
            and release dates.
          </p>
        </div>
      </div>
    </div>
  );
}
