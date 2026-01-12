import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui";
import { useSidebar } from "@/contexts/SidebarContext";

interface FranchiseDetailSidebarProps {
  seriesName: string;
  ownedCount: number;
  missingCount: number;
}

const SECTIONS = [
  {
    id: "owned-games",
    label: "Your Games",
    icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
  },
  { id: "missing-games", label: "Missing Games", icon: "M12 4v16m8-8H4" },
];

export function FranchiseDetailSidebar({
  seriesName,
  ownedCount,
  missingCount,
}: FranchiseDetailSidebarProps) {
  const { isCollapsed } = useSidebar();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const totalGames = ownedCount + missingCount;
  const completionPercentage = totalGames > 0 ? Math.round((ownedCount / totalGames) * 100) : 0;

  if (isCollapsed) {
    return (
      <div className="space-y-3 border-t border-surface pt-3">
        {/* Back to Franchises */}
        <div className="flex justify-center">
          <Link
            to="/franchises"
            className="rounded-lg p-2 text-text-secondary transition-all hover:bg-surface hover:text-text-primary"
            title="Back to Franchises"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
          </Link>
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

        {/* Jump to Section Icons */}
        <div className="flex flex-col items-center gap-1 border-t border-surface pt-2">
          {SECTIONS.map((section) => (
            <Button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              variant="ghost"
              size="icon"
              className="rounded-lg p-2 text-text-secondary transition-all hover:bg-surface hover:text-text-primary"
              title={section.label}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={section.icon}
                />
              </svg>
            </Button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/franchises"
          className="flex items-center gap-2 rounded-lg border border-elevated bg-surface px-3 py-2 text-sm text-text-muted transition-colors hover:border-elevated hover:text-text-primary"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-4 w-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
            />
          </svg>
          Back to Franchises
        </Link>
      </div>
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
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          Franchise Info
        </h3>
        <div className="space-y-2">
          <div className="bg-surface/50 rounded-lg p-3">
            <div className="mb-1 text-xs text-text-secondary">Series</div>
            <div className="truncate text-sm font-medium text-text-primary" title={seriesName}>
              {seriesName}
            </div>
          </div>
          <div className="bg-surface/50 rounded-lg p-3">
            <div className="mb-1 text-xs text-text-secondary">Owned</div>
            <div className="text-sm font-medium text-text-primary">
              {ownedCount} {ownedCount === 1 ? "game" : "games"}
            </div>
          </div>
          {missingCount > 0 && (
            <div className="bg-surface/50 rounded-lg p-3">
              <div className="mb-1 text-xs text-text-secondary">Missing</div>
              <div className="text-sm font-medium text-text-primary">
                {missingCount} {missingCount === 1 ? "game" : "games"}
              </div>
            </div>
          )}
          <div className="bg-surface/50 rounded-lg p-3">
            <div className="mb-1 text-xs text-text-secondary">Completion</div>
            <div className="text-sm font-medium text-text-primary">{completionPercentage}%</div>
          </div>
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
              d="M13 5l7 7-7 7M5 5l7 7-7 7"
            />
          </svg>
          Jump to Section
        </h3>
        <div className="space-y-1">
          {SECTIONS.map((section) => (
            <Button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              variant="ghost"
              className="flex h-auto w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-text-secondary transition-all hover:bg-surface hover:text-text-primary"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={section.icon}
                />
              </svg>
              {section.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
