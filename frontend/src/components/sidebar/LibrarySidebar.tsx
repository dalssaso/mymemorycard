import { Link } from "@tanstack/react-router";
import { useSidebar } from "@/contexts/SidebarContext";
import { Checkbox, ScrollFade } from "@/components/ui";
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
}

const STATUS_LABELS: Record<string, string> = {
  backlog: "Backlog",
  playing: "Playing",
  finished: "Finished",
  completed: "Completed",
  dropped: "Dropped",
};

const STATUS_BG_STYLES: Record<string, React.CSSProperties> = {
  backlog: {
    backgroundColor: "color-mix(in srgb, var(--ctp-subtext1) 30%, transparent)",
  },
  playing: {
    backgroundColor: "color-mix(in srgb, var(--ctp-teal) 35%, transparent)",
  },
  finished: {
    backgroundColor: "color-mix(in srgb, var(--ctp-green) 35%, transparent)",
  },
  completed: {
    backgroundColor: "color-mix(in srgb, var(--ctp-green) 35%, transparent)",
  },
  dropped: {
    backgroundColor: "color-mix(in srgb, var(--ctp-red) 35%, transparent)",
  },
};

const STATUS_ACTIVE_STYLES: Record<string, React.CSSProperties> = {
  backlog: {
    backgroundColor: "color-mix(in srgb, var(--ctp-subtext1) 30%, transparent)",
    borderColor: "color-mix(in srgb, var(--ctp-subtext1) 55%, transparent)",
  },
  playing: {
    backgroundColor: "color-mix(in srgb, var(--ctp-teal) 35%, transparent)",
    borderColor: "color-mix(in srgb, var(--ctp-teal) 55%, transparent)",
  },
  finished: {
    backgroundColor: "color-mix(in srgb, var(--ctp-green) 35%, transparent)",
    borderColor: "color-mix(in srgb, var(--ctp-green) 55%, transparent)",
  },
  completed: {
    backgroundColor: "color-mix(in srgb, var(--ctp-green) 35%, transparent)",
    borderColor: "color-mix(in srgb, var(--ctp-green) 55%, transparent)",
  },
  dropped: {
    backgroundColor: "color-mix(in srgb, var(--ctp-red) 35%, transparent)",
    borderColor: "color-mix(in srgb, var(--ctp-red) 55%, transparent)",
  },
};

export function LibrarySidebar({
  filters,
  setFilter,
  viewMode,
  setViewMode,
  uniquePlatforms,
  uniqueStatuses,
  collections,
  onClearFilters,
  hasActiveFilters,
}: LibrarySidebarProps) {
  const { isCollapsed } = useSidebar();

  if (isCollapsed) {
    return (
      <div className="space-y-3 pt-3 border-t border-ctp-surface0">
        <div className="flex justify-center">
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

        {/* View Mode Icons */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg transition-all ${
              viewMode === "grid"
                ? "bg-ctp-mauve text-ctp-base"
                : "text-ctp-subtext0 hover:bg-ctp-surface0 hover:text-ctp-text"
            }`}
            title="Grid View"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`p-2 rounded-lg transition-all ${
              viewMode === "table"
                ? "bg-ctp-mauve text-ctp-base"
                : "text-ctp-subtext0 hover:bg-ctp-surface0 hover:text-ctp-text"
            }`}
            title="Table View"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        {/* Favorites Toggle */}
        <div className="flex justify-center pt-2 border-t border-ctp-surface0">
          <button
            onClick={() => setFilter("favorites", !filters.favorites)}
            className={`p-2 rounded-lg transition-all ${
              filters.favorites
                ? "bg-ctp-red/20 text-ctp-red"
                : "text-ctp-subtext0 hover:bg-ctp-surface0 hover:text-ctp-text"
            }`}
            title={filters.favorites ? "Showing Favorites Only" : "Show Favorites Only"}
          >
            <svg
              className="w-5 h-5"
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
          </button>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <div className="flex justify-center pt-2 border-t border-ctp-surface0">
            <button
              onClick={onClearFilters}
              className="p-2 rounded-lg text-ctp-subtext0 hover:bg-ctp-surface0 hover:text-ctp-text transition-all"
              title="Clear All Filters"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
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
          <button
            onClick={() => setViewMode("grid")}
            className={`flex-1 px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-center gap-2 ${
              viewMode === "grid"
                ? "bg-ctp-mauve border border-ctp-mauve text-ctp-base"
                : "bg-ctp-surface0 border border-ctp-surface1 text-ctp-subtext0 hover:text-ctp-text"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
            Grid
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`flex-1 px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-center gap-2 ${
              viewMode === "table"
                ? "bg-ctp-mauve border border-ctp-mauve text-ctp-base"
                : "bg-ctp-surface0 border border-ctp-surface1 text-ctp-subtext0 hover:text-ctp-text"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
              />
            </svg>
            Table
          </button>
        </div>
      </div>

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
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Status
        </h3>
        <div className="space-y-1">
          <button
            onClick={() => setFilter("status", "")}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
              filters.status === ""
                ? "bg-ctp-teal/20 text-ctp-teal"
                : "text-ctp-subtext0 hover:bg-ctp-surface0 hover:text-ctp-text"
            }`}
          >
            All Statuses
          </button>
          {uniqueStatuses.map((status) => (
            <button
              key={status}
              onClick={() => setFilter("status", status)}
              style={
                filters.status === status
                  ? STATUS_ACTIVE_STYLES[status] || undefined
                  : STATUS_BG_STYLES[status] || undefined
              }
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all text-ctp-text hover:opacity-90 ${
                filters.status === status ? "border" : ""
              }`}
            >
              {STATUS_LABELS[status] || status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

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
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          Platform
        </h3>
        <ScrollFade axis="y" className="space-y-1 max-h-48 overflow-y-auto">
          <button
            onClick={() => setFilter("platform", "")}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
              filters.platform === ""
                ? "bg-ctp-mauve/20 text-ctp-mauve"
                : "text-ctp-subtext0 hover:bg-ctp-surface0 hover:text-ctp-text"
            }`}
          >
            All Platforms
          </button>
          {uniquePlatforms.map((platform) => (
            <button
              key={platform}
              onClick={() => setFilter("platform", platform)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all truncate ${
                filters.platform === platform
                  ? "bg-ctp-mauve/20 text-ctp-mauve"
                  : "text-ctp-subtext0 hover:bg-ctp-surface0 hover:text-ctp-text"
              }`}
              title={platform}
            >
              {platform}
            </button>
          ))}
        </ScrollFade>
      </div>

      <FilterSection
        title="Genres"
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
            />
          </svg>
        }
        iconColor="text-ctp-peach"
        onClear={() => setFilter("genre", [])}
        hasSelection={filters.genre.length > 0}
      >
        <GenreFilter selectedGenres={filters.genre} onGenresChange={(g) => setFilter("genre", g)} />
      </FilterSection>

      <FilterSection
        title="Collections"
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        }
        iconColor="text-ctp-sapphire"
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
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
            />
          </svg>
        }
        iconColor="text-ctp-lavender"
        onClear={() => setFilter("franchise", [])}
        hasSelection={filters.franchise.length > 0}
      >
        <FranchiseFilter
          selectedFranchises={filters.franchise}
          onFranchisesChange={(f) => setFilter("franchise", f)}
        />
      </FilterSection>

      <div>
        <h3 className="text-xs font-semibold text-ctp-subtext0 uppercase tracking-wider mb-3 flex items-center gap-2">
          <svg
            className="w-4 h-4 text-ctp-red"
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
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-ctp-surface0 transition-colors">
          <Checkbox
            id="filters-favorites"
            checked={filters.favorites}
            onChange={(e) => setFilter("favorites", e.target.checked)}
          />
          <label htmlFor="filters-favorites" className="text-sm text-ctp-subtext1 cursor-pointer">
            Favorites Only
          </label>
        </div>
      </div>

      {hasActiveFilters && (
        <button
          onClick={onClearFilters}
          className="w-full px-3 py-2 bg-ctp-surface0 border border-ctp-surface1 text-ctp-subtext0 hover:text-ctp-text hover:border-ctp-surface2 rounded-lg transition-colors text-sm"
        >
          Clear All Filters
        </button>
      )}
    </div>
  );
}
