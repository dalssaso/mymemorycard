import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useCallback } from "react";
import { useSidebar } from "@/contexts/SidebarContext";
import { StatusButton } from "@/components/ui";
import { STATUS_ORDER } from "@/lib/constants/status";
import { collectionsAPI, franchisesAPI, type FranchiseSummary } from "@/lib/api";

interface Game {
  id: string;
  name: string;
  cover_art_url: string | null;
  last_played: string | null;
  status: string;
  is_favorite?: boolean;
}

interface DashboardSidebarProps {
  games: Game[];
}

interface Collection {
  id: string;
  name: string;
  game_count: number;
}

export function DashboardSidebar({ games }: DashboardSidebarProps) {
  const navigate = useNavigate();
  const { isCollapsed } = useSidebar();

  const navigateToLibrary = useCallback(
    (params: { status?: string; favorites?: boolean }) => {
      navigate({
        to: "/library" as const,
        search: params as Record<string, string | boolean | undefined>,
      });
    },
    [navigate]
  );

  const { data: collectionsData } = useQuery({
    queryKey: ["collections"],
    queryFn: async () => {
      const response = await collectionsAPI.getAll();
      return response.data as { collections: Collection[] };
    },
    refetchOnMount: "always",
  });

  const { data: franchisesData } = useQuery({
    queryKey: ["franchises"],
    queryFn: async () => {
      const response = await franchisesAPI.getAll();
      return response.data;
    },
    refetchOnMount: "always",
  });

  const collections = collectionsData?.collections || [];
  const franchises = franchisesData?.franchises || [];

  const recentlyPlayed = useMemo(() => {
    return games
      .filter((g) => g.last_played)
      .sort((a, b) => new Date(b.last_played!).getTime() - new Date(a.last_played!).getTime())
      .slice(0, 5);
  }, [games]);

  const stats = useMemo(() => {
    const total = games.length;
    const playing = games.filter((g) => g.status === "playing").length;
    const completed = games.filter(
      (g) => g.status === "completed" || g.status === "finished"
    ).length;
    const backlog = games.filter((g) => g.status === "backlog").length;
    const dropped = games.filter((g) => g.status === "dropped").length;
    const favorites = games.filter((g) => g.is_favorite).length;

    return { total, playing, completed, backlog, dropped, favorites };
  }, [games]);

  if (isCollapsed) {
    return (
      <div className="border-surface space-y-3 border-t pt-3">
        <div className="flex justify-center">
          <Link
            to="/import"
            className="text-text-secondary hover:bg-surface hover:text-text-primary rounded-lg p-2 transition-all"
            title="Import Games"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </Link>
        </div>

        <div className="border-surface flex justify-center border-t pt-2">
          <Link
            to="/platforms"
            className="text-text-secondary hover:bg-surface hover:text-text-primary rounded-lg p-2 transition-all"
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
          {STATUS_ORDER.map((statusId) => (
            <StatusButton
              key={statusId}
              id={statusId}
              mode="collapsed"
              onClick={() => {
                if (statusId === "total") navigateToLibrary({});
                else if (statusId === "favorites") navigateToLibrary({ favorites: true });
                else navigateToLibrary({ status: statusId });
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Import Games Button */}
      <Link
        to="/import"
        className="hover:bg-accent/80 bg-accent text-base flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Import Games
      </Link>
      <Link
        to="/platforms"
        className="bg-surface text-text-primary hover:bg-elevated flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 4h6a2 2 0 012 2v2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2v2a2 2 0 01-2 2H9a2 2 0 01-2-2v-2H5a2 2 0 01-2-2v-4a2 2 0 012-2h2V6a2 2 0 012-2z"
          />
        </svg>
        Manage Platforms
      </Link>

      {/* Quick Stats - Clickable */}
      <div>
        <h3 className="text-text-secondary mb-3 text-xs font-semibold uppercase tracking-wider">
          Quick Stats
        </h3>
        <div className="space-y-2">
          {STATUS_ORDER.map((statusId) => {
            const count = stats[statusId as keyof typeof stats];
            return (
              <StatusButton
                key={statusId}
                id={statusId}
                mode="expanded"
                count={count}
                onClick={() => {
                  if (statusId === "total") navigateToLibrary({});
                  else if (statusId === "favorites") navigateToLibrary({ favorites: true });
                  else navigateToLibrary({ status: statusId });
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Completion Progress */}
      {stats.total > 0 && (
        <div>
          <h3 className="text-text-secondary mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
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
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            Progress
          </h3>
          <div className="space-y-3">
            <div>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-text-secondary">Completion Rate</span>
                <span className="text-status-finished font-medium">
                  {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                </span>
              </div>
              <div className="bg-elevated h-2 w-full rounded-full">
                <div
                  className="bg-status-finished h-2 rounded-full transition-all"
                  style={{
                    width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-text-secondary">Drop Rate</span>
                <span className="text-status-dropped font-medium">
                  {stats.total > 0 ? Math.round((stats.dropped / stats.total) * 100) : 0}%
                </span>
              </div>
              <div className="bg-elevated h-2 w-full rounded-full">
                <div
                  className="bg-status-dropped h-2 rounded-full transition-all"
                  style={{
                    width: `${stats.total > 0 ? (stats.dropped / stats.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Franchises */}
      {franchises.length > 0 && (
        <div>
          <h3 className="text-text-secondary mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
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
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
            Franchises
          </h3>
          <div className="space-y-1">
            {franchises.slice(0, 5).map((franchise: FranchiseSummary) => (
              <Link
                key={franchise.series_name}
                to="/franchises/$seriesName"
                params={{ seriesName: franchise.series_name }}
                className="hover:bg-surface group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors"
              >
                {franchise.cover_art_url ? (
                  <img
                    src={franchise.cover_art_url}
                    alt={franchise.series_name}
                    className="h-10 w-8 rounded object-cover"
                  />
                ) : (
                  <div className="bg-accent/20 flex h-10 w-8 items-center justify-center rounded">
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
                        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z"
                      />
                    </svg>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-text-muted group-hover:text-text-primary truncate text-sm">
                    {franchise.series_name}
                  </p>
                  <p className="text-text-muted text-xs">
                    {franchise.game_count} {franchise.game_count === 1 ? "game" : "games"}
                  </p>
                </div>
              </Link>
            ))}
            {franchises.length > 5 && (
              <Link
                to="/franchises"
                className="hover:text-accent/80 text-accent block px-2 py-1 text-xs transition-colors"
              >
                View all {franchises.length} franchises
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Collections */}
      {collections.length > 0 && (
        <div>
          <h3 className="text-text-secondary mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
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
            Collections
          </h3>
          <div className="space-y-1">
            {collections.slice(0, 5).map((collection) => (
              <Link
                key={collection.id}
                to="/collections/$id"
                params={{ id: collection.id }}
                className="hover:bg-surface group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors"
              >
                <div className="bg-accent/20 flex h-8 w-8 items-center justify-center rounded">
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
                      d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8"
                    />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-text-muted group-hover:text-text-primary truncate text-sm">
                    {collection.name}
                  </p>
                  <p className="text-text-muted text-xs">
                    {collection.game_count} {collection.game_count === 1 ? "game" : "games"}
                  </p>
                </div>
              </Link>
            ))}
            {collections.length > 5 && (
              <Link
                to="/collections"
                className="hover:text-accent/80 text-accent block px-2 py-1 text-xs transition-colors"
              >
                View all {collections.length} collections
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Recently Played */}
      {recentlyPlayed.length > 0 && (
        <div>
          <h3 className="text-text-secondary mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
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
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Recently Played
          </h3>
          <div className="space-y-2">
            {recentlyPlayed.map((game) => (
              <Link
                key={game.id}
                to="/library/$id"
                params={{ id: game.id }}
                className="hover:bg-surface group flex items-center gap-3 rounded-lg p-2 transition-colors"
              >
                {game.cover_art_url ? (
                  <img
                    src={game.cover_art_url}
                    alt={game.name}
                    className="h-14 w-10 rounded object-cover"
                  />
                ) : (
                  <div className="bg-elevated flex h-14 w-10 items-center justify-center rounded">
                    <span className="text-text-muted text-xs">?</span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-text-muted group-hover:text-text-primary truncate text-sm">
                    {game.name}
                  </p>
                  <p className="text-text-muted text-xs">
                    {new Date(game.last_played!).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
