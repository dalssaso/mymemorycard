import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { gamesAPI } from '@/lib/api'
import { PageLayout } from '@/components/layout'
import { GameDetailSidebar } from '@/components/sidebar'
import { useToast } from '@/components/ui/Toast'
import { GameAchievements } from '@/components/GameAchievements'
import { PlatformIcon } from '@/components/PlatformIcon'
import { StartSessionButton } from '@/components/StartSessionButton'
import { ProgressDisplay } from '@/components/ProgressDisplay'
import { SessionsHistory } from '@/components/SessionsHistory'
import { ProgressHistory } from '@/components/ProgressHistory'
import { EditionOwnership } from '@/components/EditionOwnership'
import { EditionSwitcher } from '@/components/EditionSwitcher'

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
  last_played: string | null
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
  const [selectedPlatformId, setSelectedPlatformId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const navigate = useNavigate()

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

  const deleteGameMutation = useMutation({
    mutationFn: ({ platformId }: { platformId: string }) =>
      gamesAPI.delete(id, platformId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['games'] })
      queryClient.invalidateQueries({ queryKey: ['game', id] })
      showToast('Game removed from library', 'success')
      
      const remainingPlatforms = platforms.filter(p => p.platform_id !== variables.platformId)
      if (remainingPlatforms.length === 0) {
        navigate({ to: '/library' })
      } else {
        setSelectedPlatformId(remainingPlatforms[0].platform_id)
      }
    },
    onError: () => {
      showToast('Failed to remove game', 'error')
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
  const genres = data?.genres || []
  const platforms = data?.platforms || []
  const hasMultiplePlatforms = platforms.length > 1

  const activePlatformId = selectedPlatformId || game.platform_id
  const activePlatform = platforms.find(p => p.platform_id === activePlatformId) || game

  const handleStatusChange = (status: string) => {
    updateStatusMutation.mutate({ platformId: activePlatformId, status })
  }

  const handleRatingChange = (rating: number) => {
    updateRatingMutation.mutate({ platformId: activePlatformId, rating })
  }

  const handleSaveNotes = () => {
    updateNotesMutation.mutate({ platformId: activePlatformId, notes: notesValue })
  }

  const startEditingNotes = () => {
    setNotesValue(activePlatform.notes || '')
    setIsEditingNotes(true)
  }

  const sidebarContent = (
    <GameDetailSidebar
      gameId={game.id}
      platformId={activePlatformId}
      status={activePlatform.status}
      onStatusChange={handleStatusChange}
      isUpdating={updateStatusMutation.isPending}
    />
  )

  return (
    <PageLayout sidebar={sidebarContent}>
      {/* Mobile Back Button - visible only on mobile */}
      <div className="lg:hidden mb-4">
        <Link
          to="/library"
          className="inline-flex items-center gap-2 text-primary-cyan hover:text-primary-purple transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Library
        </Link>
      </div>

      {/* Background Image Header - hidden on mobile to avoid overlap with cover */}
      {activePlatform.background_image_url && (
        <div className="hidden sm:block relative h-64 lg:h-96 w-full -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 mb-4 sm:mb-6">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${activePlatform.background_image_url})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-950/50 to-gray-950" />
        </div>
      )}
      
      <div className={`max-w-6xl mx-auto ${activePlatform.background_image_url ? 'sm:-mt-48 lg:-mt-64 relative z-10' : ''}`}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
          {/* Cover Art */}
          <div className="lg:col-span-1">
            {activePlatform.cover_art_url ? (
              <img
                src={activePlatform.cover_art_url}
                alt={activePlatform.name}
                className="w-full rounded-lg shadow-lg"
              />
            ) : (
              <div className="w-full aspect-[3/4] bg-gray-800 rounded-lg flex items-center justify-center">
                <span className="text-gray-500">No cover art</span>
              </div>
            )}

            {/* Edition Switcher */}
            <div className="mt-4">
              <EditionSwitcher
                gameId={game.id}
                platformId={activePlatformId}
              />
            </div>

            {/* Platform Selector (for multi-platform games) */}
            {hasMultiplePlatforms && (
              <div className="mt-4">
                <label htmlFor="platform-select" className="block text-sm font-medium text-gray-400 mb-2">
                  Tracking Platform
                </label>
                <select
                  id="platform-select"
                  value={activePlatformId}
                  onChange={(e) => setSelectedPlatformId(e.target.value)}
                  className="w-full bg-gray-900 border border-primary-purple rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-cyan"
                >
                  {platforms.map((platform) => (
                    <option key={platform.platform_id} value={platform.platform_id}>
                      {platform.platform_display_name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Stats and progress are tracked per platform
                </p>
              </div>
            )}

            {/* Start Session Button */}
            <div className="mt-4">
              <StartSessionButton gameId={game.id} platformId={activePlatformId} />
            </div>

            {/* Progress Display */}
            <div className="mt-3">
              <ProgressDisplay gameId={game.id} />
            </div>

            {/* Status Selector */}
            <div className="mt-4">
              <label htmlFor="game-status" className="block text-sm font-medium text-gray-400 mb-2">
                Status
              </label>
              <select
                id="game-status"
                value={activePlatform.status || 'backlog'}
                onChange={(e) => handleStatusChange(e.target.value)}
                aria-describedby="status-description"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-purple"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span id="status-description" className="sr-only">
                Track your progress with this game
              </span>
            </div>

            {/* Play Stats */}
            <div className="mt-4 grid grid-cols-1 gap-3">
              <div className="bg-primary-cyan/10 border border-primary-cyan/30 rounded-lg p-3">
                <div className="text-xs text-primary-cyan">Playtime</div>
                <div className="text-lg font-semibold text-white">
                  {Math.floor(activePlatform.total_minutes / 60)}h {activePlatform.total_minutes % 60}m
                </div>
              </div>
              {activePlatform.last_played && (
                <div className="bg-primary-purple/10 border border-primary-purple/30 rounded-lg p-3">
                  <div className="text-xs text-primary-purple">Last Played</div>
                  <div className="text-sm font-semibold text-white">
                    {new Date(activePlatform.last_played).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>

            {/* Rating Selector */}
            <div className="mt-4">
              <span className="block text-sm font-medium text-gray-400 mb-2" id="user-rating-label">
                Your Rating
              </span>
              <div className="grid grid-cols-10 gap-1" role="group" aria-labelledby="user-rating-label">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => handleRatingChange(rating)}
                    aria-label={`Rate ${rating} out of 10`}
                    aria-pressed={activePlatform.user_rating === rating}
                    className={`py-2 text-sm rounded transition-all ${
                      activePlatform.user_rating === rating
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
                  platformId: activePlatformId, 
                  isFavorite: !activePlatform.is_favorite 
                })}
                disabled={toggleFavoriteMutation.isPending}
                className={`w-full py-3 rounded-lg font-semibold transition-all ${
                  activePlatform.is_favorite
                    ? 'bg-red-600/20 border-2 border-red-500 text-red-400 hover:bg-red-600/30'
                    : 'bg-gray-800 border-2 border-gray-700 text-gray-400 hover:bg-gray-700 hover:border-red-500 hover:text-red-400'
                }`}
              >
                {activePlatform.is_favorite ? '❤️ Remove from Favorites' : '🤍 Add to Favorites'}
              </button>
            </div>

            {/* Remove from Library */}
            <div className="mt-4">
              {showDeleteConfirm ? (
                <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
                  <p className="text-sm text-gray-300 mb-3">
                    Remove <strong>{activePlatform.platform_display_name}</strong> version from your library? This will delete all progress, sessions, and notes for this platform.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        deleteGameMutation.mutate({ platformId: activePlatformId })
                        setShowDeleteConfirm(false)
                      }}
                      disabled={deleteGameMutation.isPending}
                      className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50"
                    >
                      {deleteGameMutation.isPending ? 'Removing...' : 'Confirm Remove'}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full py-3 rounded-lg font-semibold transition-all bg-gray-800 border-2 border-gray-700 text-gray-400 hover:bg-red-900/20 hover:border-red-500/50 hover:text-red-400"
                >
                  Remove from Library
                </button>
              )}
            </div>

            {/* Owned Platforms */}
            {platforms.length > 0 && (
              <div className="mt-4">
                <span className="block text-sm font-medium text-gray-400 mb-2">Owned on</span>
                <div className="flex flex-wrap gap-2">
                  {platforms.map((platform) => (
                    <div
                      key={platform.platform_id}
                      className="px-3 py-1.5 bg-primary-purple/20 border border-primary-purple/50 rounded-lg flex items-center gap-2"
                    >
                      <PlatformIcon platform={platform.platform_display_name} size="sm" />
                      <span className="text-sm text-primary-purple">{platform.platform_display_name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="mt-4 flex flex-wrap gap-2">
              {game.release_date && (
                <span className="px-3 py-1 bg-gray-800 rounded-lg text-gray-400 text-sm">
                  {new Date(game.release_date).getFullYear()}
                </span>
              )}
              {game.metacritic_score && (
                <span className="px-3 py-1 bg-primary-green/20 border border-primary-green rounded-lg text-primary-green text-sm">
                  Metacritic: {game.metacritic_score}
                </span>
              )}
              {game.esrb_rating && (
                <span className="px-3 py-1 bg-gray-800 rounded-lg text-gray-400 text-sm">
                  {game.esrb_rating.toUpperCase()}
                </span>
              )}
            </div>

            {/* Genres */}
            {genres.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
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
          </div>

          {/* Game Details */}
          <div className="lg:col-span-2">
            <h1 className="text-4xl font-bold mb-4">{activePlatform.name}</h1>

            {activePlatform.description && (
              <div id="about" className="mb-6 bg-gray-800/30 rounded-lg p-4">
                <h2 className="text-xl font-semibold mb-3 text-primary-purple">About</h2>
                <p className="text-gray-300 leading-relaxed">{activePlatform.description}</p>
              </div>
            )}

            {/* Notes Section */}
            <div id="notes" className="mb-6 bg-gray-800/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-semibold text-primary-purple">Notes</h2>
                {!isEditingNotes && (
                  <button
                    onClick={startEditingNotes}
                    className="text-sm text-primary-cyan hover:text-primary-purple"
                  >
                    {activePlatform.notes ? 'Edit' : 'Add Notes'}
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
                  {activePlatform.notes || 'No notes yet'}
                </div>
              )}
            </div>

            {/* Edition & DLC Ownership Section */}
            <div id="ownership" className="mb-6 bg-gray-800/30 rounded-lg p-4">
              <h2 className="text-xl font-semibold text-primary-purple mb-4">Edition & DLC Ownership</h2>
              <EditionOwnership gameId={game.id} platformId={activePlatformId} />
            </div>

            {/* Achievements Section */}
            <div id="achievements" className="mb-6 bg-gray-800/30 rounded-lg p-4">
              <h2 className="text-xl font-semibold text-primary-purple mb-4">Achievements</h2>
              <GameAchievements gameId={game.id} platformId={activePlatformId} />
            </div>

            {/* Sessions History Section */}
            <div id="sessions" className="mb-6 bg-gray-800/30 rounded-lg p-4">
              <SessionsHistory gameId={game.id} platformId={activePlatformId} />
            </div>

            {/* Progress History Section */}
            <div id="stats" className="mb-6 bg-gray-800/30 rounded-lg p-4">
              <ProgressHistory gameId={game.id} platformId={activePlatformId} />
            </div>

            {/* External Resources */}
            <div id="resources" className="mb-6 bg-gray-800/30 rounded-lg p-4">
              <h2 className="text-xl font-semibold text-primary-purple mb-4">External Resources</h2>
              <div className="flex flex-wrap gap-3">
                <a
                  href={`https://howlongtobeat.com/?q=${encodeURIComponent(activePlatform.name)}`}
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

          </div>
        </div>
      </div>
    </PageLayout>
  )
}
