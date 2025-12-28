import { Link } from '@tanstack/react-router'
import { useSidebar } from '@/contexts/SidebarContext'

interface PlatformOnboardingSidebarProps {
  selectedCount: number
  onAddCustomPlatform: () => void
}

export function PlatformOnboardingSidebar({
  selectedCount,
  onAddCustomPlatform,
}: PlatformOnboardingSidebarProps) {
  const { isCollapsed } = useSidebar()

  if (isCollapsed) {
    return (
      <div className="space-y-3 pt-3 border-t border-gray-800">
        <div className="flex justify-center">
          <div
            className="w-10 h-10 rounded-lg bg-gray-800/50 border border-gray-800 flex items-center justify-center text-sm text-primary-cyan"
            title="Platforms Selected"
          >
            {selectedCount}
          </div>
        </div>

        <div className="flex justify-center pt-2 border-t border-gray-800">
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

        <div className="flex flex-col items-center gap-1 pt-2 border-t border-gray-800">
          <button
            type="button"
            onClick={onAddCustomPlatform}
            className="p-2 rounded-lg text-primary-cyan hover:bg-gray-800 hover:text-white transition-all"
            title="Add Custom Platform"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <Link
            to="/import"
            className="p-2 rounded-lg text-primary-purple hover:bg-gray-800 hover:text-white transition-all"
            title="Go to Import"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-800/40 border border-gray-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-white mb-1">Platform Setup</h3>
        <p className="text-xs text-gray-400">
          Choose the platforms you use before importing games.
        </p>
        <div className="mt-3 text-sm text-primary-cyan">
          {selectedCount} selected
        </div>
      </div>

      <Link
        to="/platforms"
        className={[
          'flex items-center justify-center gap-2 w-full px-4 py-2.5',
          'bg-gray-800 hover:bg-gray-700 text-white',
          'rounded-lg transition-colors font-medium',
        ].join(' ')}
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

      <button
        type="button"
        onClick={onAddCustomPlatform}
        className={[
          'flex items-center justify-center gap-2 w-full px-4 py-2.5',
          'bg-primary-cyan/20 hover:bg-primary-cyan/30 text-primary-cyan',
          'rounded-lg transition-colors font-medium',
        ].join(' ')}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Custom Platform
      </button>

      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Steps
        </h3>
        <div className="space-y-3 text-sm text-gray-400">
          <div className="p-3 bg-gray-800/50 rounded-lg">
            <p className="font-medium text-gray-300 mb-1">1. Pick platforms</p>
            <p className="text-xs">Select the stores or systems you use.</p>
          </div>
          <div className="p-3 bg-gray-800/50 rounded-lg">
            <p className="font-medium text-gray-300 mb-1">2. Save selection</p>
            <p className="text-xs">You can add more platforms later.</p>
          </div>
          <div className="p-3 bg-gray-800/50 rounded-lg">
            <p className="font-medium text-gray-300 mb-1">3. Import games</p>
            <p className="text-xs">Head to import and bring in your library.</p>
          </div>
        </div>
      </div>

      <Link
        to="/import"
        className={[
          'flex items-center justify-center gap-2 w-full px-4 py-2.5',
          'bg-primary-purple hover:bg-primary-purple/80 text-white',
          'rounded-lg transition-colors font-medium',
        ].join(' ')}
      >
        Go to Import
      </Link>
    </div>
  )
}
