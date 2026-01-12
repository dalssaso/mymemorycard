import { type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSidebar } from "@/contexts/SidebarContext";
import { Button, ScrollFade } from "@/components/ui";
import { Link } from "@tanstack/react-router";
import { useCollections } from "@/hooks/useCollections";
import { useFranchises } from "@/hooks/useFranchises";
import { useGameSummaries } from "@/hooks/useGameSummaries";
import { BackButton } from "./BackButton";

const quickStatStyles = {
  total: {
    backgroundColor: "color-mix(in srgb, var(--accent) 35%, transparent)",
  },
  playing: {
    backgroundColor: "color-mix(in srgb, var(--accent) 35%, transparent)",
  },
  completed: {
    backgroundColor: "color-mix(in srgb, var(--status-finished) 35%, transparent)",
  },
  favorites: {
    backgroundColor: "color-mix(in srgb, var(--status-dropped) 35%, transparent)",
  },
};

export interface SidebarProps {
  children?: ReactNode;
  customCollapsed?: boolean;
  showBackButton?: boolean;
}

export function Sidebar({
  children,
  customCollapsed = false,
  showBackButton = true,
}: SidebarProps) {
  const { user } = useAuth();
  const { isCollapsed, toggleSidebar } = useSidebar();

  const { data } = useGameSummaries();
  const { data: collectionsData } = useCollections();
  const { data: franchisesData } = useFranchises();

  const games = data?.games || [];
  const totalGames = games.length;
  const playingGames = games.filter((g) => g.status === "playing").length;
  const completedGames = games.filter(
    (g) => g.status === "completed" || g.status === "finished"
  ).length;
  const favoriteGames = games.filter((g) => g.is_favorite === true).length;
  const collections = collectionsData?.collections || [];
  const franchises = franchisesData?.franchises || [];

  return (
    <>
      {/* Collapse Toggle Button - positioned outside sidebar to avoid overflow clipping */}
      <Button
        onClick={toggleSidebar}
        variant="ghost"
        size="icon"
        className={`border-elevated bg-surface hover:border-elevated hover:bg-elevated fixed top-[4.5rem] z-20 hidden h-6 w-6 items-center justify-center rounded-full border transition-all duration-300 md:flex ${
          isCollapsed ? "left-[52px]" : "left-[228px]"
        }`}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <svg
          className={`text-text-secondary h-3 w-3 transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </Button>

      <aside
        className={`border-surface bg-base fixed bottom-0 left-0 top-0 hidden border-r transition-all duration-300 md:block ${
          isCollapsed ? "w-16" : "w-60"
        }`}
      >
        <ScrollFade axis="y" className="h-full overflow-y-auto">
          {/* Collapsed View - Icons Only */}
          {isCollapsed && (
            <div className="p-2 pt-[4.5rem]">
              {showBackButton && (
                <div className="border-surface mb-4 flex justify-center border-b pb-3">
                  <BackButton
                    iconOnly={true}
                    className="text-text-secondary hover:bg-surface hover:text-text-primary rounded-lg p-2 transition-all"
                  />
                </div>
              )}
              {/* User Avatar */}
              <div className="border-surface mb-4 flex justify-center border-b pb-3">
                <div
                  className="border-elevated bg-elevated flex h-8 w-8 items-center justify-center rounded-full border"
                  title={user?.username}
                >
                  <span className="text-text-primary text-sm font-medium">
                    {user?.username?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
              </div>

              {/* Context-Sensitive Content - replaces default content when provided and customCollapsed is true */}
              {children && customCollapsed ? (
                <div className="space-y-4">{children}</div>
              ) : (
                <>
                  {/* Quick Stats Icons */}
                  <div className="mb-4 space-y-3">
                    <Link
                      to="/library"
                      className="flex flex-col items-center gap-1 rounded-lg p-1 transition hover:brightness-110"
                      style={quickStatStyles.total}
                      title="Total Games"
                    >
                      <svg
                        className="text-accent h-5 w-5"
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
                      <span className="text-text-primary text-xs font-semibold">{totalGames}</span>
                    </Link>
                    <Link
                      to="/library"
                      search={{ status: "playing" }}
                      className="flex flex-col items-center gap-1 rounded-lg p-1 transition hover:brightness-110"
                      style={quickStatStyles.playing}
                      title="Playing"
                    >
                      <svg
                        className="text-accent h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="text-text-primary text-xs font-semibold">{playingGames}</span>
                    </Link>
                    <Link
                      to="/library"
                      search={{ status: "completed" }}
                      className="flex flex-col items-center gap-1 rounded-lg p-1 transition hover:brightness-110"
                      style={quickStatStyles.completed}
                      title="Completed"
                    >
                      <svg
                        className="text-status-finished h-5 w-5"
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
                      <span className="text-text-primary text-xs font-semibold">{completedGames}</span>
                    </Link>
                    <Link
                      to="/library"
                      search={{ favorites: true }}
                      className="flex flex-col items-center gap-1 rounded-lg p-1 transition hover:brightness-110"
                      style={quickStatStyles.favorites}
                      title="Favorites"
                    >
                      <svg className="text-status-dropped h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                      <span className="text-text-primary text-xs font-semibold">{favoriteGames}</span>
                    </Link>
                  </div>

                  {/* Collections Icon */}
                  {collections.length > 0 && (
                    <div className="border-surface mb-4 border-t pt-3">
                      <Link
                        to="/collections"
                        className="hover:text-accent flex flex-col items-center gap-1 transition-colors"
                        title="Collections"
                      >
                        <svg
                          className="text-text-secondary h-5 w-5"
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
                        <span className="text-text-secondary text-xs font-medium">
                          {collections.length}
                        </span>
                      </Link>
                    </div>
                  )}

                  {/* Franchises Icon */}
                  {franchises.length > 0 && (
                    <div className="border-surface mb-4 border-t pt-3">
                      <Link
                        to="/franchises"
                        className="hover:text-accent flex flex-col items-center gap-1 transition-colors"
                        title="Franchises"
                      >
                        <svg
                          className="text-text-secondary h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                          />
                        </svg>
                        <span className="text-text-secondary text-xs font-medium">
                          {franchises.length}
                        </span>
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Expanded View - Full Content */}
          {!isCollapsed && (
            <div className="p-4 pt-[4.5rem]">
              {showBackButton && (
                <div className="mb-6">
                  <BackButton className="border-elevated bg-surface text-text-muted hover:border-elevated hover:text-text-primary flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors" />
                </div>
              )}
              {/* User Section - only show when no custom sidebar content */}
              {!children && (
                <div className="border-surface mb-6 border-b pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="border-elevated bg-elevated flex h-10 w-10 items-center justify-center rounded-full border">
                      <span className="text-text-primary font-medium">
                        {user?.username?.charAt(0).toUpperCase() || "U"}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-text-primary truncate text-sm font-medium">{user?.username}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Context-Sensitive Content - replaces default content when provided */}
              {children ? (
                <div className="space-y-6">{children}</div>
              ) : (
                <>
                  {/* Quick Stats */}
                  <div className="mb-6">
                    <h3 className="text-text-secondary mb-3 text-xs font-semibold uppercase tracking-wider">
                      Quick Stats
                    </h3>
                    <div className="space-y-2">
                      <div
                        className="flex items-center justify-between rounded-lg px-2 py-1 text-sm"
                        style={quickStatStyles.total}
                      >
                        <div className="flex items-center gap-2">
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
                          <span className="text-text-secondary">Total Games</span>
                        </div>
                        <span className="text-text-primary font-semibold">{totalGames}</span>
                      </div>
                      <div
                        className="flex items-center justify-between rounded-lg px-2 py-1 text-sm"
                        style={quickStatStyles.playing}
                      >
                        <div className="flex items-center gap-2">
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
                              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span className="text-text-secondary">Playing</span>
                        </div>
                        <span className="text-text-primary font-semibold">{playingGames}</span>
                      </div>
                      <div
                        className="flex items-center justify-between rounded-lg px-2 py-1 text-sm"
                        style={quickStatStyles.completed}
                      >
                        <div className="flex items-center gap-2">
                          <svg
                            className="text-status-finished h-4 w-4"
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
                          <span className="text-text-secondary">Completed</span>
                        </div>
                        <span className="text-text-primary font-semibold">{completedGames}</span>
                      </div>
                      <div
                        className="flex items-center justify-between rounded-lg px-2 py-1 text-sm"
                        style={quickStatStyles.favorites}
                      >
                        <div className="flex items-center gap-2">
                          <svg
                            className="text-status-dropped h-4 w-4"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                          </svg>
                          <span className="text-text-secondary">Favorites</span>
                        </div>
                        <span className="text-text-primary font-semibold">{favoriteGames}</span>
                      </div>
                    </div>
                  </div>

                  {/* Collections */}
                  {collections.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-text-secondary mb-3 text-xs font-semibold uppercase tracking-wider">
                        My Collections
                      </h3>
                      <div className="space-y-1">
                        {collections.slice(0, 5).map((collection) => (
                          <Link
                            key={collection.id}
                            to="/collections/$id"
                            params={{ id: collection.id }}
                            className="hover:bg-surface flex items-center justify-between rounded px-2 py-1.5 text-sm transition-colors"
                          >
                            <span className="text-text-muted truncate">{collection.name}</span>
                            <span className="text-text-muted text-xs">
                              {collection.game_count}
                            </span>
                          </Link>
                        ))}
                        {collections.length > 5 && (
                          <Link
                            to="/collections"
                            className="text-accent hover:text-accent block px-2 py-1 text-xs transition-colors"
                          >
                            View all ({collections.length})
                          </Link>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Franchises */}
                  {franchises.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-text-secondary mb-3 text-xs font-semibold uppercase tracking-wider">
                        Franchises
                      </h3>
                      <div className="space-y-1">
                        {franchises.slice(0, 5).map((franchise) => (
                          <Link
                            key={franchise.series_name}
                            to="/franchises/$seriesName"
                            params={{ seriesName: franchise.series_name }}
                            className="hover:bg-surface flex items-center justify-between rounded px-2 py-1.5 text-sm transition-colors"
                          >
                            <span className="text-text-muted truncate">
                              {franchise.series_name}
                            </span>
                            <span className="text-text-muted text-xs">
                              {franchise.game_count}
                            </span>
                          </Link>
                        ))}
                        {franchises.length > 5 && (
                          <Link
                            to="/franchises"
                            className="text-accent hover:text-accent block px-2 py-1 text-xs transition-colors"
                          >
                            View all ({franchises.length})
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </ScrollFade>
      </aside>
    </>
  );
}
