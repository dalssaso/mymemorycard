import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useMemo } from "react";
import { useGlobalSearch } from "@/components/GlobalSearch";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";

export function Navbar(): JSX.Element {
  const { user, logout } = useAuth();
  const { openSearch } = useGlobalSearch();
  const navigate = useNavigate();
  const locationHref = useRouterState({ select: (state) => state.location.href });
  const { isCollapsed } = useSidebar();

  const navLinks = useMemo(
    () => [
      { to: "/dashboard", label: "Dashboard" },
      { to: "/library", label: "Library" },
      { to: "/collections", label: "Collections" },
      { to: "/franchises", label: "Franchises" },
      { to: "/ai-curator", label: "AI Curator" },
    ],
    []
  );

  return (
    <nav
      className={cn(
        "fixed left-0 top-0 z-50 h-16 w-full border-b border-surface bg-base transition-all duration-smooth",
        isCollapsed ? "md:ml-16 md:w-[calc(100%-4rem)]" : "md:ml-60 md:w-[calc(100%-15rem)]"
      )}
    >
      <div className="mx-auto flex h-full w-full max-w-[1560px] items-center gap-2 px-3 sm:gap-3 sm:px-6">
        <div className="flex min-w-0 flex-shrink items-center gap-2 sm:gap-4">
          <Link to="/dashboard" className="flex flex-shrink-0 items-center gap-2">
            <img src="/favicon.svg" alt="MyMemoryCard" className="h-8 w-8" />
            <span className="hidden text-lg font-semibold text-text-primary sm:inline">
              MyMemoryCard
            </span>
          </Link>
          <div className="hidden items-center gap-0.5 md:flex lg:gap-1">
            {navLinks.map((link) => {
              const isActive = locationHref.includes(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    "whitespace-nowrap rounded-lg px-2 py-1.5 text-xs transition-colors duration-standard md:text-sm lg:px-3 lg:py-2",
                    isActive
                      ? "bg-accent/10 text-accent"
                      : "text-text-muted hover:bg-surface hover:text-text-primary"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="ml-auto flex flex-shrink-0 items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="hidden w-48 justify-between lg:flex"
            onClick={() => openSearch(document.activeElement)}
          >
            <span className="truncate text-sm text-text-muted">Search...</span>
            <span className="rounded bg-elevated px-2 py-0.5 text-[10px] uppercase text-text-muted">
              Ctrl K
            </span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="lg:hidden"
            aria-label="Open search"
            onClick={() => openSearch(document.activeElement)}
          >
            <span className="text-sm">/</span>
          </Button>

          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-elevated bg-elevated">
                  <span className="text-sm font-medium text-text-primary">
                    {user?.username?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
                <span className="hidden text-sm text-text-muted xl:inline">{user?.username}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  logout();
                  navigate({ to: "/login" });
                }}
              >
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
