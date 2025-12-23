import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import { useState } from 'react'
import { gamesAPI } from '@/lib/api'
import { PageLayout } from '@/components/layout'
import { useToast } from '@/components/ui/Toast'
import { CustomFieldsEditor } from '@/components/CustomFieldsEditor'

interface GameDetails {
  id: string
  name: string
  slug: string | null
  release_date: string | null
  description: string | null
  cover_art_url: string | null
  background_image_url: string | null
  metacritic_score: number | null
  esrb_rating: string | null
  platform_id: string
  platform_name: string
  platform_display_name: string
  status: string | null
  user_rating: number | null
  notes: string | null
  total_minutes: number
  last_played: Date | null
  is_favorite: boolean
}



const STATUS_OPTIONS = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'playing', label: 'Playing' },
  { value: 'finished', label: 'Finished' },
  { value: 'completed', label: 'Completed' },
  { value: 'dropped', label: 'Dropped' },
]

export function GameDetail() {
  const { id } = useParams({ from: '/library/$id' })
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [notesValue, setNotesValue] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['game', id],
    queryFn: async () => {
      const response = await gamesAPI.getOne(id)
      return response.data as { 
        game: GameDetails
        platforms: GameDetails[]
        genres: string[]
      }
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ platformId, status }: { platformId: string; status: string }) =>
      gamesAPI.updateStatus(id, platformId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game', id] })
      queryClient.invalidateQueries({ queryKey: ['games'] })
      showToast('Status updated successfully', 'success')
    },
    onError: () => {
      showToast('Failed to update status', 'error')
    }
  })

  const updateRatingMutation = useMutation({
    mutationFn: ({ platformId, rating }: { platformId: string; rating: number }) =>
      gamesAPI.updateRating(id, platformId, rating),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game', id] })
      queryClient.invalidateQueries({ queryKey: ['games'] })
      showToast('Rating updated successfully', 'success')
    },
    onError: () => {
      showToast('Failed to update rating', 'error')
    }
  })

  const updateNotesMutation = useMutation({
    mutationFn: ({ platformId, notes }: { platformId: string; notes: string }) =>
      gamesAPI.updateNotes(id, platformId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game', id] })
      setIsEditingNotes(false)
      showToast('Notes saved successfully', 'success')
    },
    onError: () => {
      showToast('Failed to save notes', 'error')
    }
  })

  const toggleFavoriteMutation = useMutation({
    mutationFn: ({ platformId, isFavorite }: { platformId: string; isFavorite: boolean }) =>
      gamesAPI.toggleFavorite(id, platformId, isFavorite),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['game', id] })
      queryClient.invalidateQueries({ queryKey: ['games'] })
      showToast(variables.isFavorite ? 'Added to favorites' : 'Removed from favorites', 'success')
    },
    onError: () => {
      showToast('Failed to update favorite status', 'error')
    }
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

  if (error || !data?.game) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-red-400">Game not found</div>
        </div>
      </PageLayout>
    )
  }

  const game = data.game

  const handleStatusChange = (status: string) => {
    updateStatusMutation.mutate({ platformId: game.platform_id, status })
  }

  const handleRatingChange = (rating: number) => {
    updateRatingMutation.mutate({ platformId: game.platform_id, rating })
  }

  const handleSaveNotes = () => {
    updateNotesMutation.mutate({ platformId: game.platform_id, notes: notesValue })
  }

  const startEditingNotes = () => {
    setNotesValue(game.notes || '')
    setIsEditingNotes(true)
  }

  const genres = data?.genres || []

  return (
    <PageLayout>
      {/* Background Image Header */}
      {game.background_image_url && (
        <div className="relative h-96 w-full -mx-6 -mt-6 mb-6">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${game.background_image_url})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-950/50 to-gray-950" />
        </div>
      )}
      
      <div className="max-w-6xl mx-auto">{game.background_image_url && <div className="-mt-64 relative z-10"></div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
          {/* Cover Art */}
          <div className="lg:col-span-1">
            {game.cover_art_url ? (
              <img
                src={game.cover_art_url}
                alt={game.name}
                className="w-full rounded-lg shadow-lg"
              />
            ) : (
              <div className="w-full aspect-[3/4] bg-gray-800 rounded-lg flex items-center justify-center">
                <span className="text-gray-500">No cover art</span>
              </div>
            )}

            {/* Status Selector */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-400 mb-2">Status</label>
              <select
                value={game.status || 'backlog'}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-purple"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Rating Selector */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-400 mb-2">Your Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => handleRatingChange(rating)}
                    className={`flex-1 py-2 rounded transition-all ${
                      game.user_rating === rating
                        ? 'bg-primary-purple text-white shadow-lg shadow-primary-purple/50'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    {rating}
                  </button>
                ))}
              </div>
            </div>

            {/* Favorite Toggle */}
            <div className="mt-4">
              <button
                onClick={() => toggleFavoriteMutation.mutate({ 
                  platformId: game.platform_id, 
                  isFavorite: !game.is_favorite 
                })}
                disabled={toggleFavoriteMutation.isPending}
                className={`w-full py-3 rounded-lg font-semibold transition-all ${
                  game.is_favorite
                    ? 'bg-red-600/20 border-2 border-red-500 text-red-400 hover:bg-red-600/30'
                    : 'bg-gray-800 border-2 border-gray-700 text-gray-400 hover:bg-gray-700 hover:border-red-500 hover:text-red-400'
                }`}
              >
                {game.is_favorite ? '❤️ Remove from Favorites' : '🤍 Add to Favorites'}
              </button>
            </div>
          </div>

          {/* Game Details */}
          <div className="lg:col-span-2">
            <h1 className="text-4xl font-bold mb-2">{game.name}</h1>
            
            {/* Metadata Row */}
            <div className="flex flex-wrap gap-3 text-sm mb-4">
              <span className="px-3 py-1 bg-primary-purple/20 border border-primary-purple rounded-lg text-primary-purple">
                {game.platform_display_name}
              </span>
              {game.release_date && (
                <span className="px-3 py-1 bg-gray-800 rounded-lg text-gray-400">
                  {new Date(game.release_date).getFullYear()}
                </span>
              )}
              {game.metacritic_score && (
                <span className="px-3 py-1 bg-primary-green/20 border border-primary-green rounded-lg text-primary-green">
                  Metacritic: {game.metacritic_score}
                </span>
              )}
              {game.esrb_rating && (
                <span className="px-3 py-1 bg-gray-800 rounded-lg text-gray-400">
                  {game.esrb_rating.toUpperCase()}
                </span>
              )}
            </div>
            
            {/* Genres */}
            {genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {genres.map((genre) => (
                  <span
                    key={genre}
                    className="px-2 py-1 bg-primary-cyan/10 border border-primary-cyan/30 rounded text-primary-cyan text-xs"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {game.description && (
              <div className="mb-6 bg-gray-800/30 rounded-lg p-4">
                <h2 className="text-xl font-semibold mb-3 text-primary-purple">About</h2>
                <p className="text-gray-300 leading-relaxed">{game.description}</p>
              </div>
            )}

            {/* Notes Section */}
            <div className="mb-6 bg-gray-800/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-semibold text-primary-purple">Notes</h2>
                {!isEditingNotes && (
                  <button
                    onClick={startEditingNotes}
                    className="text-sm text-primary-cyan hover:text-primary-purple"
                  >
                    {game.notes ? 'Edit' : 'Add Notes'}
                  </button>
                )}
              </div>

              {isEditingNotes ? (
                <div>
                  <textarea
                    value={notesValue}
                    onChange={(e) => setNotesValue(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-purple min-h-32"
                    placeholder="Add your notes about this game..."
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleSaveNotes}
                      disabled={updateNotesMutation.isPending}
                      className="px-4 py-2 bg-primary-purple hover:bg-primary-purple/80 rounded-lg disabled:opacity-50"
                    >
                      {updateNotesMutation.isPending ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => setIsEditingNotes(false)}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-gray-300 bg-gray-900/50 rounded-lg p-4">
                  {game.notes || 'No notes yet'}
                </div>
              )}
            </div>

            {/* My Stats Section */}
            <div className="mb-6 bg-gray-800/30 rounded-lg p-4">
              <h2 className="text-xl font-semibold text-primary-purple mb-4">My Stats</h2>
              <CustomFieldsEditor gameId={game.id} platformId={game.platform_id} />
            </div>

            {/* External Resources */}
            <div className="mb-6 bg-gray-800/30 rounded-lg p-4">
              <h2 className="text-xl font-semibold text-primary-purple mb-4">External Resources</h2>
              <div className="flex flex-wrap gap-3">
                <a
                  href={`https://howlongtobeat.com/?q=${encodeURIComponent(game.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-[200px] px-4 py-3 bg-primary-cyan/20 border border-primary-cyan/30 text-primary-cyan hover:bg-primary-cyan/30 rounded-lg transition-all text-center"
                >
                  HowLongToBeat →
                </a>
                {game.slug && (
                  <a
                    href={`https://rawg.io/games/${game.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 min-w-[200px] px-4 py-3 bg-primary-purple/20 border border-primary-purple/30 text-primary-purple hover:bg-primary-purple/30 rounded-lg transition-all text-center"
                  >
                    View on RAWG →
                  </a>
                )}
              </div>
            </div>

            {/* Play Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-primary-cyan/10 border border-primary-cyan/30 rounded-lg p-4">
                <div className="text-sm text-primary-cyan">Playtime</div>
                <div className="text-2xl font-semibold text-white">
                  {Math.floor(game.total_minutes / 60)}h {game.total_minutes % 60}m
                </div>
              </div>
              {game.last_played && (
                <div className="bg-primary-purple/10 border border-primary-purple/30 rounded-lg p-4">
                  <div className="text-sm text-primary-purple">Last Played</div>
                  <div className="text-lg font-semibold text-white">
                    {new Date(game.last_played).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
