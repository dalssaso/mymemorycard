interface LibrarySidebarProps {
  platformFilter: string
  setPlatformFilter: (value: string) => void
  statusFilter: string
  setStatusFilter: (value: string) => void
  favoritesOnly: boolean
  setFavoritesOnly: (value: boolean) => void
  viewMode: 'grid' | 'table'
  setViewMode: (value: 'grid' | 'table') => void
  uniquePlatforms: string[]
  uniqueStatuses: string[]
  onClearFilters: () => void
  hasActiveFilters: boolean
}

const STATUS_LABELS: Record<string, string> = {
  backlog: 'Backlog',
  playing: 'Playing',
  finished: 'Finished',
  completed: 'Completed',
  dropped: 'Dropped',
}

export function LibrarySidebar({
  platformFilter,
  setPlatformFilter,
  statusFilter,
  setStatusFilter,
  favoritesOnly,
  setFavoritesOnly,
  viewMode,
  setViewMode,
  uniquePlatforms,
  uniqueStatuses,
  onClearFilters,
  hasActiveFilters,
}: LibrarySidebarProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          View
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm transition-all ${
              viewMode === 'grid'
                ? 'bg-primary-purple border border-purple-500 text-white'
                : 'bg-gray-800 border border-gray-700 text-gray-400 hover:text-white'
            }`}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm transition-all ${
              viewMode === 'table'
                ? 'bg-primary-purple border border-purple-500 text-white'
                : 'bg-gray-800 border border-gray-700 text-gray-400 hover:text-white'
            }`}
          >
            Table
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Status
        </h3>
        <div className="space-y-1">
          <button
            onClick={() => setStatusFilter('')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
              statusFilter === ''
                ? 'bg-primary-cyan/20 text-primary-cyan'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            All Statuses
          </button>
          {uniqueStatuses.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                statusFilter === status
                  ? 'bg-primary-cyan/20 text-primary-cyan'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              {STATUS_LABELS[status] || status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Platform
        </h3>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          <button
            onClick={() => setPlatformFilter('')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
              platformFilter === ''
                ? 'bg-primary-purple/20 text-primary-purple'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            All Platforms
          </button>
          {uniquePlatforms.map((platform) => (
            <button
              key={platform}
              onClick={() => setPlatformFilter(platform)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all truncate ${
                platformFilter === platform
                  ? 'bg-primary-purple/20 text-primary-purple'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
              title={platform}
            >
              {platform}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Filters
        </h3>
        <label className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors">
          <input
            type="checkbox"
            checked={favoritesOnly}
            onChange={(e) => setFavoritesOnly(e.target.checked)}
            className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-red-500 focus:ring-2 focus:ring-red-500"
          />
          <span className="text-sm text-gray-300">Favorites Only</span>
        </label>
      </div>

      {hasActiveFilters && (
        <button
          onClick={onClearFilters}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 rounded-lg transition-colors text-sm"
        >
          Clear All Filters
        </button>
      )}
    </div>
  )
}
