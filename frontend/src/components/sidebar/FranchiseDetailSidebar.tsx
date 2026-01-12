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
      <div className="border-surface space-y-3 border-t pt-3">
        {/* Back to Franchises */}
        <div className="flex justify-center">
          <Link
            to="/franchises"
            className="text-text-secondary hover:bg-surface hover:text-text-primary rounded-lg p-2 transition-all"
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

        <div className="border-surface flex justify-center border-t pt-2">
          <Link
            to="/platforms"
            className="text-text-secondary hover:bg-surface hover:text-text-primary rounded-lg p-2 transition-all"
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
        <div className="border-surface flex flex-col items-center gap-1 border-t pt-2">
          {SECTIONS.map((section) => (
            <Button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              variant="ghost"
              size="icon"
              className="text-text-secondary hover:bg-surface hover:text-text-primary rounded-lg p-2 transition-all"
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
          className="border-elevated bg-surface text-text-muted hover:border-elevated hover:text-text-primary flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors"
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
        className="bg-surface text-text-primary hover:bg-elevated flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-medium transition-colors"
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
        <h3 className="text-text-secondary mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
          <svg
            className="text-accent h-4 w-4"
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
            <div className="text-text-secondary mb-1 text-xs">Series</div>
            <div className="text-text-primary truncate text-sm font-medium" title={seriesName}>
              {seriesName}
            </div>
          </div>
          <div className="bg-surface/50 rounded-lg p-3">
            <div className="text-text-secondary mb-1 text-xs">Owned</div>
            <div className="text-text-primary text-sm font-medium">
              {ownedCount} {ownedCount === 1 ? "game" : "games"}
            </div>
          </div>
          {missingCount > 0 && (
            <div className="bg-surface/50 rounded-lg p-3">
              <div className="text-text-secondary mb-1 text-xs">Missing</div>
              <div className="text-text-primary text-sm font-medium">
                {missingCount} {missingCount === 1 ? "game" : "games"}
              </div>
            </div>
          )}
          <div className="bg-surface/50 rounded-lg p-3">
            <div className="text-text-secondary mb-1 text-xs">Completion</div>
            <div className="text-text-primary text-sm font-medium">{completionPercentage}%</div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-text-secondary mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
          <svg
            className="text-accent h-4 w-4"
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
              className="text-text-secondary hover:bg-surface hover:text-text-primary flex h-auto w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-all"
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
