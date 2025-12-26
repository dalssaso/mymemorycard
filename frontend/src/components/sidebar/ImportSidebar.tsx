interface Platform {
  id: string
  name: string
  display_name: string
}

interface ImportSidebarProps {
  platforms: Platform[]
  selectedPlatform: string
  onPlatformSelect: (platformId: string) => void
  isImporting?: boolean
}

export function ImportSidebar({
  platforms,
  selectedPlatform,
  onPlatformSelect,
  isImporting,
}: ImportSidebarProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Quick Platform Select
        </h3>
        <div className="space-y-1">
          {platforms.map((platform) => (
            <button
              key={platform.id}
              onClick={() => onPlatformSelect(platform.id)}
              disabled={isImporting}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all disabled:opacity-50 ${
                selectedPlatform === platform.id
                  ? 'bg-primary-purple/20 text-primary-purple border border-primary-purple/30'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              {platform.display_name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Import Tips
        </h3>
        <div className="space-y-3 text-sm text-gray-400">
          <div className="p-3 bg-gray-800/50 rounded-lg">
            <p className="font-medium text-gray-300 mb-1">One game per line</p>
            <p className="text-xs">
              Enter each game name on its own line for best results.
            </p>
          </div>
          <div className="p-3 bg-gray-800/50 rounded-lg">
            <p className="font-medium text-gray-300 mb-1">Use official names</p>
            <p className="text-xs">
              "The Witcher 3: Wild Hunt" works better than "Witcher 3".
            </p>
          </div>
          <div className="p-3 bg-gray-800/50 rounded-lg">
            <p className="font-medium text-gray-300 mb-1">Review matches</p>
            <p className="text-xs">
              If a game isn't matched exactly, you'll be able to pick from candidates.
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Data Source
        </h3>
        <div className="p-3 bg-gray-800/50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 bg-primary-purple rounded flex items-center justify-center">
              <span className="text-xs font-bold">R</span>
            </div>
            <span className="text-sm text-gray-300">RAWG.io</span>
          </div>
          <p className="text-xs text-gray-500">
            Games are enriched with metadata from RAWG including cover art, descriptions, ratings,
            and release dates.
          </p>
        </div>
      </div>
    </div>
  )
}
