import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { franchisesAPI, collectionsAPI, FranchiseSummary } from '@/lib/api'
import { useAnimatedNumber } from '@/hooks/use-animated-number'

interface Collection {
  id: string
  name: string
  game_count: number
}

interface FranchisesSidebarProps {
  onSync?: () => void
  isSyncing?: boolean
}

export function FranchisesSidebar({ onSync, isSyncing }: FranchisesSidebarProps) {
  const { data: franchisesData } = useQuery({
    queryKey: ['franchises'],
    queryFn: async () => {
      const response = await franchisesAPI.getAll()
      return response.data
    },
    refetchOnMount: 'always',
  })

  const { data: collectionsData } = useQuery({
    queryKey: ['collections'],
    queryFn: async () => {
      const response = await collectionsAPI.getAll()
      return response.data as { collections: Collection[] }
    },
    refetchOnMount: 'always',
  })

  const franchises = franchisesData?.franchises || []
  const collections = collectionsData?.collections || []

  const stats = useMemo(() => {
    const totalFranchises = franchises.length
    const totalCollections = collections.length

    return { totalFranchises, totalCollections }
  }, [franchises, collections])
  const animatedFranchises = useAnimatedNumber(stats.totalFranchises)
  const animatedCollections = useAnimatedNumber(stats.totalCollections)

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

      {/* Quick Stats */}
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
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          Quick Stats
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm px-2 py-1.5 rounded hover:bg-gray-800 transition-colors">
            <div className="flex items-center gap-2">
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
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
              <span className="text-gray-400">Franchises</span>
            </div>
            <span className="text-primary-purple font-medium min-w-[2rem] text-right">
              {animatedFranchises}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm px-2 py-1.5 rounded hover:bg-gray-800 transition-colors">
            <div className="flex items-center gap-2">
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
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              <span className="text-gray-400">Collections</span>
            </div>
            <span className="text-primary-cyan font-medium min-w-[2rem] text-right">
              {animatedCollections}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
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
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          Quick Actions
        </h3>
        {onSync && (
          <button
            onClick={onSync}
            disabled={isSyncing}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <svg
              className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {isSyncing ? 'Syncing...' : 'Sync Franchises'}
          </button>
        )}
        <Link
          to="/collections"
          className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-all flex items-center gap-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8"
            />
          </svg>
          View Collections
        </Link>
      </div>

      {/* Top Franchises */}
      {franchises.length > 0 && (
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
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
            Top Franchises
          </h3>
          <div className="space-y-1">
            {franchises
              .slice()
              .sort((a: FranchiseSummary, b: FranchiseSummary) => b.game_count - a.game_count)
              .slice(0, 5)
              .map((franchise: FranchiseSummary) => (
                <Link
                  key={franchise.series_name}
                  to="/franchises/$seriesName"
                  params={{ seriesName: franchise.series_name }}
                  className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-800 transition-colors group"
                >
                  {franchise.cover_art_url ? (
                    <img
                      src={franchise.cover_art_url}
                      alt={franchise.series_name}
                      className="w-8 h-10 object-cover rounded"
                    />
                  ) : (
                    <div className="w-8 h-10 bg-primary-purple/20 rounded flex items-center justify-center">
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
                          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z"
                        />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-300 truncate group-hover:text-white">
                      {franchise.series_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {franchise.game_count} {franchise.game_count === 1 ? 'game' : 'games'}
                    </p>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      )}

      {/* Collections */}
      {collections.length > 0 && (
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
                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8"
              />
            </svg>
            Collections
          </h3>
          <div className="space-y-1">
            {collections.slice(0, 5).map((collection) => (
              <Link
                key={collection.id}
                to="/collections/$id"
                params={{ id: collection.id }}
                className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-800 transition-colors group"
              >
                <div className="w-8 h-8 bg-primary-cyan/20 rounded flex items-center justify-center">
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
                      d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-300 truncate group-hover:text-white">
                    {collection.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {collection.game_count} {collection.game_count === 1 ? 'game' : 'games'}
                  </p>
                </div>
              </Link>
            ))}
            {collections.length > 5 && (
              <Link
                to="/collections"
                className="text-xs text-primary-cyan hover:text-primary-cyan/80 transition-colors block px-2 py-1"
              >
                View all {collections.length} collections
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
