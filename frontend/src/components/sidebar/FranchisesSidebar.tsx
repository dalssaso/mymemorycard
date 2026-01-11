import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useSidebar } from "@/contexts/SidebarContext";
import { Button } from "@/components/ui";
import { useAnimatedNumber } from "@/hooks/use-animated-number";
import { franchisesAPI, collectionsAPI, type FranchiseSummary } from "@/lib/api";

interface Collection {
  id: string;
  name: string;
  game_count: number;
}

interface FranchisesSidebarProps {
  onSync?: () => void;
  isSyncing?: boolean;
}

export function FranchisesSidebar({ onSync, isSyncing }: FranchisesSidebarProps) {
  const { isCollapsed } = useSidebar();
  const { data: franchisesData } = useQuery({
    queryKey: ["franchises"],
    queryFn: async () => {
      const response = await franchisesAPI.getAll();
      return response.data;
    },
    refetchOnMount: "always",
  });

  const { data: collectionsData } = useQuery({
    queryKey: ["collections"],
    queryFn: async () => {
      const response = await collectionsAPI.getAll();
      return response.data as { collections: Collection[] };
    },
    refetchOnMount: "always",
  });

  const franchises = useMemo(() => franchisesData?.franchises ?? [], [franchisesData?.franchises]);
  const collections = useMemo(
    () => collectionsData?.collections ?? [],
    [collectionsData?.collections]
  );

  const stats = useMemo(() => {
    const totalFranchises = franchises.length;
    const totalCollections = collections.length;

    return { totalFranchises, totalCollections };
  }, [franchises, collections]);
  const animatedFranchises = useAnimatedNumber(stats.totalFranchises);
  const animatedCollections = useAnimatedNumber(stats.totalCollections);

  if (isCollapsed) {
    return (
      <div className="border-ctp-surface0 space-y-3 border-t pt-3">
        <div className="flex justify-center">
          <Link
            to="/import"
            className="text-ctp-subtext0 hover:bg-ctp-surface0 hover:text-ctp-text rounded-lg p-2 transition-all"
            title="Import Games"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </Link>
        </div>
        <div className="border-ctp-surface0 flex justify-center border-t pt-2">
          <Link
            to="/platforms"
            className="text-ctp-subtext0 hover:bg-ctp-surface0 hover:text-ctp-text rounded-lg p-2 transition-all"
            title="Manage Platforms"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 4h6a2 2 0 012 2v2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2v2a2 2 0 01-2 2H9a2 2 0 01-2-2v-2H5a2 2 0 01-2-2v-4a2 2 0 012-2h2V6a2 2 0 012-2z"
              />
            </svg>
          </Link>
        </div>
        <div className="border-ctp-surface0 flex flex-col items-center gap-2 border-t pt-2">
          <div
            className="flex flex-col items-center gap-1"
            title={`Franchises: ${animatedFranchises}`}
          >
            <div className="text-ctp-mauve rounded-lg p-2">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
            </div>
            <span className="text-ctp-overlay1 text-xs">{animatedFranchises}</span>
          </div>
          <div
            className="flex flex-col items-center gap-1"
            title={`Collections: ${animatedCollections}`}
          >
            <div className="text-ctp-teal rounded-lg p-2">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <span className="text-ctp-overlay1 text-xs">{animatedCollections}</span>
          </div>
        </div>
        <div className="border-ctp-surface0 flex flex-col items-center gap-1 border-t pt-2">
          {onSync && (
            <Button
              onClick={onSync}
              disabled={isSyncing}
              variant="ghost"
              size="icon"
              className="text-ctp-subtext0 hover:bg-ctp-surface0 hover:text-ctp-text rounded-lg p-2 transition-all disabled:opacity-50"
              title={isSyncing ? "Syncing Franchises" : "Sync Franchises"}
            >
              <svg
                className={`h-5 w-5 ${isSyncing ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </Button>
          )}
          <Link
            to="/collections"
            className="text-ctp-subtext0 hover:bg-ctp-surface0 hover:text-ctp-text rounded-lg p-2 transition-all"
            title="View Collections"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8"
              />
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Import Games Button */}
      <Link
        to="/import"
        className="hover:bg-ctp-mauve/80 bg-ctp-mauve text-ctp-base flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Import Games
      </Link>
      <Link
        to="/platforms"
        className="bg-ctp-surface0 text-ctp-text hover:bg-ctp-surface1 flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
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

      {/* Quick Stats */}
      <div>
        <h3 className="text-ctp-subtext0 mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
          <svg
            className="text-ctp-mauve h-4 w-4"
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
          Quick Stats
        </h3>
        <div className="space-y-2">
          <div className="hover:bg-ctp-surface0 flex items-center justify-between rounded px-2 py-1.5 text-sm transition-colors">
            <div className="flex items-center gap-2">
              <svg
                className="text-ctp-mauve h-4 w-4"
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
              <span className="text-ctp-subtext0">Franchises</span>
            </div>
            <span className="text-ctp-mauve min-w-[2rem] text-right font-medium">
              {animatedFranchises}
            </span>
          </div>

          <div className="hover:bg-ctp-surface0 flex items-center justify-between rounded px-2 py-1.5 text-sm transition-colors">
            <div className="flex items-center gap-2">
              <svg
                className="text-ctp-teal h-4 w-4"
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
              <span className="text-ctp-subtext0">Collections</span>
            </div>
            <span className="text-ctp-teal min-w-[2rem] text-right font-medium">
              {animatedCollections}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-ctp-subtext0 mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
          <svg
            className="text-ctp-green h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          Quick Actions
        </h3>
        {onSync && (
          <Button
            onClick={onSync}
            disabled={isSyncing}
            variant="ghost"
            className="text-ctp-subtext0 hover:bg-ctp-surface0 hover:text-ctp-text flex h-auto w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-all disabled:opacity-50"
          >
            <svg
              className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {isSyncing ? "Syncing..." : "Sync Franchises"}
          </Button>
        )}
        <Link
          to="/collections"
          className="text-ctp-subtext0 hover:bg-ctp-surface0 hover:text-ctp-text flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-all"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8"
            />
          </svg>
          View Collections
        </Link>
      </div>

      {/* Top Franchises */}
      {franchises.length > 0 && (
        <div>
          <h3 className="text-ctp-subtext0 mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
            <svg
              className="text-ctp-mauve h-4 w-4"
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
            Top Franchises
          </h3>
          <div className="space-y-1">
            {franchises
              .slice()
              .sort((a: FranchiseSummary, b: FranchiseSummary) => b.game_count - a.game_count)
              .slice(0, 5)
              .map((franchise: FranchiseSummary) => (
                <Link
                  key={franchise.series_name}
                  to="/franchises/$seriesName"
                  params={{ seriesName: franchise.series_name }}
                  className="hover:bg-ctp-surface0 group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors"
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
                        className="text-ctp-mauve h-4 w-4"
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
                    <p className="text-ctp-subtext1 group-hover:text-ctp-text truncate text-sm">
                      {franchise.series_name}
                    </p>
                    <p className="text-ctp-overlay1 text-xs">
                      {franchise.game_count} {franchise.game_count === 1 ? "game" : "games"}
                    </p>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      )}

      {/* Collections */}
      {collections.length > 0 && (
        <div>
          <h3 className="text-ctp-subtext0 mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
            <svg
              className="text-ctp-teal h-4 w-4"
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
            Collections
          </h3>
          <div className="space-y-1">
            {collections.slice(0, 5).map((collection) => (
              <Link
                key={collection.id}
                to="/collections/$id"
                params={{ id: collection.id }}
                className="hover:bg-ctp-surface0 group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors"
              >
                <div className="bg-ctp-teal/20 flex h-8 w-8 items-center justify-center rounded">
                  <svg
                    className="text-ctp-teal h-4 w-4"
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
                  <p className="text-ctp-subtext1 group-hover:text-ctp-text truncate text-sm">
                    {collection.name}
                  </p>
                  <p className="text-ctp-overlay1 text-xs">
                    {collection.game_count} {collection.game_count === 1 ? "game" : "games"}
                  </p>
                </div>
              </Link>
            ))}
            {collections.length > 5 && (
              <Link
                to="/collections"
                className="hover:text-ctp-teal/80 text-ctp-teal block px-2 py-1 text-xs transition-colors"
              >
                View all {collections.length} collections
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
