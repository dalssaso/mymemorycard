import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link, useNavigate } from '@tanstack/react-router'
import { collectionsAPI } from '@/lib/api'
import { PageLayout } from '@/components/layout'
import { Card, Button } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'

interface Game {
  id: string
  name: string
  cover_art_url: string | null
  platform_display_name: string
  status: string
  user_rating: number | null
  is_favorite: boolean
}

interface Collection {
  id: string
  name: string
  description: string | null
}

export function CollectionDetail() {
  const { id } = useParams({ from: '/collections/$id' })
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const { data, isLoading } = useQuery({
    queryKey: ['collection', id],
    queryFn: async () => {
      const response = await collectionsAPI.getOne(id)
      return response.data as { collection: Collection; games: Game[] }
    },
  })

  const removeGameMutation = useMutation({
    mutationFn: (gameId: string) => collectionsAPI.removeGame(id, gameId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collection', id] })
      queryClient.invalidateQueries({ queryKey: ['collections'] })
      showToast('Game removed from collection', 'success')
    },
    onError: () => {
      showToast('Failed to remove game', 'error')
    },
  })

  const deleteCollectionMutation = useMutation({
    mutationFn: () => collectionsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] })
      showToast('Collection deleted', 'success')
      navigate({ to: '/collections' })
    },
    onError: () => {
      showToast('Failed to delete collection', 'error')
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
          <div className="text-red-400">Collection not found</div>
        </div>
      </PageLayout>
    )
  }

  const { collection, games } = data

  const handleDeleteCollection = () => {
    if (confirm(`Are you sure you want to delete "${collection.name}"?`)) {
      deleteCollectionMutation.mutate()
    }
  }

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
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{collection.name}</h1>
              {collection.description && (
                <p className="text-gray-400">{collection.description}</p>
              )}
              <p className="text-sm text-primary-cyan mt-2">
                {games.length} {games.length === 1 ? 'game' : 'games'}
              </p>
            </div>
            <Button variant="danger" onClick={handleDeleteCollection}>
              Delete Collection
            </Button>
          </div>
        </div>

        {/* Games Grid */}
        {games.length === 0 ? (
          <Card>
            <p className="text-gray-400 text-center py-8">
              No games in this collection yet. Add games from your library!
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {games.map((game) => (
              <div key={game.id} className="group relative">
                <Link to="/library/$id" params={{ id: game.id }}>
                  <div className="aspect-[3/4] rounded-lg overflow-hidden bg-gray-800 mb-2">
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
                  <p className="text-sm text-gray-300 truncate group-hover:text-white">
                    {game.name}
                  </p>
                </Link>
                <button
                  onClick={() => removeGameMutation.mutate(game.id)}
                  className="absolute top-2 right-2 bg-red-600/80 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove from collection"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  )
}
