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
      <div className="border-surface space-y-3 border-t pt-3">
        <div className="flex justify-center">
          <Link
            to="/platforms"
            className={[
              "text-text-secondary hover:bg-surface rounded-lg p-2",
              "hover:text-text-primary transition-all",
            ].join(" ")}
            title="Back to Platforms"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={BACK_ICON} />
            </svg>
          </Link>
        </div>

        <div className="border-surface flex justify-center border-t pt-2">
          <Link
            to="/platforms"
            className={[
              "text-text-secondary hover:bg-surface rounded-lg p-2",
              "hover:text-text-primary transition-all",
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

        <div className="border-surface flex flex-col items-center gap-1 border-t pt-2">
          {SECTIONS.map((section) => (
            <Button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              variant="ghost"
              size="icon"
              className={[
                "text-text-secondary hover:bg-surface rounded-lg p-2",
                "hover:text-text-primary transition-all",
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
            "border-elevated bg-surface flex items-center gap-2 border px-3 py-2",
            "text-text-muted hover:border-elevated hover:text-text-primary rounded-lg",
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
        <h3
          className={[
            "text-text-secondary text-xs font-semibold uppercase tracking-wider",
            "mb-3 flex items-center gap-2",
          ].join(" ")}
        >
          <svg
            className="text-accent h-4 w-4"
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
            <div className="text-text-secondary mb-1 text-xs">Name</div>
            <div className="text-text-primary truncate text-sm font-medium" title={platformName}>
              {platformName}
            </div>
          </div>
          <div className="bg-surface/50 rounded-lg p-3">
            <div className="text-text-secondary mb-1 text-xs">Type</div>
            <div className="text-text-primary text-sm font-medium">{platformType || "platform"}</div>
          </div>
          <div className="bg-surface/50 rounded-lg p-3">
            <div className="text-text-secondary mb-1 text-xs">Username</div>
            <div className="text-text-primary truncate text-sm font-medium">
              {username || "Not set"}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3
          className={[
            "text-text-secondary text-xs font-semibold uppercase tracking-wider",
            "mb-3 flex items-center gap-2",
          ].join(" ")}
        >
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
              className={[
                "text-text-secondary w-full rounded-lg px-3 py-2 text-left text-sm",
                "hover:bg-surface hover:text-text-primary flex items-center gap-2 transition-all",
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
