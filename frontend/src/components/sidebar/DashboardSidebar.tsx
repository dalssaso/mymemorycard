import { Link, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useCallback } from 'react'
import { collectionsAPI, franchisesAPI, FranchiseSummary } from '@/lib/api'

interface Game {
  id: string
  name: string
  cover_art_url: string | null
  last_played: string | null
  status: string
  is_favorite?: boolean
}

interface DashboardSidebarProps {
  games: Game[]
}

interface Collection {
  id: string
  name: string
  game_count: number
}

export function DashboardSidebar({ games }: DashboardSidebarProps) {
  const navigate = useNavigate()

  const navigateToLibrary = useCallback(
    (params: { status?: string; favorites?: boolean }) => {
      navigate({
        to: '/library' as const,
        search: params as Record<string, string | boolean | undefined>,
      })
    },
    [navigate]
  )

  const { data: collectionsData } = useQuery({
    queryKey: ['collections'],
    queryFn: async () => {
      const response = await collectionsAPI.getAll()
      return response.data as { collections: Collection[] }
    },
  })

  const { data: franchisesData } = useQuery({
    queryKey: ['franchises'],
    queryFn: async () => {
      const response = await franchisesAPI.getAll()
      return response.data
    },
  })

  const collections = collectionsData?.collections || []
  const franchises = franchisesData?.franchises || []

  const recentlyPlayed = useMemo(() => {
    return games
      .filter((g) => g.last_played)
      .sort(
        (a, b) =>
          new Date(b.last_played!).getTime() - new Date(a.last_played!).getTime()
      )
      .slice(0, 5)
  }, [games])

  const stats = useMemo(() => {
    const total = games.length
    const playing = games.filter((g) => g.status === 'playing').length
    const completed = games.filter(
      (g) => g.status === 'completed' || g.status === 'finished'
    ).length
    const backlog = games.filter((g) => g.status === 'backlog').length
    const dropped = games.filter((g) => g.status === 'dropped').length
    const favorites = games.filter((g) => g.is_favorite).length

    return { total, playing, completed, backlog, dropped, favorites }
  }, [games])

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

      {/* Quick Stats - Clickable */}
      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Quick Stats
        </h3>
        <div className="space-y-2">
          <button
            onClick={() => navigateToLibrary({})}
            className="flex items-center justify-between text-sm w-full px-2 py-1.5 rounded hover:bg-gray-800 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-gray-500"
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
              <span className="text-gray-400">Total Games</span>
            </div>
            <span className="text-white font-medium min-w-[2rem] text-right">{stats.total}</span>
          </button>

          <button
            onClick={() => navigateToLibrary({ status: 'playing' })}
            className="flex items-center justify-between text-sm w-full px-2 py-1.5 rounded hover:bg-gray-800 transition-colors text-left"
          >
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
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-gray-400">Playing</span>
            </div>
            <span className="text-primary-cyan font-medium min-w-[2rem] text-right">{stats.playing}</span>
          </button>

          <button
            onClick={() => navigateToLibrary({ status: 'completed' })}
            className="flex items-center justify-between text-sm w-full px-2 py-1.5 rounded hover:bg-gray-800 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-gray-400">Completed</span>
            </div>
            <span className="text-primary-green font-medium min-w-[2rem] text-right">{stats.completed}</span>
          </button>

          <button
            onClick={() => navigateToLibrary({ status: 'backlog' })}
            className="flex items-center justify-between text-sm w-full px-2 py-1.5 rounded hover:bg-gray-800 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-gray-400">Backlog</span>
            </div>
            <span className="text-gray-300 font-medium min-w-[2rem] text-right">{stats.backlog}</span>
          </button>

          <button
            onClick={() => navigateToLibrary({ status: 'dropped' })}
            className="flex items-center justify-between text-sm w-full px-2 py-1.5 rounded hover:bg-gray-800 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
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
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                />
              </svg>
              <span className="text-gray-400">Dropped</span>
            </div>
            <span className="text-red-400 font-medium min-w-[2rem] text-right">{stats.dropped}</span>
          </button>

          <button
            onClick={() => navigateToLibrary({ favorites: true })}
            className="flex items-center justify-between text-sm w-full px-2 py-1.5 rounded hover:bg-gray-800 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              <span className="text-gray-400">Favorites</span>
            </div>
            <span className="text-red-400 font-medium min-w-[2rem] text-right">{stats.favorites}</span>
          </button>
        </div>
      </div>

      {/* Completion Progress */}
      {stats.total > 0 && (
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
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            Progress
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-400">Completion Rate</span>
                <span className="text-primary-green font-medium">
                  {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-primary-green h-2 rounded-full transition-all"
                  style={{
                    width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-400">Drop Rate</span>
                <span className="text-red-400 font-medium">
                  {stats.total > 0 ? Math.round((stats.dropped / stats.total) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-red-400 h-2 rounded-full transition-all"
                  style={{
                    width: `${stats.total > 0 ? (stats.dropped / stats.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Franchises */}
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
            Franchises
          </h3>
          <div className="space-y-1">
            {franchises.slice(0, 5).map((franchise: FranchiseSummary) => (
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
            {franchises.length > 5 && (
              <Link
                to="/franchises"
                className="text-xs text-primary-purple hover:text-primary-purple/80 transition-colors block px-2 py-1"
              >
                View all {franchises.length} franchises
              </Link>
            )}
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
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
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

      {/* Recently Played */}
      {recentlyPlayed.length > 0 && (
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
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Recently Played
          </h3>
          <div className="space-y-2">
            {recentlyPlayed.map((game) => (
              <Link
                key={game.id}
                to="/library/$id"
                params={{ id: game.id }}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 transition-colors group"
              >
                {game.cover_art_url ? (
                  <img
                    src={game.cover_art_url}
                    alt={game.name}
                    className="w-10 h-14 object-cover rounded"
                  />
                ) : (
                  <div className="w-10 h-14 bg-gray-700 rounded flex items-center justify-center">
                    <span className="text-gray-500 text-xs">?</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-300 truncate group-hover:text-white">
                    {game.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(game.last_played!).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
