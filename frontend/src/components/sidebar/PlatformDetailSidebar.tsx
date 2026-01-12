import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui";
import { useSidebar } from "@/contexts/SidebarContext";

interface PlatformDetailSidebarProps {
  platformName: string;
  platformType: string | null;
  username: string | null;
}

const PROFILE_ICON = "M15.75 6a3 3 0 11-6 0 3 3 0 016 0zM4.5 20.25a7.5 7.5 0 0115 0";
const NOTES_ICON = "M4 6h16M4 12h16m-7 6h7";
const BACK_ICON = "M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18";
const INFO_ICON = [
  "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2",
  " 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2",
  " 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
].join("");

const SECTIONS = [
  { id: "profile", label: "Profile", icon: PROFILE_ICON },
  { id: "notes", label: "Notes", icon: NOTES_ICON },
];

export function PlatformDetailSidebar({
  platformName,
  platformType,
  username,
}: PlatformDetailSidebarProps) {
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
        <div className="flex justify-center">
          <Link
            to="/platforms"
            className={[
              "rounded-lg p-2 text-text-secondary hover:bg-surface",
              "transition-all hover:text-text-primary",
            ].join(" ")}
            title="Back to Platforms"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={BACK_ICON} />
            </svg>
          </Link>
        </div>

        <div className="flex justify-center border-t border-surface pt-2">
          <Link
            to="/platforms"
            className={[
              "rounded-lg p-2 text-text-secondary hover:bg-surface",
              "transition-all hover:text-text-primary",
            ].join(" ")}
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
          {SECTIONS.map((section) => (
            <Button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              variant="ghost"
              size="icon"
              className={[
                "rounded-lg p-2 text-text-secondary hover:bg-surface",
                "transition-all hover:text-text-primary",
              ].join(" ")}
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
          to="/platforms"
          className={[
            "flex items-center gap-2 border border-elevated bg-surface px-3 py-2",
            "rounded-lg text-text-muted hover:border-elevated hover:text-text-primary",
            "text-sm transition-colors",
          ].join(" ")}
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
          Back to Platforms
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
        <h3
          className={[
            "text-xs font-semibold uppercase tracking-wider text-text-secondary",
            "mb-3 flex items-center gap-2",
          ].join(" ")}
        >
          <svg
            className="h-4 w-4 text-accent"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={INFO_ICON} />
          </svg>
          Platform Info
        </h3>
        <div className="space-y-2">
          <div className="bg-surface/50 rounded-lg p-3">
            <div className="mb-1 text-xs text-text-secondary">Name</div>
            <div className="truncate text-sm font-medium text-text-primary" title={platformName}>
              {platformName}
            </div>
          </div>
          <div className="bg-surface/50 rounded-lg p-3">
            <div className="mb-1 text-xs text-text-secondary">Type</div>
            <div className="text-sm font-medium text-text-primary">
              {platformType || "platform"}
            </div>
          </div>
          <div className="bg-surface/50 rounded-lg p-3">
            <div className="mb-1 text-xs text-text-secondary">Username</div>
            <div className="truncate text-sm font-medium text-text-primary">
              {username || "Not set"}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3
          className={[
            "text-xs font-semibold uppercase tracking-wider text-text-secondary",
            "mb-3 flex items-center gap-2",
          ].join(" ")}
        >
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
              className={[
                "w-full rounded-lg px-3 py-2 text-left text-sm text-text-secondary",
                "flex items-center gap-2 transition-all hover:bg-surface hover:text-text-primary",
              ].join(" ")}
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
