import { useSidebar } from '@/contexts/SidebarContext'

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
  const { isCollapsed } = useSidebar()

  if (isCollapsed) {
    return (
      <div className="space-y-3 pt-3 border-t border-gray-800">
        {/* View Mode Icons */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-all ${
              viewMode === 'grid'
                ? 'bg-primary-purple text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
            title="Grid View"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-lg transition-all ${
              viewMode === 'table'
                ? 'bg-primary-purple text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
            title="Table View"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Favorites Toggle */}
        <div className="flex justify-center pt-2 border-t border-gray-800">
          <button
            onClick={() => setFavoritesOnly(!favoritesOnly)}
            className={`p-2 rounded-lg transition-all ${
              favoritesOnly
                ? 'bg-red-500/20 text-red-400'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
            title={favoritesOnly ? 'Showing Favorites Only' : 'Show Favorites Only'}
          >
            <svg className="w-5 h-5" fill={favoritesOnly ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <div className="flex justify-center pt-2 border-t border-gray-800">
            <button
              onClick={onClearFilters}
              className="p-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-all"
              title="Clear All Filters"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          View
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-center gap-2 ${
              viewMode === 'grid'
                ? 'bg-primary-purple border border-purple-500 text-white'
                : 'bg-gray-800 border border-gray-700 text-gray-400 hover:text-white'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Grid
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-center gap-2 ${
              viewMode === 'table'
                ? 'bg-primary-purple border border-purple-500 text-white'
                : 'bg-gray-800 border border-gray-700 text-gray-400 hover:text-white'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
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
