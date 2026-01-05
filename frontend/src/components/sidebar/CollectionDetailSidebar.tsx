import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui";
import { useSidebar } from "@/contexts/SidebarContext";

interface CollectionDetailSidebarProps {
  collectionId: string;
  collectionName: string;
  gameCount: number;
  isUpdating?: boolean;
}

const SECTIONS = [
  { id: "description", label: "Description", icon: "M4 6h16M4 12h16m-7 6h7" },
  {
    id: "games",
    label: "Games",
    icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
  },
];

export function CollectionDetailSidebar({
  collectionName,
  gameCount,
}: CollectionDetailSidebarProps) {
  const { isCollapsed } = useSidebar();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (isCollapsed) {
    return (
      <div className="space-y-3 border-t border-ctp-surface0 pt-3">
        {/* Back to Collections */}
        <div className="flex justify-center">
          <Link
            to="/collections"
            className="rounded-lg p-2 text-ctp-subtext0 transition-all hover:bg-ctp-surface0 hover:text-ctp-text"
            title="Back to Collections"
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

        <div className="flex justify-center border-t border-ctp-surface0 pt-2">
          <Link
            to="/platforms"
            className="rounded-lg p-2 text-ctp-subtext0 transition-all hover:bg-ctp-surface0 hover:text-ctp-text"
            title="Manage Platforms"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 7h16M4 12h16M4 17h16"
              />
            </svg>
          </Link>
        </div>

        {/* Jump to Section Icons */}
        <div className="flex flex-col items-center gap-1 border-t border-ctp-surface0 pt-2">
          {SECTIONS.map((section) => (
            <Button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              variant="ghost"
              size="icon"
              className="rounded-lg p-2 text-ctp-subtext0 transition-all hover:bg-ctp-surface0 hover:text-ctp-text"
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
          to="/collections"
          className="flex items-center gap-2 rounded-lg border border-ctp-surface1 bg-ctp-surface0 px-3 py-2 text-sm text-ctp-subtext1 transition-colors hover:border-ctp-surface2 hover:text-ctp-text"
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
          Back to Collections
        </Link>
      </div>
      <Link
        to="/platforms"
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-ctp-surface0 px-4 py-2.5 font-medium text-ctp-text transition-colors hover:bg-ctp-surface1"
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
        <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ctp-subtext0">
          <svg
            className="h-4 w-4 text-ctp-teal"
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
          Collection Info
        </h3>
        <div className="space-y-2">
          <div className="bg-ctp-surface0/50 rounded-lg p-3">
            <div className="mb-1 text-xs text-ctp-subtext0">Name</div>
            <div className="truncate text-sm font-medium text-ctp-text" title={collectionName}>
              {collectionName}
            </div>
          </div>
          <div className="bg-ctp-surface0/50 rounded-lg p-3">
            <div className="mb-1 text-xs text-ctp-subtext0">Games</div>
            <div className="text-sm font-medium text-ctp-text">
              {gameCount} {gameCount === 1 ? "game" : "games"}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ctp-subtext0">
          <svg
            className="h-4 w-4 text-ctp-mauve"
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
              className="flex h-auto w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ctp-subtext0 transition-all hover:bg-ctp-surface0 hover:text-ctp-text"
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
