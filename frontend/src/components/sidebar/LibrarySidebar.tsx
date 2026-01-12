import { Link } from "@tanstack/react-router";
import { useSidebar } from "@/contexts/SidebarContext";
import { StatusButton, Button, Checkbox, ScrollFade } from "@/components/ui";
import { STATUS_ORDER } from "@/lib/constants/status";
import {
  FilterSection,
  GenreFilter,
  CollectionFilter,
  FranchiseFilter,
} from "@/components/filters";
import type { LibraryFilters } from "@/hooks/useLibraryFilters";

interface Collection {
  id: string;
  name: string;
  game_count: number;
}

interface LibrarySidebarProps {
  filters: LibraryFilters;
  setFilter: <K extends keyof LibraryFilters>(key: K, value: LibraryFilters[K]) => void;
  viewMode: "grid" | "table";
  setViewMode: (value: "grid" | "table") => void;
  uniquePlatforms: string[];
  uniqueStatuses: string[];
  collections: Collection[];
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  stats: {
    total: number;
    playing: number;
    completed: number;
    backlog: number;
    dropped: number;
    favorites: number;
  };
}

export function LibrarySidebar({
  filters,
  setFilter,
  viewMode,
  setViewMode,
  uniquePlatforms,
  uniqueStatuses: _uniqueStatuses,
  collections,
  onClearFilters,
  hasActiveFilters,
  stats,
}: LibrarySidebarProps) {
  const { isCollapsed } = useSidebar();

  if (isCollapsed) {
    return (
      <div className="border-ctp-surface0 space-y-3 border-t pt-3">
        <div className="flex justify-center">
          <Link
            to="/platforms"
            className="text-ctp-subtext0 hover:bg-ctp-surface0 hover:text-ctp-text rounded-lg p-2 transition-all"
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

        {/* View Mode Icons */}
        <div className="flex flex-col items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewMode("grid")}
            className={
              viewMode === "grid"
                ? "hover:bg-ctp-mauve/90 bg-ctp-mauve text-ctp-base hover:text-ctp-base"
                : "text-ctp-subtext0 hover:bg-ctp-surface0 hover:text-ctp-text"
            }
            title="Grid View"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewMode("table")}
            className={
              viewMode === "table"
                ? "hover:bg-ctp-mauve/90 bg-ctp-mauve text-ctp-base hover:text-ctp-base"
                : "text-ctp-subtext0 hover:bg-ctp-surface0 hover:text-ctp-text"
            }
            title="Table View"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
              />
            </svg>
          </Button>
        </div>

        {/* Favorites Toggle */}
        <div className="border-ctp-surface0 flex justify-center border-t pt-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setFilter("favorites", !filters.favorites)}
            className={
              filters.favorites
                ? "bg-ctp-red/20 hover:bg-ctp-red/30 text-ctp-red hover:text-ctp-red"
                : "text-ctp-subtext0 hover:bg-ctp-surface0 hover:text-ctp-text"
            }
            title={filters.favorites ? "Showing Favorites Only" : "Show Favorites Only"}
          >
            <svg
              className="h-5 w-5"
              fill={filters.favorites ? "currentColor" : "none"}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </Button>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <div className="border-ctp-surface0 flex justify-center border-t pt-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClearFilters}
              className="text-ctp-subtext0 hover:bg-ctp-surface0 hover:text-ctp-text"
              title="Clear All Filters"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </Button>
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
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          View
        </h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setViewMode("grid")}
            className={`flex-1 ${
              viewMode === "grid"
                ? "hover:bg-ctp-mauve/90 border-ctp-mauve bg-ctp-mauve text-ctp-base hover:text-ctp-base"
                : "border-ctp-surface1 bg-ctp-surface0 text-ctp-subtext0 hover:text-ctp-text"
            }`}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
            Grid
          </Button>
          <Button
            variant="outline"
            onClick={() => setViewMode("table")}
            className={`flex-1 ${
              viewMode === "table"
                ? "hover:bg-ctp-mauve/90 border-ctp-mauve bg-ctp-mauve text-ctp-base hover:text-ctp-base"
                : "border-ctp-surface1 bg-ctp-surface0 text-ctp-subtext0 hover:text-ctp-text"
            }`}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
              />
            </svg>
            Table
          </Button>
        </div>
      </div>

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
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Status
        </h3>
        <div className="space-y-2">
          {STATUS_ORDER.map((statusId) => {
            const count = stats[statusId as keyof typeof stats];
            const isActive =
              statusId === "total"
                ? filters.status === ""
                : statusId === "favorites"
                  ? filters.favorites
                  : filters.status === statusId;

            return (
              <StatusButton
                key={statusId}
                id={statusId}
                mode="expanded"
                count={count}
                isActive={isActive}
                onClick={() => {
                  if (statusId === "total") setFilter("status", "");
                  else if (statusId === "favorites") setFilter("favorites", !filters.favorites);
                  else setFilter("status", statusId);
                }}
              />
            );
          })}
        </div>
      </div>

      <FilterSection
        title="Platform"
        icon={
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        }
        iconColor="text-ctp-green"
        defaultOpen={false}
        storageKey="platform"
        onClear={() => setFilter("platform", "")}
        hasSelection={filters.platform !== ""}
      >
        <ScrollFade axis="y" className="max-h-48 space-y-1 overflow-y-auto">
          <Button
            variant="ghost"
            onClick={() => setFilter("platform", "")}
            className={`w-full justify-start ${
              filters.platform === ""
                ? "bg-ctp-mauve/20 hover:bg-ctp-mauve/30 text-ctp-mauve hover:text-ctp-mauve"
                : "text-ctp-subtext0 hover:bg-ctp-surface0 hover:text-ctp-text"
            }`}
          >
            All Platforms
          </Button>
          {uniquePlatforms.map((platform) => (
            <Button
              key={platform}
              variant="ghost"
              onClick={() => setFilter("platform", platform)}
              className={`w-full justify-start truncate ${
                filters.platform === platform
                  ? "bg-ctp-mauve/20 hover:bg-ctp-mauve/30 text-ctp-mauve hover:text-ctp-mauve"
                  : "text-ctp-subtext0 hover:bg-ctp-surface0 hover:text-ctp-text"
              }`}
              title={platform}
            >
              {platform}
            </Button>
          ))}
        </ScrollFade>
      </FilterSection>

      <FilterSection
        title="Genres"
        icon={
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
            />
          </svg>
        }
        iconColor="text-ctp-peach"
        defaultOpen={false}
        storageKey="genres"
        onClear={() => setFilter("genre", [])}
        hasSelection={filters.genre.length > 0}
      >
        <GenreFilter selectedGenres={filters.genre} onGenresChange={(g) => setFilter("genre", g)} />
      </FilterSection>

      <FilterSection
        title="Collections"
        icon={
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        }
        iconColor="text-ctp-sapphire"
        defaultOpen={false}
        storageKey="collections"
        onClear={() => setFilter("collection", [])}
        hasSelection={filters.collection.length > 0}
      >
        <CollectionFilter
          selectedCollections={filters.collection}
          onCollectionsChange={(c) => setFilter("collection", c)}
          collections={collections}
        />
      </FilterSection>

      <FilterSection
        title="Franchises"
        icon={
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
            />
          </svg>
        }
        iconColor="text-ctp-lavender"
        defaultOpen={false}
        storageKey="franchises"
        onClear={() => setFilter("franchise", [])}
        hasSelection={filters.franchise.length > 0}
      >
        <FranchiseFilter
          selectedFranchises={filters.franchise}
          onFranchisesChange={(f) => setFilter("franchise", f)}
        />
      </FilterSection>

      <div>
        <h3 className="text-ctp-subtext0 mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
          <svg
            className="text-ctp-red h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          Filters
        </h3>
        <div className="hover:bg-ctp-surface0 flex items-center gap-2 rounded-lg px-3 py-2 transition-colors">
          <Checkbox
            id="filters-favorites"
            checked={filters.favorites}
            onCheckedChange={(checked) => setFilter("favorites", checked === true)}
          />
          <label htmlFor="filters-favorites" className="text-ctp-subtext1 cursor-pointer text-sm">
            Favorites Only
          </label>
        </div>
      </div>

      {hasActiveFilters && (
        <Button
          variant="outline"
          onClick={onClearFilters}
          className="border-ctp-surface1 bg-ctp-surface0 text-ctp-subtext0 hover:border-ctp-surface2 hover:text-ctp-text w-full"
        >
          Clear All Filters
        </Button>
      )}
    </div>
  );
}
