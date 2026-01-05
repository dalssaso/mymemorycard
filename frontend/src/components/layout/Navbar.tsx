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

export function Navbar(): JSX.Element {
  const { user, logout } = useAuth();
  const { openSearch } = useGlobalSearch();
  const navigate = useNavigate();
  const locationHref = useRouterState({ select: (state) => state.location.href });

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
    <nav className="fixed left-0 top-0 z-50 h-16 w-full border-b border-ctp-surface0 bg-ctp-mantle">
      <div className="mx-auto flex h-full w-full max-w-[1400px] items-center justify-between gap-3 px-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <Link to="/" className="flex items-center gap-2">
            <img src="/favicon.svg" alt="MyMemoryCard" className="h-8 w-8" />
            <span className="hidden text-lg font-semibold text-ctp-text sm:inline">
              MyMemoryCard
            </span>
          </Link>
          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => {
              const isActive = locationHref.includes(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-ctp-mauve/10 text-ctp-mauve"
                      : "text-ctp-subtext1 hover:bg-ctp-surface0 hover:text-ctp-text"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="hidden w-48 justify-between md:flex"
            onClick={() => openSearch(document.activeElement)}
          >
            <span className="truncate text-sm text-ctp-subtext1">Search...</span>
            <span className="rounded bg-ctp-surface1 px-2 py-0.5 text-[10px] uppercase text-ctp-subtext1">
              Ctrl K
            </span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="md:hidden"
            aria-label="Open search"
            onClick={() => openSearch(document.activeElement)}
          >
            <span className="text-sm">/</span>
          </Button>

          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-ctp-surface2 bg-ctp-surface1">
                  <span className="text-sm font-medium text-ctp-text">
                    {user?.username?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
                <span className="hidden text-sm text-ctp-subtext1 md:inline">{user?.username}</span>
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
