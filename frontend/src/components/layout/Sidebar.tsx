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
    backgroundColor: "color-mix(in srgb, var(--ctp-mauve) 35%, transparent)",
  },
  playing: {
    backgroundColor: "color-mix(in srgb, var(--ctp-teal) 35%, transparent)",
  },
  completed: {
    backgroundColor: "color-mix(in srgb, var(--ctp-green) 35%, transparent)",
  },
  favorites: {
    backgroundColor: "color-mix(in srgb, var(--ctp-red) 35%, transparent)",
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
        className={`fixed top-20 z-20 hidden h-6 w-6 items-center justify-center rounded-full border border-ctp-surface1 bg-ctp-surface0 transition-all duration-300 hover:border-ctp-surface2 hover:bg-ctp-surface1 md:flex ${
          isCollapsed ? "left-[52px]" : "left-[228px]"
        }`}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <svg
          className={`h-3 w-3 text-ctp-subtext0 transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </Button>

      <aside
        className={`fixed bottom-0 left-0 top-16 hidden border-r border-ctp-surface0 bg-ctp-mantle transition-all duration-300 md:block ${
          isCollapsed ? "w-16" : "w-60"
        }`}
      >
        <ScrollFade axis="y" className="h-full overflow-y-auto">
          {/* Collapsed View - Icons Only */}
          {isCollapsed && (
            <div className="space-y-4 p-2 pt-10">
              {showBackButton && (
                <div className="flex justify-center border-b border-ctp-surface0 pb-3">
                  <BackButton
                    iconOnly={true}
                    className="rounded-lg p-2 text-ctp-subtext0 transition-all hover:bg-ctp-surface0 hover:text-ctp-text"
                  />
                </div>
              )}
              {/* User Avatar */}
              <div className="flex justify-center border-b border-ctp-surface0 pb-3">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-ctp-surface2 bg-ctp-surface1"
                  title={user?.username}
                >
                  <span className="text-sm font-medium text-ctp-text">
                    {user?.username?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
              </div>

              {/* Context-Sensitive Content - replaces default content when provided and customCollapsed is true */}
              {children && customCollapsed ? (
                <div>{children}</div>
              ) : (
                <>
                  {/* Quick Stats Icons */}
                  <div className="space-y-3">
                    <Link
                      to="/library"
                      className="flex flex-col items-center gap-1 rounded-lg p-1 transition hover:brightness-110"
                      style={quickStatStyles.total}
                      title="Total Games"
                    >
                      <svg
                        className="h-5 w-5 text-ctp-mauve"
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
                      <span className="text-xs font-semibold text-ctp-text">{totalGames}</span>
                    </Link>
                    <Link
                      to="/library"
                      search={{ status: "playing" }}
                      className="flex flex-col items-center gap-1 rounded-lg p-1 transition hover:brightness-110"
                      style={quickStatStyles.playing}
                      title="Playing"
                    >
                      <svg
                        className="h-5 w-5 text-ctp-teal"
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
                      <span className="text-xs font-semibold text-ctp-text">{playingGames}</span>
                    </Link>
                    <Link
                      to="/library"
                      search={{ status: "completed" }}
                      className="flex flex-col items-center gap-1 rounded-lg p-1 transition hover:brightness-110"
                      style={quickStatStyles.completed}
                      title="Completed"
                    >
                      <svg
                        className="h-5 w-5 text-ctp-green"
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
                      <span className="text-xs font-semibold text-ctp-text">{completedGames}</span>
                    </Link>
                    <Link
                      to="/library"
                      search={{ favorites: true }}
                      className="flex flex-col items-center gap-1 rounded-lg p-1 transition hover:brightness-110"
                      style={quickStatStyles.favorites}
                      title="Favorites"
                    >
                      <svg className="h-5 w-5 text-ctp-red" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                      <span className="text-xs font-semibold text-ctp-text">{favoriteGames}</span>
                    </Link>
                  </div>

                  {/* Collections Icon */}
                  {collections.length > 0 && (
                    <div className="border-t border-ctp-surface0 pt-3">
                      <Link
                        to="/collections"
                        className="flex flex-col items-center gap-1 transition-colors hover:text-ctp-mauve"
                        title="Collections"
                      >
                        <svg
                          className="h-5 w-5 text-ctp-subtext0"
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
                        <span className="text-xs font-medium text-ctp-subtext0">
                          {collections.length}
                        </span>
                      </Link>
                    </div>
                  )}

                  {/* Franchises Icon */}
                  {franchises.length > 0 && (
                    <div className="border-t border-ctp-surface0 pt-3">
                      <Link
                        to="/franchises"
                        className="flex flex-col items-center gap-1 transition-colors hover:text-ctp-teal"
                        title="Franchises"
                      >
                        <svg
                          className="h-5 w-5 text-ctp-subtext0"
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
                        <span className="text-xs font-medium text-ctp-subtext0">
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
            <div className="space-y-6 p-4">
              {showBackButton && (
                <div>
                  <BackButton className="flex items-center gap-2 rounded-lg border border-ctp-surface1 bg-ctp-surface0 px-3 py-2 text-sm text-ctp-subtext1 transition-colors hover:border-ctp-surface2 hover:text-ctp-text" />
                </div>
              )}
              {/* User Section */}
              <div className="border-b border-ctp-surface0 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-ctp-surface2 bg-ctp-surface1">
                    <span className="font-medium text-ctp-text">
                      {user?.username?.charAt(0).toUpperCase() || "U"}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ctp-text">{user?.username}</p>
                  </div>
                </div>
              </div>

              {/* Context-Sensitive Content - replaces default content when provided */}
              {children ? (
                <div>{children}</div>
              ) : (
                <>
                  {/* Quick Stats */}
                  <div>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ctp-subtext0">
                      Quick Stats
                    </h3>
                    <div className="space-y-2">
                      <div
                        className="flex items-center justify-between rounded-lg px-2 py-1 text-sm"
                        style={quickStatStyles.total}
                      >
                        <div className="flex items-center gap-2">
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
                              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                            />
                          </svg>
                          <span className="text-ctp-subtext0">Total Games</span>
                        </div>
                        <span className="font-semibold text-ctp-text">{totalGames}</span>
                      </div>
                      <div
                        className="flex items-center justify-between rounded-lg px-2 py-1 text-sm"
                        style={quickStatStyles.playing}
                      >
                        <div className="flex items-center gap-2">
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
                              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span className="text-ctp-subtext0">Playing</span>
                        </div>
                        <span className="font-semibold text-ctp-text">{playingGames}</span>
                      </div>
                      <div
                        className="flex items-center justify-between rounded-lg px-2 py-1 text-sm"
                        style={quickStatStyles.completed}
                      >
                        <div className="flex items-center gap-2">
                          <svg
                            className="h-4 w-4 text-ctp-green"
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
                          <span className="text-ctp-subtext0">Completed</span>
                        </div>
                        <span className="font-semibold text-ctp-text">{completedGames}</span>
                      </div>
                      <div
                        className="flex items-center justify-between rounded-lg px-2 py-1 text-sm"
                        style={quickStatStyles.favorites}
                      >
                        <div className="flex items-center gap-2">
                          <svg
                            className="h-4 w-4 text-ctp-red"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                          </svg>
                          <span className="text-ctp-subtext0">Favorites</span>
                        </div>
                        <span className="font-semibold text-ctp-text">{favoriteGames}</span>
                      </div>
                    </div>
                  </div>

                  {/* Collections */}
                  {collections.length > 0 && (
                    <div>
                      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ctp-subtext0">
                        My Collections
                      </h3>
                      <div className="space-y-1">
                        {collections.slice(0, 5).map((collection) => (
                          <Link
                            key={collection.id}
                            to="/collections/$id"
                            params={{ id: collection.id }}
                            className="flex items-center justify-between rounded px-2 py-1.5 text-sm transition-colors hover:bg-ctp-surface0"
                          >
                            <span className="truncate text-ctp-subtext1">{collection.name}</span>
                            <span className="text-xs text-ctp-overlay1">
                              {collection.game_count}
                            </span>
                          </Link>
                        ))}
                        {collections.length > 5 && (
                          <Link
                            to="/collections"
                            className="block px-2 py-1 text-xs text-ctp-teal transition-colors hover:text-ctp-mauve"
                          >
                            View all ({collections.length})
                          </Link>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Franchises */}
                  {franchises.length > 0 && (
                    <div>
                      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ctp-subtext0">
                        Franchises
                      </h3>
                      <div className="space-y-1">
                        {franchises.slice(0, 5).map((franchise) => (
                          <Link
                            key={franchise.series_name}
                            to="/franchises/$seriesName"
                            params={{ seriesName: franchise.series_name }}
                            className="flex items-center justify-between rounded px-2 py-1.5 text-sm transition-colors hover:bg-ctp-surface0"
                          >
                            <span className="truncate text-ctp-subtext1">
                              {franchise.series_name}
                            </span>
                            <span className="text-xs text-ctp-overlay1">
                              {franchise.game_count}
                            </span>
                          </Link>
                        ))}
                        {franchises.length > 5 && (
                          <Link
                            to="/franchises"
                            className="block px-2 py-1 text-xs text-ctp-teal transition-colors hover:text-ctp-mauve"
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
