import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { gamesAPI } from '@/lib/api'
import { PageLayout } from '@/components/layout'
import { Card } from '@/components/ui'
import { DashboardSidebar } from '@/components/sidebar'
import { ActivityHeatmap } from '@/components/ActivityHeatmap'
import { ActivityFeed } from '@/components/ActivityFeed'
import { AchievementWidget } from '@/components/AchievementWidget'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { useMemo, useState, useCallback } from 'react'

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
  const navigate = useNavigate()
  const [heatmapType, setHeatmapType] = useState<'activity' | 'completion' | 'achievement'>('activity')

  const navigateToLibrary = useCallback((params: { status?: string; platform?: string; genre?: string; favorites?: boolean }) => {
    navigate({ to: '/library' as const, search: params as Record<string, string | boolean | undefined> })
  }, [navigate])

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

  const currentlyPlayingRecent = useMemo(() => {
    return games
      .filter((g) => g.status === 'playing')
      .sort((a, b) => {
        if (a.last_played && b.last_played) {
          return new Date(b.last_played).getTime() - new Date(a.last_played).getTime()
        }
        if (a.last_played) return -1
        if (b.last_played) return 1
        return 0
      })
      .slice(0, 10)
  }, [games])

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
    <PageLayout sidebar={<DashboardSidebar games={games} />}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-white">Dashboard</h1>
          <div className="flex gap-3">
            <Link
              to="/import"
              className="flex items-center gap-2 px-4 py-2 bg-primary-purple text-white rounded-lg hover:bg-primary-purple/80 transition-colors"
            >
              <span className="material-symbols-outlined text-xl">download</span>
              Import Games
            </Link>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card 
            className="bg-primary-purple/10 border-primary-purple/30 cursor-pointer hover:bg-primary-purple/20 transition-colors"
            onClick={() => navigateToLibrary({})}
          >
            <h3 className="text-gray-400 text-sm mb-2">Total Games</h3>
            <p className="text-3xl font-bold text-white">{totalGames}</p>
          </Card>
          
          <Card 
            className="bg-primary-cyan/10 border-primary-cyan/30 cursor-pointer hover:bg-primary-cyan/20 transition-colors"
            onClick={() => navigateToLibrary({ status: 'playing' })}
          >
            <h3 className="text-gray-400 text-sm mb-2">Currently Playing</h3>
            <p className="text-3xl font-bold text-primary-cyan">{inProgressGames}</p>
          </Card>
          
          <Card 
            className="bg-primary-green/10 border-primary-green/30 cursor-pointer hover:bg-primary-green/20 transition-colors"
            onClick={() => navigateToLibrary({ status: 'completed' })}
          >
            <h3 className="text-gray-400 text-sm mb-2">Completed</h3>
            <p className="text-3xl font-bold text-primary-green">{completedGames}</p>
          </Card>

          <Card 
            className="bg-gray-700/30 border-gray-600/30 cursor-pointer hover:bg-gray-700/50 transition-colors"
            onClick={() => navigateToLibrary({ status: 'backlog' })}
          >
            <h3 className="text-gray-400 text-sm mb-2">Backlog</h3>
            <p className="text-3xl font-bold text-gray-300">{backlogGames}</p>
          </Card>
        </div>

        {/* Currently Playing Carousel */}
        {currentlyPlayingRecent.length > 0 && (
          <Card className="mb-8 bg-primary-cyan/5 border-primary-cyan/20">
            <h2 className="text-2xl font-bold text-primary-cyan mb-4">Currently Playing</h2>
            <div className="relative">
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                {currentlyPlayingRecent.map((game) => (
                  <Link
                    key={game.id}
                    to="/library/$id"
                    params={{ id: game.id }}
                    className="group flex-shrink-0"
                  >
                    <div className="w-32 aspect-[3/4] rounded-lg overflow-hidden bg-gray-800 relative">
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
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="mt-2 text-sm text-gray-300 truncate w-32 group-hover:text-white">
                      {game.name}
                    </p>
                    {game.last_played && (
                      <p className="text-xs text-gray-500">
                        {new Date(game.last_played).toLocaleDateString()}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-primary-purple">Your Activity</h2>
                <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
                  <button
                    onClick={() => setHeatmapType('activity')}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      heatmapType === 'activity'
                        ? 'bg-primary-cyan text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Play Sessions
                  </button>
                  <button
                    onClick={() => setHeatmapType('completion')}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      heatmapType === 'completion'
                        ? 'bg-primary-purple text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Completion
                  </button>
                  <button
                    onClick={() => setHeatmapType('achievement')}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      heatmapType === 'achievement'
                        ? 'bg-yellow-500 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Achievements
                  </button>
                </div>
              </div>
              <ActivityHeatmap type={heatmapType} />
            </Card>
          </div>
          <div>
            <Card className="h-full">
              <h2 className="text-xl font-bold text-primary-purple mb-4">Recent Activity</h2>
              <ActivityFeed limit={5} />
            </Card>
          </div>
        </div>

        {/* Achievement Widget */}
        <div className="mb-8">
          <AchievementWidget />
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
                    style={{ cursor: 'pointer' }}
                    onClick={(data) => navigateToLibrary({ status: data.name.toLowerCase() })}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} className="hover:opacity-80 transition-opacity" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #3f3f46',
                      borderRadius: '8px',
                    }}
                    itemStyle={{ color: '#fff' }}
                    labelStyle={{ color: '#a1a1aa' }}
                  />
                  <Legend
                    wrapperStyle={{ color: '#a1a1aa', cursor: 'pointer' }}
                    formatter={(value) => <span style={{ color: '#a1a1aa' }}>{value}</span>}
                    onClick={(data) => navigateToLibrary({ status: (data.value as string).toLowerCase() })}
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
                    style={{ cursor: 'pointer' }}
                    onClick={(data) => navigateToLibrary({ platform: data.name })}
                  >
                    {platformData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} className="hover:opacity-80 transition-opacity" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #3f3f46',
                      borderRadius: '8px',
                    }}
                    itemStyle={{ color: '#fff' }}
                    labelStyle={{ color: '#a1a1aa' }}
                  />
                  <Legend
                    wrapperStyle={{ color: '#a1a1aa', cursor: 'pointer' }}
                    formatter={(value) => <span style={{ color: '#a1a1aa' }}>{value}</span>}
                    onClick={(data) => navigateToLibrary({ platform: data.value as string })}
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
                      style={{ cursor: 'pointer' }}
                      onClick={(data) => navigateToLibrary({ genre: data.name })}
                    >
                      {genreChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} className="hover:opacity-80 transition-opacity" />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #3f3f46',
                        borderRadius: '8px',
                      }}
                      itemStyle={{ color: '#fff' }}
                      labelStyle={{ color: '#a1a1aa' }}
                    />
                    <Legend
                      wrapperStyle={{ color: '#a1a1aa', cursor: 'pointer' }}
                      formatter={(value) => <span style={{ color: '#a1a1aa' }}>{value}</span>}
                      onClick={(data) => navigateToLibrary({ genre: data.value as string })}
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
            <h2 
              className="text-2xl font-bold text-red-400 mb-4 cursor-pointer hover:text-red-300 transition-colors inline-block"
              onClick={() => navigateToLibrary({ favorites: true })}
            >
              Favorites
            </h2>
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


      </div>
    </PageLayout>
  )
}
