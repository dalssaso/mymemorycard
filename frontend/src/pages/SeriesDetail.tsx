import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from '@tanstack/react-router'
import { BackButton, PageLayout } from '@/components/layout'
import { Card } from '@/components/ui'
import { collectionsAPI } from '@/lib/api'

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
          <div className="text-ctp-subtext0">Loading...</div>
        </div>
      </PageLayout>
    )
  }

  if (!data) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-ctp-red">Series not found</div>
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
            className="hidden md:inline-block text-ctp-teal hover:text-ctp-mauve transition-colors mb-4"
          >
            Back to Collections
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <BackButton
              iconOnly={true}
              className="md:hidden p-2 rounded-lg text-ctp-subtext0 hover:bg-ctp-surface0 hover:text-ctp-text transition-all"
            />
            <h1 className="text-4xl font-bold text-ctp-text">{seriesName} Series</h1>
          </div>
          <p className="text-sm text-ctp-teal">
            {games.length} {games.length === 1 ? 'game' : 'games'}
          </p>
        </div>

        {/* Games Grid */}
        {games.length === 0 ? (
          <Card>
            <p className="text-ctp-subtext0 text-center py-8">
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
                <div className="aspect-[3/4] rounded-lg overflow-hidden bg-ctp-surface0 mb-2 relative">
                  {game.cover_art_url ? (
                    <img
                      src={game.cover_art_url}
                      alt={game.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-ctp-overlay1">
                      No Cover
                    </div>
                  )}
                  {game.is_favorite && (
                    <div className="absolute top-2 right-2 text-ctp-red">
                      <svg
                        className="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        stroke="currentColor"
                        strokeWidth={2}
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <p className="text-sm text-ctp-subtext1 truncate group-hover:text-ctp-text mb-1">
                  {game.name}
                </p>
                {game.release_date && (
                  <p className="text-xs text-ctp-overlay1">
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
