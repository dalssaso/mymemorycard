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
      <div className="space-y-3 pt-3 border-t border-ctp-surface0">
        <div className="flex justify-center">
          <div
            className="w-10 h-10 rounded-lg bg-ctp-surface0/50 border border-ctp-surface0 flex items-center justify-center text-sm text-ctp-teal"
            title="Platforms Selected"
          >
            {selectedCount}
          </div>
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

        <div className="flex flex-col items-center gap-1 pt-2 border-t border-ctp-surface0">
          <button
            type="button"
            onClick={onAddCustomPlatform}
            className="p-2 rounded-lg text-ctp-teal hover:bg-ctp-surface0 hover:text-ctp-text transition-all"
            title="Add Custom Platform"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <Link
            to="/import"
            className="p-2 rounded-lg text-ctp-mauve hover:bg-ctp-surface0 hover:text-ctp-text transition-all"
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
      <div className="bg-ctp-surface0/40 border border-ctp-surface0 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-ctp-text mb-1">Platform Setup</h3>
        <p className="text-xs text-ctp-subtext0">
          Choose the platforms you use before importing games.
        </p>
        <div className="mt-3 text-sm text-ctp-teal">
          {selectedCount} selected
        </div>
      </div>

      <Link
        to="/platforms"
        className={[
          'flex items-center justify-center gap-2 w-full px-4 py-2.5',
          'bg-ctp-surface0 hover:bg-ctp-surface1 text-ctp-text',
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
          'bg-ctp-teal/20 hover:bg-ctp-teal/30 text-ctp-teal',
          'rounded-lg transition-colors font-medium',
        ].join(' ')}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Custom Platform
      </button>

      <div>
        <h3 className="text-xs font-semibold text-ctp-subtext0 uppercase tracking-wider mb-3">
          Steps
        </h3>
        <div className="space-y-3 text-sm text-ctp-subtext0">
          <div className="p-3 bg-ctp-surface0/50 rounded-lg">
            <p className="font-medium text-ctp-subtext1 mb-1">1. Pick platforms</p>
            <p className="text-xs">Select the stores or systems you use.</p>
          </div>
          <div className="p-3 bg-ctp-surface0/50 rounded-lg">
            <p className="font-medium text-ctp-subtext1 mb-1">2. Save selection</p>
            <p className="text-xs">You can add more platforms later.</p>
          </div>
          <div className="p-3 bg-ctp-surface0/50 rounded-lg">
            <p className="font-medium text-ctp-subtext1 mb-1">3. Import games</p>
            <p className="text-xs">Head to import and bring in your library.</p>
          </div>
        </div>
      </div>

      <Link
        to="/import"
        className={[
          'flex items-center justify-center gap-2 w-full px-4 py-2.5',
          'bg-ctp-mauve hover:bg-ctp-mauve/80 text-ctp-base',
          'rounded-lg transition-colors font-medium',
        ].join(' ')}
      >
        Go to Import
      </Link>
    </div>
  )
}
