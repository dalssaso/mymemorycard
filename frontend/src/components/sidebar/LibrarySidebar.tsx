import { Link } from '@tanstack/react-router'
import { useSidebar } from '@/contexts/SidebarContext'
import { Checkbox } from '@/components/ui'

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
        <div className="flex justify-center">
          <Link
            to="/platforms"
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-all"
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
      {/* Import Games Button */}
      <Link
        to="/import"
        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-primary-purple hover:bg-primary-purple/80 text-white rounded-lg transition-colors font-medium"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Import Games
      </Link>
      <Link
        to="/platforms"
        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium"
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
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <svg
            className="w-4 h-4 text-primary-purple"
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
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <svg
            className="w-4 h-4 text-primary-cyan"
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
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <svg
            className="w-4 h-4 text-primary-green"
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
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <svg
            className="w-4 h-4 text-red-400"
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
        <label className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors">
          <Checkbox
            checked={favoritesOnly}
            onChange={(e) => setFavoritesOnly(e.target.checked)}
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
