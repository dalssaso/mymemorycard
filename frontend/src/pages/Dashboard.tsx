import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { Bar, BarChart, Cell, Legend, Pie, PieChart, Rectangle, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { RectangleProps, TooltipProps } from 'recharts'
import { AchievementWidget } from '@/components/AchievementWidget'
import { ActivityFeed } from '@/components/ActivityFeed'
import { ActivityHeatmap } from '@/components/ActivityHeatmap'
import { PageLayout } from '@/components/layout'
import { DashboardSidebar } from '@/components/sidebar'
import { Card } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import { useAnimatedNumber } from '@/hooks/use-animated-number'
import { gamesAPI } from '@/lib/api'

const STATUS_COLORS = {
  backlog: '#71717A',
  playing: '#06B6D4',
  finished: '#10B981',
  completed: '#F59E0B',
  dropped: '#EF4444',
}

const PLATFORM_COLORS = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#EC4899']
const GENRE_COLORS = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#F472B6', '#A78BFA', '#34D399', '#FBBF24']
const lastDashboardRefreshHref: { current: string | null } = { current: null }

const renderActiveBar = (props: unknown) => {
  const barProps = props as RectangleProps & { payload?: { color?: string } }

  return (
    <Rectangle
      {...barProps}
      stroke="#e5e7eb"
      strokeWidth={2}
      fill={barProps.payload?.color || barProps.fill}
      fillOpacity={0.85}
    />
  )
}

export function Dashboard() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const locationHref = useRouterState({ select: (state) => state.location.href })
  const { showToast } = useToast()
  const refreshHrefRef = useRef<string | null>(null)
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
    refetchOnMount: 'always',
  })

  const { data: genreData } = useQuery({
    queryKey: ['genreStats'],
    queryFn: async () => {
      const response = await gamesAPI.getGenreStats()
      return response.data as { genres: Array<{ name: string; count: number }> }
    },
    refetchOnMount: 'always',
  })

  useEffect(() => {
    if (!locationHref.includes('/dashboard')) {
      return
    }

    if (refreshHrefRef.current !== locationHref && lastDashboardRefreshHref.current !== locationHref) {
      showToast('Refreshing dashboard data...', 'info')
      refreshHrefRef.current = locationHref
      lastDashboardRefreshHref.current = locationHref
    }
    queryClient.refetchQueries({ queryKey: ['games'] })
    queryClient.refetchQueries({ queryKey: ['genreStats'] })
    queryClient.refetchQueries({ queryKey: ['achievementStats'] })
  }, [locationHref, queryClient])

  const games = data?.games || []
  const totalGames = games.length
  const inProgressGames = games.filter((g) => g.status === 'playing').length
  const completedGames = games.filter((g) => g.status === 'completed' || g.status === 'finished').length
  const backlogGames = games.filter((g) => g.status === 'backlog').length
  const favoriteGames = games.filter((g) => g.is_favorite === true)
  const animatedTotalGames = useAnimatedNumber(totalGames)
  const animatedInProgressGames = useAnimatedNumber(inProgressGames)
  const animatedCompletedGames = useAnimatedNumber(completedGames)
  const animatedBacklogGames = useAnimatedNumber(backlogGames)

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
    return [...genreData.genres]
      .sort((a, b) => b.count - a.count)
      .map((genre, index) => ({
        name: genre.name,
        value: genre.count,
        color: GENRE_COLORS[index % GENRE_COLORS.length],
      }))
  }, [genreData])

  const renderGenreTooltip = useCallback((props: TooltipProps<number, string>) => {
    if (!props.active || !props.payload?.length) return null
    const entry = props.payload[0]
    const data = entry?.payload as { name?: string; value?: number; color?: string } | undefined
    const name = data?.name || (typeof entry?.name === 'string' ? entry.name : '')
    const value = typeof entry?.value === 'number' ? entry.value : data?.value
    if (!name || value === undefined) return null
    const color = data?.color || '#a1a1aa'

    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-gray-300">{name}: {value}</span>
        </div>
      </div>
    )
  }, [])

  return (
    <PageLayout sidebar={<DashboardSidebar games={games} />}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-white">Dashboard</h1>
          <div className="flex gap-3">
            <Link
              to="/platforms"
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
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
            <p className="text-3xl font-bold text-white">{animatedTotalGames}</p>
          </Card>
          
          <Card 
            className="bg-primary-cyan/10 border-primary-cyan/30 cursor-pointer hover:bg-primary-cyan/20 transition-colors"
            onClick={() => navigateToLibrary({ status: 'playing' })}
          >
            <h3 className="text-gray-400 text-sm mb-2">Currently Playing</h3>
            <p className="text-3xl font-bold text-primary-cyan">{animatedInProgressGames}</p>
          </Card>
          
          <Card 
            className="bg-primary-green/10 border-primary-green/30 cursor-pointer hover:bg-primary-green/20 transition-colors"
            onClick={() => navigateToLibrary({ status: 'completed' })}
          >
            <h3 className="text-gray-400 text-sm mb-2">Completed</h3>
            <p className="text-3xl font-bold text-primary-green">{animatedCompletedGames}</p>
          </Card>

          <Card 
            className="bg-gray-700/30 border-gray-600/30 cursor-pointer hover:bg-gray-700/50 transition-colors"
            onClick={() => navigateToLibrary({ status: 'backlog' })}
          >
            <h3 className="text-gray-400 text-sm mb-2">Backlog</h3>
            <p className="text-3xl font-bold text-gray-300">{animatedBacklogGames}</p>
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
          <AchievementWidget games={games} />
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
                    isAnimationActive
                    animationDuration={600}
                    animationEasing="ease-out"
                    animationBegin={100}
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
                    isAnimationActive
                    animationDuration={600}
                    animationEasing="ease-out"
                    animationBegin={100}
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
                  <BarChart
                    data={genreChartData}
                    layout="vertical"
                    margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
                  >
                    <XAxis type="number" tick={{ fill: '#a1a1aa' }} axisLine={{ stroke: '#3f3f46' }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={80}
                      tick={{ fill: '#a1a1aa' }}
                      axisLine={{ stroke: '#3f3f46' }}
                    />
                    <Bar
                      dataKey="value"
                      radius={[0, 6, 6, 0]}
                      style={{ cursor: 'pointer' }}
                      isAnimationActive
                      animationDuration={600}
                      animationEasing="ease-out"
                      animationBegin={100}
                      activeBar={renderActiveBar}
                      onClick={(data) => navigateToLibrary({ genre: data?.payload?.name })}
                    >
                      {genreChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                    <Tooltip content={renderGenreTooltip} cursor={{ fill: 'transparent' }} />
                  </BarChart>
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
