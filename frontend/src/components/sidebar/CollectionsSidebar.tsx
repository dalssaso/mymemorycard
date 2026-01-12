import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useSidebar } from "@/contexts/SidebarContext";
import { useAnimatedNumber } from "@/hooks/use-animated-number";
import { collectionsAPI, franchisesAPI, type FranchiseSummary } from "@/lib/api";

interface Collection {
  id: string;
  name: string;
  game_count: number;
}

interface CollectionsSidebarProps {
  onCreateCollection?: () => void;
}

export function CollectionsSidebar({ onCreateCollection }: CollectionsSidebarProps) {
  const { isCollapsed } = useSidebar();
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

  const collections = useMemo(
    () => collectionsData?.collections ?? [],
    [collectionsData?.collections]
  );
  const franchises = useMemo(() => franchisesData?.franchises ?? [], [franchisesData?.franchises]);

  const stats = useMemo(() => {
    const totalCollections = collections.length;
    const totalFranchises = franchises.length;

    return { totalCollections, totalFranchises };
  }, [collections, franchises]);
  const animatedCollections = useAnimatedNumber(stats.totalCollections);
  const animatedFranchises = useAnimatedNumber(stats.totalFranchises);

  if (isCollapsed) {
    return (
      <div className="space-y-3 border-t border-surface pt-3">
        <div className="flex justify-center">
          <Link
            to="/import"
            className="rounded-lg p-2 text-text-secondary transition-all hover:bg-surface hover:text-text-primary"
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
        <div className="flex justify-center border-t border-surface pt-2">
          <Link
            to="/platforms"
            className="rounded-lg p-2 text-text-secondary transition-all hover:bg-surface hover:text-text-primary"
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
        <div className="flex flex-col items-center gap-2 border-t border-surface pt-2">
          <div
            className="flex flex-col items-center gap-1"
            title={`Collections: ${animatedCollections}`}
          >
            <div className="rounded-lg p-2 text-accent">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <span className="text-xs text-text-muted">{animatedCollections}</span>
          </div>
          <div
            className="flex flex-col items-center gap-1"
            title={`Franchises: ${animatedFranchises}`}
          >
            <div className="rounded-lg p-2 text-accent">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
            </div>
            <span className="text-xs text-text-muted">{animatedFranchises}</span>
          </div>
        </div>
        {onCreateCollection && (
          <div className="flex flex-col items-center gap-1 border-t border-surface pt-2">
            <Button
              onClick={onCreateCollection}
              variant="ghost"
              size="icon"
              className="rounded-lg p-2 text-text-secondary transition-all hover:bg-surface hover:text-text-primary"
              title="Create Collection"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </Button>
            <Link
              to="/franchises"
              className="rounded-lg p-2 text-text-secondary transition-all hover:bg-surface hover:text-text-primary"
              title="View Franchises"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Import Games Button */}
      <Link
        to="/import"
        className="hover:bg-accent/80 flex w-full items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-base text-sm font-medium transition-colors"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Import Games
      </Link>
      <Link
        to="/platforms"
        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-surface px-3 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-elevated"
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
        <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
          <svg
            className="h-4 w-4 text-accent"
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
          <div className="flex items-center justify-between rounded px-2 py-1.5 text-sm transition-colors hover:bg-surface">
            <div className="flex items-center gap-2">
              <svg
                className="h-4 w-4 text-accent"
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
              <span className="text-text-secondary">Collections</span>
            </div>
            <span className="min-w-[2rem] text-right font-medium text-accent">
              {animatedCollections}
            </span>
          </div>

          <div className="flex items-center justify-between rounded px-2 py-1.5 text-sm transition-colors hover:bg-surface">
            <div className="flex items-center gap-2">
              <svg
                className="h-4 w-4 text-accent"
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
              <span className="text-text-secondary">Franchises</span>
            </div>
            <span className="min-w-[2rem] text-right font-medium text-accent">
              {animatedFranchises}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {onCreateCollection && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
            <svg
              className="h-4 w-4 text-status-finished"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Quick Actions
          </h3>
          <Button
            onClick={onCreateCollection}
            variant="ghost"
            className="flex h-auto w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-text-secondary transition-all hover:bg-surface hover:text-text-primary"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create Collection
          </Button>
          <Link
            to="/franchises"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-text-secondary transition-all hover:bg-surface hover:text-text-primary"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z"
              />
            </svg>
            View Franchises
          </Link>
        </div>
      )}

      {/* Recent Collections */}
      {collections.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
            <svg
              className="h-4 w-4 text-accent"
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
            My Collections
          </h3>
          <div className="space-y-1">
            {collections.slice(0, 5).map((collection) => (
              <Link
                key={collection.id}
                to="/collections/$id"
                params={{ id: collection.id }}
                className="group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-surface"
              >
                <div className="bg-accent/20 flex h-8 w-8 items-center justify-center rounded">
                  <svg
                    className="h-4 w-4 text-accent"
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
                  <p className="truncate text-sm text-text-muted group-hover:text-text-primary">
                    {collection.name}
                  </p>
                  <p className="text-xs text-text-muted">
                    {collection.game_count} {collection.game_count === 1 ? "game" : "games"}
                  </p>
                </div>
              </Link>
            ))}
            {collections.length > 5 && (
              <p className="px-2 py-1 text-xs text-text-muted">
                +{collections.length - 5} more collections
              </p>
            )}
          </div>
        </div>
      )}

      {/* Franchises Preview */}
      {franchises.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
            <svg
              className="h-4 w-4 text-accent"
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
                className="group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-surface"
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
                      className="h-4 w-4 text-accent"
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
                  <p className="truncate text-sm text-text-muted group-hover:text-text-primary">
                    {franchise.series_name}
                  </p>
                  <p className="text-xs text-text-muted">
                    {franchise.game_count} {franchise.game_count === 1 ? "game" : "games"}
                  </p>
                </div>
              </Link>
            ))}
            {franchises.length > 5 && (
              <Link
                to="/franchises"
                className="hover:text-accent/80 block px-2 py-1 text-xs text-accent transition-colors"
              >
                View all {franchises.length} franchises
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
