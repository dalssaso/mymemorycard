import { type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSidebar } from "@/contexts/SidebarContext";
import { ScrollFade } from "@/components/ui";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { gamesAPI, collectionsAPI, franchisesAPI } from "@/lib/api";
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

interface GameSummary {
  status: string;
  is_favorite?: boolean;
}

export function Sidebar({
  children,
  customCollapsed = false,
  showBackButton = true,
}: SidebarProps) {
  const { user } = useAuth();
  const { isCollapsed, toggleSidebar } = useSidebar();

  // Fetch games for stats
  const { data } = useQuery({
    queryKey: ["games"],
    queryFn: async () => {
      const response = await gamesAPI.getAll();
      return response.data as { games: GameSummary[] };
    },
  });

  // Fetch collections
  const { data: collectionsData } = useQuery({
    queryKey: ["collections"],
    queryFn: async () => {
      const response = await collectionsAPI.getAll();
      return response.data as {
        collections: Array<{ id: string; name: string; game_count: number }>;
      };
    },
  });

  // Fetch franchises
  const { data: franchisesData } = useQuery({
    queryKey: ["franchises"],
    queryFn: async () => {
      const response = await franchisesAPI.getAll();
      return response.data;
    },
  });

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
      <button
        onClick={toggleSidebar}
        className={`hidden md:flex fixed top-20 z-20 w-6 h-6 bg-ctp-surface0 border border-ctp-surface1 rounded-full items-center justify-center hover:bg-ctp-surface1 hover:border-ctp-surface2 transition-all duration-300 ${
          isCollapsed ? "left-[52px]" : "left-[228px]"
        }`}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <svg
          className={`w-3 h-3 text-ctp-subtext0 transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <aside
        className={`hidden md:block fixed left-0 top-16 bottom-0 bg-ctp-mantle border-r border-ctp-surface0 transition-all duration-300 ${
          isCollapsed ? "w-16" : "w-60"
        }`}
      >
        <ScrollFade axis="y" className="h-full overflow-y-auto">
          {/* Collapsed View - Icons Only */}
          {isCollapsed && (
            <div className="p-2 space-y-4 pt-10">
              {showBackButton && (
                <div className="flex justify-center pb-3 border-b border-ctp-surface0">
                  <BackButton
                    iconOnly={true}
                    className="p-2 rounded-lg text-ctp-subtext0 hover:bg-ctp-surface0 hover:text-ctp-text transition-all"
                  />
                </div>
              )}
              {/* User Avatar */}
              <div className="flex justify-center pb-3 border-b border-ctp-surface0">
                <div
                  className="w-8 h-8 bg-ctp-surface1 border border-ctp-surface2 rounded-full flex items-center justify-center"
                  title={user?.username}
                >
                  <span className="text-ctp-text font-medium text-sm">
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
                        className="w-5 h-5 text-ctp-mauve"
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
                      <span className="text-xs text-ctp-text font-semibold">{totalGames}</span>
                    </Link>
                    <Link
                      to="/library"
                      search={{ status: "playing" }}
                      className="flex flex-col items-center gap-1 rounded-lg p-1 transition hover:brightness-110"
                      style={quickStatStyles.playing}
                      title="Playing"
                    >
                      <svg
                        className="w-5 h-5 text-ctp-teal"
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
                      <span className="text-xs text-ctp-text font-semibold">{playingGames}</span>
                    </Link>
                    <Link
                      to="/library"
                      search={{ status: "completed" }}
                      className="flex flex-col items-center gap-1 rounded-lg p-1 transition hover:brightness-110"
                      style={quickStatStyles.completed}
                      title="Completed"
                    >
                      <svg
                        className="w-5 h-5 text-ctp-green"
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
                      <span className="text-xs text-ctp-text font-semibold">{completedGames}</span>
                    </Link>
                    <Link
                      to="/library"
                      search={{ favorites: true }}
                      className="flex flex-col items-center gap-1 rounded-lg p-1 transition hover:brightness-110"
                      style={quickStatStyles.favorites}
                      title="Favorites"
                    >
                      <svg className="w-5 h-5 text-ctp-red" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                      <span className="text-xs text-ctp-text font-semibold">{favoriteGames}</span>
                    </Link>
                  </div>

                  {/* Collections Icon */}
                  {collections.length > 0 && (
                    <div className="pt-3 border-t border-ctp-surface0">
                      <Link
                        to="/collections"
                        className="flex flex-col items-center gap-1 hover:text-ctp-mauve transition-colors"
                        title="Collections"
                      >
                        <svg
                          className="w-5 h-5 text-ctp-subtext0"
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
                        <span className="text-xs text-ctp-subtext0 font-medium">
                          {collections.length}
                        </span>
                      </Link>
                    </div>
                  )}

                  {/* Franchises Icon */}
                  {franchises.length > 0 && (
                    <div className="pt-3 border-t border-ctp-surface0">
                      <Link
                        to="/franchises"
                        className="flex flex-col items-center gap-1 hover:text-ctp-teal transition-colors"
                        title="Franchises"
                      >
                        <svg
                          className="w-5 h-5 text-ctp-subtext0"
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
                        <span className="text-xs text-ctp-subtext0 font-medium">
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
            <div className="p-4 space-y-6">
              {showBackButton && (
                <div>
                  <BackButton className="flex items-center gap-2 px-3 py-2 bg-ctp-surface0 border border-ctp-surface1 text-ctp-subtext1 hover:text-ctp-text hover:border-ctp-surface2 rounded-lg transition-colors text-sm" />
                </div>
              )}
              {/* User Section */}
              <div className="pb-4 border-b border-ctp-surface0">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-ctp-surface1 border border-ctp-surface2 rounded-full flex items-center justify-center">
                    <span className="text-ctp-text font-medium">
                      {user?.username?.charAt(0).toUpperCase() || "U"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ctp-text truncate">{user?.username}</p>
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
                    <h3 className="text-xs font-semibold text-ctp-subtext0 uppercase tracking-wider mb-3">
                      Quick Stats
                    </h3>
                    <div className="space-y-2">
                      <div
                        className="flex items-center justify-between text-sm rounded-lg px-2 py-1"
                        style={quickStatStyles.total}
                      >
                        <div className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-ctp-mauve"
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
                        <span className="text-ctp-text font-semibold">{totalGames}</span>
                      </div>
                      <div
                        className="flex items-center justify-between text-sm rounded-lg px-2 py-1"
                        style={quickStatStyles.playing}
                      >
                        <div className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-ctp-teal"
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
                        <span className="text-ctp-text font-semibold">{playingGames}</span>
                      </div>
                      <div
                        className="flex items-center justify-between text-sm rounded-lg px-2 py-1"
                        style={quickStatStyles.completed}
                      >
                        <div className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-ctp-green"
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
                        <span className="text-ctp-text font-semibold">{completedGames}</span>
                      </div>
                      <div
                        className="flex items-center justify-between text-sm rounded-lg px-2 py-1"
                        style={quickStatStyles.favorites}
                      >
                        <div className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-ctp-red"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                          </svg>
                          <span className="text-ctp-subtext0">Favorites</span>
                        </div>
                        <span className="text-ctp-text font-semibold">{favoriteGames}</span>
                      </div>
                    </div>
                  </div>

                  {/* Collections */}
                  {collections.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-ctp-subtext0 uppercase tracking-wider mb-3">
                        My Collections
                      </h3>
                      <div className="space-y-1">
                        {collections.slice(0, 5).map((collection) => (
                          <Link
                            key={collection.id}
                            to="/collections/$id"
                            params={{ id: collection.id }}
                            className="flex items-center justify-between text-sm px-2 py-1.5 rounded hover:bg-ctp-surface0 transition-colors"
                          >
                            <span className="text-ctp-subtext1 truncate">{collection.name}</span>
                            <span className="text-ctp-overlay1 text-xs">
                              {collection.game_count}
                            </span>
                          </Link>
                        ))}
                        {collections.length > 5 && (
                          <Link
                            to="/collections"
                            className="text-xs text-ctp-teal hover:text-ctp-mauve transition-colors block px-2 py-1"
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
                      <h3 className="text-xs font-semibold text-ctp-subtext0 uppercase tracking-wider mb-3">
                        Franchises
                      </h3>
                      <div className="space-y-1">
                        {franchises.slice(0, 5).map((franchise) => (
                          <Link
                            key={franchise.series_name}
                            to="/franchises/$seriesName"
                            params={{ seriesName: franchise.series_name }}
                            className="flex items-center justify-between text-sm px-2 py-1.5 rounded hover:bg-ctp-surface0 transition-colors"
                          >
                            <span className="text-ctp-subtext1 truncate">
                              {franchise.series_name}
                            </span>
                            <span className="text-ctp-overlay1 text-xs">
                              {franchise.game_count}
                            </span>
                          </Link>
                        ))}
                        {franchises.length > 5 && (
                          <Link
                            to="/franchises"
                            className="text-xs text-ctp-teal hover:text-ctp-mauve transition-colors block px-2 py-1"
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
