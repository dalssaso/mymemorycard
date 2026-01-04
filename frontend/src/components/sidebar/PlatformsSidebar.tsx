import { useSidebar } from '@/contexts/SidebarContext'

interface PlatformsSidebarProps {
  platformCount: number
  onAddCustomPlatform: () => void
}

export function PlatformsSidebar({ platformCount, onAddCustomPlatform }: PlatformsSidebarProps) {
  const { isCollapsed } = useSidebar()

  if (isCollapsed) {
    return (
      <div className="space-y-3 pt-3 border-t border-ctp-surface0">
        <div className="flex justify-center">
          <div
            className="w-10 h-10 rounded-lg bg-ctp-surface0/50 border border-ctp-surface0 flex items-center justify-center text-sm text-ctp-teal"
            title="Platforms Saved"
          >
            {platformCount}
          </div>
        </div>
        <div className="flex justify-center pt-2 border-t border-ctp-surface0">
          <button
            type="button"
            onClick={onAddCustomPlatform}
            className="p-2 rounded-lg text-ctp-teal hover:bg-ctp-surface0 hover:text-ctp-text transition-all"
            title="Add Custom Platform"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-ctp-surface0/40 border border-ctp-surface0 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-ctp-text mb-1">Manage Platforms</h3>
        <p className="text-xs text-ctp-subtext0">
          Keep your platform list current for accurate imports.
        </p>
        <div className="mt-3 text-sm text-ctp-teal">{platformCount} saved</div>
      </div>

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
          Tips
        </h3>
        <div className="space-y-3 text-sm text-ctp-subtext0">
          <div className="p-3 bg-ctp-surface0/50 rounded-lg">
            <p className="font-medium text-ctp-subtext1 mb-1">Add new platforms anytime</p>
            <p className="text-xs">
              Use the available list to add platforms as you expand your library.
            </p>
          </div>
          <div className="p-3 bg-ctp-surface0/50 rounded-lg">
            <p className="font-medium text-ctp-subtext1 mb-1">Keep notes updated</p>
            <p className="text-xs">Add usernames or links to help you remember account details.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
