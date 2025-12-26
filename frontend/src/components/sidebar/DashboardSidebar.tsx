import { Link } from '@tanstack/react-router'
import { useMemo } from 'react'

interface Game {
  id: string
  name: string
  cover_art_url: string | null
  last_played: string | null
  status: string
}

interface DashboardSidebarProps {
  games: Game[]
}

export function DashboardSidebar({ games }: DashboardSidebarProps) {
  const recentlyPlayed = useMemo(() => {
    return games
      .filter((g) => g.last_played)
      .sort(
        (a, b) =>
          new Date(b.last_played!).getTime() - new Date(a.last_played!).getTime()
      )
      .slice(0, 5)
  }, [games])

  const backlogGames = useMemo(() => {
    return games.filter((g) => g.status === 'backlog')
  }, [games])

  const handleRandomPick = () => {
    if (backlogGames.length === 0) return
    const randomIndex = Math.floor(Math.random() * backlogGames.length)
    const randomGame = backlogGames[randomIndex]
    window.location.href = `/library/${randomGame.id}`
  }

  return (
    <div className="space-y-6">
      {recentlyPlayed.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
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

      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Quick Actions
        </h3>
        <div className="space-y-2">
          <Link
            to="/import"
            className="flex items-center gap-2 w-full px-3 py-2 bg-primary-cyan/20 border border-primary-cyan/30 text-primary-cyan hover:bg-primary-cyan/30 rounded-lg transition-colors text-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            Import Games
          </Link>

          {backlogGames.length > 0 && (
            <button
              onClick={handleRandomPick}
              className="flex items-center gap-2 w-full px-3 py-2 bg-primary-purple/20 border border-primary-purple/30 text-primary-purple hover:bg-primary-purple/30 rounded-lg transition-colors text-sm"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.678 48.678 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 0 0 3.7 3.7 48.656 48.656 0 0 0 7.324 0 4.006 4.006 0 0 0 3.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3-3 3"
                />
              </svg>
              Random Backlog Pick
            </button>
          )}
        </div>
      </div>

      {games.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Completion Stats
          </h3>
          <div className="space-y-3">
            {(() => {
              const completed = games.filter(
                (g) => g.status === 'completed' || g.status === 'finished'
              ).length
              const total = games.length
              const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

              return (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Completion Rate</span>
                    <span className="text-primary-green font-medium">{percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-primary-green h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
