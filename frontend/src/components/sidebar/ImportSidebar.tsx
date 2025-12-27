import { Link } from '@tanstack/react-router'

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
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
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
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
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
              d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
            />
          </svg>
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
