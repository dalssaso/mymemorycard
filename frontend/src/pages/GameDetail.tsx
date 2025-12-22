import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { gamesAPI } from '@/lib/api'

interface GameDetails {
  id: string
  name: string
  slug: string | null
  release_date: string | null
  description: string | null
  cover_art_url: string | null
  background_image_url: string | null
  metacritic_score: number | null
  platform_id: string
  platform_name: string
  platform_display_name: string
  status: string | null
  user_rating: number | null
  notes: string | null
  total_minutes: number
  last_played: Date | null
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
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [notesValue, setNotesValue] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['game', id],
    queryFn: async () => {
      const response = await gamesAPI.getOne(id)
      return response.data as { game: GameDetails; platforms: GameDetails[] }
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ platformId, status }: { platformId: string; status: string }) =>
      gamesAPI.updateStatus(id, platformId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game', id] })
      queryClient.invalidateQueries({ queryKey: ['games'] })
    },
  })

  const updateRatingMutation = useMutation({
    mutationFn: ({ platformId, rating }: { platformId: string; rating: number }) =>
      gamesAPI.updateRating(id, platformId, rating),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game', id] })
      queryClient.invalidateQueries({ queryKey: ['games'] })
    },
  })

  const updateNotesMutation = useMutation({
    mutationFn: ({ platformId, notes }: { platformId: string; notes: string }) =>
      gamesAPI.updateNotes(id, platformId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game', id] })
      setIsEditingNotes(false)
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  if (error || !data?.game) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-400">Game not found</div>
      </div>
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

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <Link to="/library" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
          ← Back to Library
        </Link>

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
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
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
                    className={`flex-1 py-2 rounded ${
                      game.user_rating === rating
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {rating}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Game Details */}
          <div className="lg:col-span-2">
            <h1 className="text-4xl font-bold mb-2">{game.name}</h1>
            <div className="flex gap-4 text-sm text-gray-400 mb-6">
              <span>{game.platform_display_name}</span>
              {game.release_date && <span>{new Date(game.release_date).getFullYear()}</span>}
              {game.metacritic_score && (
                <span className="text-green-400">Metacritic: {game.metacritic_score}</span>
              )}
            </div>

            {game.description && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">About</h2>
                <p className="text-gray-300 leading-relaxed">{game.description}</p>
              </div>
            )}

            {/* Notes Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold">Notes</h2>
                {!isEditingNotes && (
                  <button
                    onClick={startEditingNotes}
                    className="text-sm text-blue-400 hover:text-blue-300"
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
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 min-h-32"
                    placeholder="Add your notes about this game..."
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleSaveNotes}
                      disabled={updateNotesMutation.isPending}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
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
                <div className="text-gray-300 bg-gray-800/50 rounded-lg p-4">
                  {game.notes || 'No notes yet'}
                </div>
              )}
            </div>

            {/* Play Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-sm text-gray-400">Playtime</div>
                <div className="text-2xl font-semibold">
                  {Math.floor(game.total_minutes / 60)}h {game.total_minutes % 60}m
                </div>
              </div>
              {game.last_played && (
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400">Last Played</div>
                  <div className="text-2xl font-semibold">
                    {new Date(game.last_played).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
