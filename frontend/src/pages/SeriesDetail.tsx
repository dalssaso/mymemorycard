import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from '@tanstack/react-router'
import { collectionsAPI } from '@/lib/api'
import { PageLayout } from '@/components/layout'
import { Card } from '@/components/ui'

interface Game {
  id: string
  name: string
  cover_art_url: string | null
  platform_display_name: string
  status: string
  user_rating: number | null
  is_favorite: boolean
  release_date: string | null
}

export function SeriesDetail() {
  const { seriesName } = useParams({ from: '/collections/series/$seriesName' })

  const { data, isLoading } = useQuery({
    queryKey: ['series', seriesName],
    queryFn: async () => {
      const response = await collectionsAPI.getSeriesGames(seriesName)
      return response.data as { series_name: string; games: Game[] }
    },
  })

  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-gray-400">Loading...</div>
        </div>
      </PageLayout>
    )
  }

  if (!data) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-red-400">Series not found</div>
        </div>
      </PageLayout>
    )
  }

  const { games } = data

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/collections"
            className="text-primary-cyan hover:text-primary-purple transition-colors mb-4 inline-block"
          >
            ← Back to Collections
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">{seriesName} Series</h1>
          <p className="text-sm text-primary-cyan">
            {games.length} {games.length === 1 ? 'game' : 'games'}
          </p>
        </div>

        {/* Games Grid */}
        {games.length === 0 ? (
          <Card>
            <p className="text-gray-400 text-center py-8">
              No games found in this series.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {games.map((game) => (
              <Link
                key={game.id}
                to="/library/$id"
                params={{ id: game.id }}
                className="group"
              >
                <div className="aspect-[3/4] rounded-lg overflow-hidden bg-gray-800 mb-2 relative">
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
                  {game.is_favorite && (
                    <div className="absolute top-2 right-2 text-xl">❤️</div>
                  )}
                </div>
                <p className="text-sm text-gray-300 truncate group-hover:text-white mb-1">
                  {game.name}
                </p>
                {game.release_date && (
                  <p className="text-xs text-gray-500">
                    {new Date(game.release_date).getFullYear()}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  )
}
