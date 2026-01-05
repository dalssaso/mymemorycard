import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useCallback } from "react";
import { useSidebar } from "@/contexts/SidebarContext";
import { Button } from "@/components/ui";
import { useAnimatedNumber } from "@/hooks/use-animated-number";
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
  backlog: {
    backgroundColor: "color-mix(in srgb, var(--ctp-subtext1) 30%, transparent)",
  },
  dropped: {
    backgroundColor: "color-mix(in srgb, var(--ctp-red) 35%, transparent)",
  },
  favorites: {
    backgroundColor: "color-mix(in srgb, var(--ctp-red) 35%, transparent)",
  },
};

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
  const animatedTotal = useAnimatedNumber(stats.total);
  const animatedPlaying = useAnimatedNumber(stats.playing);
  const animatedCompleted = useAnimatedNumber(stats.completed);
  const animatedBacklog = useAnimatedNumber(stats.backlog);
  const animatedDropped = useAnimatedNumber(stats.dropped);
  const animatedFavorites = useAnimatedNumber(stats.favorites);

  if (isCollapsed) {
    return (
      <div className="space-y-3 border-t border-ctp-surface0 pt-3">
        <div className="flex justify-center">
          <Link
            to="/import"
            className="rounded-lg p-2 text-ctp-subtext0 transition-all hover:bg-ctp-surface0 hover:text-ctp-text"
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

        <div className="flex justify-center border-t border-ctp-surface0 pt-2">
          <Link
            to="/platforms"
            className="rounded-lg p-2 text-ctp-subtext0 transition-all hover:bg-ctp-surface0 hover:text-ctp-text"
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

        <div className="flex flex-col items-center gap-1 border-t border-ctp-surface0 pt-2">
          <Button
            onClick={() => navigateToLibrary({})}
            variant="ghost"
            size="icon"
            className="rounded-lg p-2 text-ctp-subtext0 transition-all hover:bg-ctp-surface0 hover:text-ctp-text"
            title="Total Games"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </Button>
          <Button
            onClick={() => navigateToLibrary({ status: "playing" })}
            variant="ghost"
            size="icon"
            className="rounded-lg p-2 text-ctp-teal transition-all hover:bg-ctp-surface0 hover:text-ctp-text"
            title="Playing"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          </Button>
          <Button
            onClick={() => navigateToLibrary({ status: "completed" })}
            variant="ghost"
            size="icon"
            className="rounded-lg p-2 text-ctp-green transition-all hover:bg-ctp-surface0 hover:text-ctp-text"
            title="Completed"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </Button>
          <Button
            onClick={() => navigateToLibrary({ status: "backlog" })}
            variant="ghost"
            size="icon"
            className="rounded-lg p-2 text-ctp-subtext0 transition-all hover:bg-ctp-surface0 hover:text-ctp-text"
            title="Backlog"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </Button>
          <Button
            onClick={() => navigateToLibrary({ status: "dropped" })}
            variant="ghost"
            size="icon"
            className="rounded-lg p-2 text-ctp-red transition-all hover:bg-ctp-surface0 hover:text-ctp-text"
            title="Dropped"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
          </Button>
          <Button
            onClick={() => navigateToLibrary({ favorites: true })}
            variant="ghost"
            size="icon"
            className="rounded-lg p-2 text-ctp-red transition-all hover:bg-ctp-surface0 hover:text-ctp-text"
            title="Favorites"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Import Games Button */}
      <Link
        to="/import"
        className="hover:bg-ctp-mauve/80 flex w-full items-center justify-center gap-2 rounded-lg bg-ctp-mauve px-4 py-2.5 font-medium text-ctp-base transition-colors"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Import Games
      </Link>
      <Link
        to="/platforms"
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-ctp-surface0 px-4 py-2.5 font-medium text-ctp-text transition-colors hover:bg-ctp-surface1"
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

      {/* Quick Stats - Clickable */}
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ctp-subtext0">
          Quick Stats
        </h3>
        <div className="space-y-2">
          <Button
            onClick={() => navigateToLibrary({})}
            variant="ghost"
            className="flex h-auto w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm transition hover:brightness-110"
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
            <span className="min-w-[2rem] text-right font-semibold text-ctp-text">
              {animatedTotal}
            </span>
          </Button>

          <Button
            onClick={() => navigateToLibrary({ status: "playing" })}
            variant="ghost"
            className="flex h-auto w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm transition hover:brightness-110"
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
            <span className="min-w-[2rem] text-right font-semibold text-ctp-text">
              {animatedPlaying}
            </span>
          </Button>

          <Button
            onClick={() => navigateToLibrary({ status: "completed" })}
            variant="ghost"
            className="flex h-auto w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm transition hover:brightness-110"
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
            <span className="min-w-[2rem] text-right font-semibold text-ctp-text">
              {animatedCompleted}
            </span>
          </Button>

          <Button
            onClick={() => navigateToLibrary({ status: "backlog" })}
            variant="ghost"
            className="flex h-auto w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm transition hover:brightness-110"
            style={quickStatStyles.backlog}
          >
            <div className="flex items-center gap-2">
              <svg
                className="h-4 w-4 text-ctp-subtext1"
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
              <span className="text-ctp-subtext0">Backlog</span>
            </div>
            <span className="min-w-[2rem] text-right font-semibold text-ctp-text">
              {animatedBacklog}
            </span>
          </Button>

          <Button
            onClick={() => navigateToLibrary({ status: "dropped" })}
            variant="ghost"
            className="flex h-auto w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm transition hover:brightness-110"
            style={quickStatStyles.dropped}
          >
            <div className="flex items-center gap-2">
              <svg
                className="h-4 w-4 text-ctp-red"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                />
              </svg>
              <span className="text-ctp-subtext0">Dropped</span>
            </div>
            <span className="min-w-[2rem] text-right font-semibold text-ctp-text">
              {animatedDropped}
            </span>
          </Button>

          <Button
            onClick={() => navigateToLibrary({ favorites: true })}
            variant="ghost"
            className="flex h-auto w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm transition hover:brightness-110"
            style={quickStatStyles.favorites}
          >
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-ctp-red" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              <span className="text-ctp-subtext0">Favorites</span>
            </div>
            <span className="min-w-[2rem] text-right font-semibold text-ctp-text">
              {animatedFavorites}
            </span>
          </Button>
        </div>
      </div>

      {/* Completion Progress */}
      {stats.total > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ctp-subtext0">
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
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            Progress
          </h3>
          <div className="space-y-3">
            <div>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-ctp-subtext0">Completion Rate</span>
                <span className="font-medium text-ctp-green">
                  {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-ctp-surface1">
                <div
                  className="h-2 rounded-full bg-ctp-green transition-all"
                  style={{
                    width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-ctp-subtext0">Drop Rate</span>
                <span className="font-medium text-ctp-red">
                  {stats.total > 0 ? Math.round((stats.dropped / stats.total) * 100) : 0}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-ctp-surface1">
                <div
                  className="h-2 rounded-full bg-ctp-red transition-all"
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
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ctp-subtext0">
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
                className="group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-ctp-surface0"
              >
                {franchise.cover_art_url ? (
                  <img
                    src={franchise.cover_art_url}
                    alt={franchise.series_name}
                    className="h-10 w-8 rounded object-cover"
                  />
                ) : (
                  <div className="bg-ctp-mauve/20 flex h-10 w-8 items-center justify-center rounded">
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
                        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z"
                      />
                    </svg>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ctp-subtext1 group-hover:text-ctp-text">
                    {franchise.series_name}
                  </p>
                  <p className="text-xs text-ctp-overlay1">
                    {franchise.game_count} {franchise.game_count === 1 ? "game" : "games"}
                  </p>
                </div>
              </Link>
            ))}
            {franchises.length > 5 && (
              <Link
                to="/franchises"
                className="hover:text-ctp-mauve/80 block px-2 py-1 text-xs text-ctp-mauve transition-colors"
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
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ctp-subtext0">
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
                className="group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-ctp-surface0"
              >
                <div className="bg-ctp-teal/20 flex h-8 w-8 items-center justify-center rounded">
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
                      d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8"
                    />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ctp-subtext1 group-hover:text-ctp-text">
                    {collection.name}
                  </p>
                  <p className="text-xs text-ctp-overlay1">
                    {collection.game_count} {collection.game_count === 1 ? "game" : "games"}
                  </p>
                </div>
              </Link>
            ))}
            {collections.length > 5 && (
              <Link
                to="/collections"
                className="hover:text-ctp-teal/80 block px-2 py-1 text-xs text-ctp-teal transition-colors"
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
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ctp-subtext0">
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
                className="group flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-ctp-surface0"
              >
                {game.cover_art_url ? (
                  <img
                    src={game.cover_art_url}
                    alt={game.name}
                    className="h-14 w-10 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-10 items-center justify-center rounded bg-ctp-surface1">
                    <span className="text-xs text-ctp-overlay1">?</span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ctp-subtext1 group-hover:text-ctp-text">
                    {game.name}
                  </p>
                  <p className="text-xs text-ctp-overlay1">
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
