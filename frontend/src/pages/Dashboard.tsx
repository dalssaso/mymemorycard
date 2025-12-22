import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { gamesAPI } from '@/lib/api'
import { PageLayout } from '@/components/layout'
import { Card } from '@/components/ui'

export function Dashboard() {
  const { data } = useQuery({
    queryKey: ['games'],
    queryFn: async () => {
      const response = await gamesAPI.getAll()
      return response.data as { games: any[] }
    },
  })

  const games = data?.games || []
  const totalGames = games.length
  const inProgressGames = games.filter((g) => g.status === 'playing').length
  const completedGames = games.filter((g) => g.status === 'completed' || g.status === 'finished').length
  const backlogGames = games.filter((g) => g.status === 'backlog').length

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">
          Dashboard
        </h1>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-primary-purple/10 border-primary-purple/30">
            <h3 className="text-gray-400 text-sm mb-2">Total Games</h3>
            <p className="text-3xl font-bold text-white">{totalGames}</p>
          </Card>
          
          <Card className="bg-primary-cyan/10 border-primary-cyan/30">
            <h3 className="text-gray-400 text-sm mb-2">Currently Playing</h3>
            <p className="text-3xl font-bold text-primary-cyan">{inProgressGames}</p>
          </Card>
          
          <Card className="bg-primary-green/10 border-primary-green/30">
            <h3 className="text-gray-400 text-sm mb-2">Completed</h3>
            <p className="text-3xl font-bold text-primary-green">{completedGames}</p>
          </Card>

          <Card className="bg-gray-700/30 border-gray-600/30">
            <h3 className="text-gray-400 text-sm mb-2">Backlog</h3>
            <p className="text-3xl font-bold text-gray-300">{backlogGames}</p>
          </Card>
        </div>

        {/* Currently Playing Section */}
        {inProgressGames > 0 && (
          <Card className="mb-6">
            <h2 className="text-2xl font-bold text-primary-purple mb-4">Currently Playing</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {games
                .filter((g) => g.status === 'playing')
                .slice(0, 6)
                .map((game) => (
                  <Link
                    key={game.id}
                    to="/library/$id"
                    params={{ id: game.id }}
                    className="group"
                  >
                    <div className="aspect-[3/4] rounded-lg overflow-hidden bg-gray-800">
                      {game.cover_art_url ? (
                        <img
                          src={game.cover_art_url}
                          alt={game.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                          No Cover
                        </div>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-gray-300 truncate group-hover:text-white">
                      {game.name}
                    </p>
                  </Link>
                ))}
            </div>
          </Card>
        )}

        {/* Quick Actions */}
        {totalGames === 0 ? (
          <Card>
            <h2 className="text-2xl font-bold mb-4">Get Started</h2>
            <p className="text-gray-400 mb-4">
              Import your games to start tracking your library
            </p>
            <Link
              to="/import"
              className="inline-block px-6 py-3 bg-primary-purple text-white rounded-lg hover:bg-primary-purple/80 transition-colors"
            >
              Import Games
            </Link>
          </Card>
        ) : (
          <Card>
            <h2 className="text-2xl font-bold text-primary-purple mb-4">Quick Actions</h2>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/library"
                className="px-6 py-3 bg-primary-purple text-white rounded-lg hover:bg-primary-purple/80 transition-colors"
              >
                View Library
              </Link>
              <Link
                to="/import"
                className="px-6 py-3 bg-primary-cyan text-white rounded-lg hover:bg-primary-cyan/80 transition-colors"
              >
                Import More Games
              </Link>
            </div>
          </Card>
        )}
      </div>
    </PageLayout>
  )
}
