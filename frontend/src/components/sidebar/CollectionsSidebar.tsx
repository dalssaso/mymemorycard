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
      <div className="space-y-3 pt-3 border-t border-ctp-surface0">
        <div className="flex justify-center">
          <Link
            to="/import"
            className="p-2 rounded-lg text-ctp-subtext0 hover:bg-ctp-surface0 hover:text-ctp-text transition-all"
            title="Import Games"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </Link>
        </div>
        <div className="flex justify-center pt-2 border-t border-ctp-surface0">
          <Link
            to="/platforms"
            className="p-2 rounded-lg text-ctp-subtext0 hover:bg-ctp-surface0 hover:text-ctp-text transition-all"
            title="Manage Platforms"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 4h6a2 2 0 012 2v2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2v2a2 2 0 01-2 2H9a2 2 0 01-2-2v-2H5a2 2 0 01-2-2v-4a2 2 0 012-2h2V6a2 2 0 012-2z"
              />
            </svg>
          </Link>
        </div>
        <div className="flex flex-col items-center gap-2 pt-2 border-t border-ctp-surface0">
          <div
            className="flex flex-col items-center gap-1"
            title={`Collections: ${animatedCollections}`}
          >
            <div className="p-2 rounded-lg text-ctp-teal">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <span className="text-xs text-ctp-overlay1">{animatedCollections}</span>
          </div>
          <div
            className="flex flex-col items-center gap-1"
            title={`Franchises: ${animatedFranchises}`}
          >
            <div className="p-2 rounded-lg text-ctp-mauve">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
            </div>
            <span className="text-xs text-ctp-overlay1">{animatedFranchises}</span>
          </div>
        </div>
        {onCreateCollection && (
          <div className="flex flex-col items-center gap-1 pt-2 border-t border-ctp-surface0">
            <Button
              onClick={onCreateCollection}
              variant="ghost"
              size="icon"
              className="p-2 rounded-lg text-ctp-subtext0 hover:bg-ctp-surface0 hover:text-ctp-text transition-all"
              title="Create Collection"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              className="p-2 rounded-lg text-ctp-subtext0 hover:bg-ctp-surface0 hover:text-ctp-text transition-all"
              title="View Franchises"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    <div className="space-y-6">
      {/* Import Games Button */}
      <Link
        to="/import"
        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-ctp-mauve hover:bg-ctp-mauve/80 text-ctp-base rounded-lg transition-colors font-medium"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Import Games
      </Link>
      <Link
        to="/platforms"
        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-ctp-surface0 hover:bg-ctp-surface1 text-ctp-text rounded-lg transition-colors font-medium"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <h3 className="text-xs font-semibold text-ctp-subtext0 uppercase tracking-wider mb-3 flex items-center gap-2">
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
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          Quick Stats
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm px-2 py-1.5 rounded hover:bg-ctp-surface0 transition-colors">
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
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              <span className="text-ctp-subtext0">Collections</span>
            </div>
            <span className="text-ctp-teal font-medium min-w-[2rem] text-right">
              {animatedCollections}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm px-2 py-1.5 rounded hover:bg-ctp-surface0 transition-colors">
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
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
              <span className="text-ctp-subtext0">Franchises</span>
            </div>
            <span className="text-ctp-mauve font-medium min-w-[2rem] text-right">
              {animatedFranchises}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {onCreateCollection && (
        <div>
          <h3 className="text-xs font-semibold text-ctp-subtext0 uppercase tracking-wider mb-3 flex items-center gap-2">
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
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Quick Actions
          </h3>
          <Button
            onClick={onCreateCollection}
            variant="ghost"
            className="h-auto w-full text-left px-3 py-2 rounded-lg text-sm text-ctp-subtext0 hover:bg-ctp-surface0 hover:text-ctp-text transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-ctp-subtext0 hover:bg-ctp-surface0 hover:text-ctp-text transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <h3 className="text-xs font-semibold text-ctp-subtext0 uppercase tracking-wider mb-3 flex items-center gap-2">
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
                className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-ctp-surface0 transition-colors group"
              >
                <div className="w-8 h-8 bg-ctp-teal/20 rounded flex items-center justify-center">
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
                      d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ctp-subtext1 truncate group-hover:text-ctp-text">
                    {collection.name}
                  </p>
                  <p className="text-xs text-ctp-overlay1">
                    {collection.game_count} {collection.game_count === 1 ? "game" : "games"}
                  </p>
                </div>
              </Link>
            ))}
            {collections.length > 5 && (
              <p className="text-xs text-ctp-overlay1 px-2 py-1">
                +{collections.length - 5} more collections
              </p>
            )}
          </div>
        </div>
      )}

      {/* Franchises Preview */}
      {franchises.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-ctp-subtext0 uppercase tracking-wider mb-3 flex items-center gap-2">
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
                className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-ctp-surface0 transition-colors group"
              >
                {franchise.cover_art_url ? (
                  <img
                    src={franchise.cover_art_url}
                    alt={franchise.series_name}
                    className="w-8 h-10 object-cover rounded"
                  />
                ) : (
                  <div className="w-8 h-10 bg-ctp-mauve/20 rounded flex items-center justify-center">
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
                        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z"
                      />
                    </svg>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ctp-subtext1 truncate group-hover:text-ctp-text">
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
                className="text-xs text-ctp-mauve hover:text-ctp-mauve/80 transition-colors block px-2 py-1"
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
