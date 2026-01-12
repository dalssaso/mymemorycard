import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui";
import { useSidebar } from "@/contexts/SidebarContext";

interface GameDetailSidebarProps {
  gameId: string;
  platformId: string;
  status: string | null;
  onStatusChange: (status: string) => void;
  isUpdating?: boolean;
}

const STATUS_OPTIONS = [
  {
    value: "backlog",
    label: "Backlog",
    icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
  },
  {
    value: "playing",
    label: "Playing",
    icon: "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664zM21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  { value: "finished", label: "Finished", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
  {
    value: "completed",
    label: "Completed",
    icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z",
  },
  {
    value: "dropped",
    label: "Dropped",
    icon: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636",
  },
];

const SECTIONS = [
  {
    id: "about",
    label: "About",
    icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    id: "notes",
    label: "Notes",
    icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
  },
  {
    id: "stats",
    label: "My Stats",
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  },
  {
    id: "resources",
    label: "External Resources",
    icon: "M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14",
  },
  { id: "playtime", label: "Play Stats", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
];

export function GameDetailSidebar({ status, onStatusChange, isUpdating }: GameDetailSidebarProps) {
  const { isCollapsed } = useSidebar();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (isCollapsed) {
    return (
      <div className="space-y-3 border-t border-surface pt-3">
        {/* Back to Library */}
        <div className="flex justify-center">
          <Link
            to="/library"
            className="rounded-lg p-2 text-text-secondary transition-all hover:bg-surface hover:text-text-primary"
            title="Back to Library"
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

        {/* Quick Status Icons */}
        <div className="flex flex-col items-center gap-1 border-t border-surface pt-2">
          {STATUS_OPTIONS.map((option) => (
            <Button
              key={option.value}
              onClick={() => onStatusChange(option.value)}
              disabled={isUpdating}
              variant="ghost"
              size="icon"
              className={`rounded-lg p-2 transition-all disabled:opacity-50 ${
                status === option.value
                  ? "bg-accent/20 text-accent ring-2 ring-accent"
                  : "text-text-secondary hover:bg-surface hover:text-text-primary"
              }`}
              title={option.label}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={option.icon}
                />
              </svg>
            </Button>
          ))}
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
          to="/library"
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
          Back to Library
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
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Quick Status
        </h3>
        <div className="space-y-1">
          {STATUS_OPTIONS.map((option) => (
            <Button
              key={option.value}
              onClick={() => onStatusChange(option.value)}
              disabled={isUpdating}
              variant="ghost"
              className={`flex h-auto w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-all disabled:opacity-50 ${
                status === option.value
                  ? "bg-accent/20 border-accent/30 border text-accent"
                  : "text-text-secondary hover:bg-surface hover:text-text-primary"
              }`}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={option.icon}
                />
              </svg>
              {option.label}
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
