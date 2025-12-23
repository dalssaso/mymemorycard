import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { gamesAPI } from '@/lib/api'
import { PageLayout } from '@/components/layout'
import { Card } from '@/components/ui'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { useMemo } from 'react'

const STATUS_COLORS = {
  backlog: '#71717A',
  playing: '#06B6D4',
  finished: '#10B981',
  completed: '#F59E0B',
  dropped: '#EF4444',
}

const PLATFORM_COLORS = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#EC4899']
const GENRE_COLORS = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#F472B6', '#A78BFA', '#34D399', '#FBBF24']

export function Dashboard() {
  const { data } = useQuery({
    queryKey: ['games'],
    queryFn: async () => {
      const response = await gamesAPI.getAll()
      return response.data as { games: any[] }
    },
  })

  const { data: genreData } = useQuery({
    queryKey: ['genreStats'],
    queryFn: async () => {
      const response = await gamesAPI.getGenreStats()
      return response.data as { genres: Array<{ name: string; count: number }> }
    },
  })

  const games = data?.games || []
  const totalGames = games.length
  const inProgressGames = games.filter((g) => g.status === 'playing').length
  const completedGames = games.filter((g) => g.status === 'completed' || g.status === 'finished').length
  const backlogGames = games.filter((g) => g.status === 'backlog').length
  const favoriteGames = games.filter((g) => g.is_favorite === true)

  // Status distribution data
  const statusData = useMemo(() => {
    const statusCounts = games.reduce((acc, game) => {
      const status = game.status || 'backlog'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(statusCounts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: STATUS_COLORS[name as keyof typeof STATUS_COLORS] || '#71717A',
    }))
  }, [games])

  // Platform distribution data
  const platformData = useMemo(() => {
    const platformCounts = games.reduce((acc, game) => {
      const platform = game.platform_display_name || 'Unknown'
      acc[platform] = (acc[platform] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(platformCounts).map(([name, value], index) => ({
      name,
      value,
      color: PLATFORM_COLORS[index % PLATFORM_COLORS.length],
    }))
  }, [games])

  // Genre distribution data
  const genreChartData = useMemo(() => {
    if (!genreData?.genres) return []
    return genreData.genres.map((genre, index) => ({
      name: genre.name,
      value: genre.count,
      color: GENRE_COLORS[index % GENRE_COLORS.length],
    }))
  }, [genreData])

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

        {/* Data Visualizations */}
        {totalGames > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Status Distribution */}
            <Card>
              <h2 className="text-2xl font-bold text-primary-purple mb-4">Status Distribution</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #3f3f46',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Legend
                    wrapperStyle={{ color: '#a1a1aa' }}
                    formatter={(value) => <span style={{ color: '#a1a1aa' }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            {/* Platform Distribution */}
            <Card>
              <h2 className="text-2xl font-bold text-primary-purple mb-4">Platform Distribution</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={platformData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {platformData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #3f3f46',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Legend
                    wrapperStyle={{ color: '#a1a1aa' }}
                    formatter={(value) => <span style={{ color: '#a1a1aa' }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            {/* Genre Distribution */}
            {genreChartData.length > 0 && (
              <Card>
                <h2 className="text-2xl font-bold text-primary-purple mb-4">Top Genres</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={genreChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {genreChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #3f3f46',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                    />
                    <Legend
                      wrapperStyle={{ color: '#a1a1aa' }}
                      formatter={(value) => <span style={{ color: '#a1a1aa' }}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            )}
          </div>
        )}

        {/* Favorites Section */}
        {favoriteGames.length > 0 && (
          <Card className="mb-6 bg-red-950/20 border-red-500/30">
            <h2 className="text-2xl font-bold text-red-400 mb-4">Favorites</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {favoriteGames
                .slice(0, 6)
                .map((game) => (
                  <Link
                    key={game.id}
                    to="/library/$id"
                    params={{ id: game.id }}
                    className="group relative"
                  >
                    <div className="aspect-[3/4] rounded-lg overflow-hidden bg-gray-800 relative">
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
                      <div className="absolute top-2 right-2 text-xl">❤️</div>
                    </div>
                    <p className="mt-2 text-sm text-gray-300 truncate group-hover:text-white">
                      {game.name}
                    </p>
                  </Link>
                ))}
            </div>
          </Card>
        )}

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
