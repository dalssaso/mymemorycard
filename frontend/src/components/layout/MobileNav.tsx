import { Link, useRouterState } from "@tanstack/react-router";
import { useGlobalSearch } from "@/components/GlobalSearch";
import { Button } from "@/components/ui";

export function MobileNav(): JSX.Element {
  const { openSearch } = useGlobalSearch();
  const locationHref = useRouterState({ select: (state) => state.location.href });

  const getNavLinkClass = (isActive: boolean) =>
    `flex flex-col items-center justify-center rounded-lg transition-colors ${
      isActive
        ? "text-ctp-mauve bg-ctp-mauve/10"
        : "text-ctp-subtext0 hover:text-ctp-text hover:bg-ctp-surface0"
    }`;

  return (
    <nav className="supports-[backdrop-filter]:bg-ctp-mantle/90 fixed bottom-0 left-0 right-0 z-50 h-[calc(var(--mobile-nav-height)+env(safe-area-inset-bottom))] border-t border-ctp-surface0 bg-ctp-mantle pb-[env(safe-area-inset-bottom)] supports-[backdrop-filter]:backdrop-blur md:hidden">
      <div className="grid h-[var(--mobile-nav-height)] grid-cols-5 gap-1 px-2">
        <Link to="/dashboard" className={getNavLinkClass(locationHref.includes("/dashboard"))}>
          <span className="text-xs">Home</span>
        </Link>

        <Link to="/library" className={getNavLinkClass(locationHref.includes("/library"))}>
          <span className="text-xs">Library</span>
        </Link>

        <Button
          type="button"
          variant="ghost"
          className="flex h-auto flex-col items-center justify-center rounded-lg text-ctp-subtext0 hover:bg-ctp-surface0 hover:text-ctp-text"
          aria-label="Open search"
          onClick={() => openSearch(document.activeElement)}
        >
          <span className="text-xs">Search</span>
        </Button>

        <Link to="/collections" className={getNavLinkClass(locationHref.includes("/collections"))}>
          <span className="text-xs">Collections</span>
        </Link>

        <Link to="/import" className={getNavLinkClass(locationHref.includes("/import"))}>
          <span className="text-xs">Import</span>
        </Link>
      </div>
    </nav>
  );
}
