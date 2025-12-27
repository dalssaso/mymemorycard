import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from '@tanstack/react-router'
import { franchisesAPI, platformsAPI, OwnedGame, MissingGame } from '@/lib/api'
import { PageLayout } from '@/components/layout'
import { Card, Button, useToast } from '@/components/ui'

const STATUS_COLORS: Record<string, string> = {
  backlog: 'bg-gray-600',
  playing: 'bg-primary-cyan',
  finished: 'bg-primary-green',
  completed: 'bg-primary-purple',
  dropped: 'bg-red-500',
}

interface Platform {
  id: string
  name: string
  display_name: string
}

export function FranchiseDetail() {
  const { seriesName } = useParams({ from: '/franchises/$seriesName' })
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [selectedGame, setSelectedGame] = useState<MissingGame | null>(null)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedGames, setSelectedGames] = useState<Set<number>>(new Set())

  const { data, isLoading } = useQuery({
    queryKey: ['franchise', seriesName],
    queryFn: async () => {
      const response = await franchisesAPI.getOne(seriesName)
      return response.data
    },
  })

  const { data: platformsData } = useQuery({
    queryKey: ['platforms'],
    queryFn: async () => {
      const response = await platformsAPI.getAll()
      return response.data as { platforms: Platform[] }
    },
  })

  const importMutation = useMutation({
    mutationFn: ({ rawgId, platformId, franchiseSeriesName }: { rawgId: number; platformId: string; gameName: string; franchiseSeriesName: string }) =>
      franchisesAPI.importGame(rawgId, platformId, franchiseSeriesName),
    onSuccess: async (_, variables) => {
      showToast(`Added ${variables.gameName} to your library`, 'success')
      setSelectedGame(null)
      await queryClient.refetchQueries({ queryKey: ['franchise', seriesName] })
      queryClient.invalidateQueries({ queryKey: ['games'] })
    },
    onError: () => {
      showToast('Failed to import game', 'error')
    },
  })

  const bulkImportMutation = useMutation({
    mutationFn: async ({ rawgIds, platformId, franchiseSeriesName }: { rawgIds: number[]; platformId: string; franchiseSeriesName: string }) => {
      const results = await Promise.allSettled(
        rawgIds.map(rawgId => franchisesAPI.importGame(rawgId, platformId, franchiseSeriesName))
      )
      const succeeded = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected').length
      return { succeeded, failed }
    },
    onSuccess: async (result) => {
      if (result.failed > 0) {
        showToast(`Imported ${result.succeeded} game(s), ${result.failed} failed`, 'warning')
      } else {
        showToast(`Imported ${result.succeeded} game(s) to your library`, 'success')
      }
      setSelectionMode(false)
      setSelectedGames(new Set())
      await queryClient.refetchQueries({ queryKey: ['franchise', seriesName] })
      queryClient.invalidateQueries({ queryKey: ['games'] })
    },
    onError: () => {
      showToast('Failed to import games', 'error')
    },
  })

  const handleImportClick = (game: MissingGame) => {
    setSelectedGame(game)
  }

  const handlePlatformSelect = (platformId: string) => {
    if (selectedGame && data) {
      importMutation.mutate({
        rawgId: selectedGame.rawgId,
        platformId,
        gameName: selectedGame.name,
        franchiseSeriesName: data.series_name,
      })
    }
  }

  const handleBulkPlatformSelect = (platformId: string) => {
    if (selectedGames.size > 0 && data) {
      bulkImportMutation.mutate({
        rawgIds: Array.from(selectedGames),
        platformId,
        franchiseSeriesName: data.series_name,
      })
    }
  }

  const toggleGameSelection = (rawgId: number) => {
    setSelectedGames(prev => {
      const next = new Set(prev)
      if (next.has(rawgId)) {
        next.delete(rawgId)
      } else {
        next.add(rawgId)
      }
      return next
    })
  }

  const handleSelectAll = () => {
    if (!data) return
    if (selectedGames.size === data.missing_games.length) {
      setSelectedGames(new Set())
    } else {
      setSelectedGames(new Set(data.missing_games.map(g => g.rawgId)))
    }
  }

  const handleExitSelectionMode = () => {
    setSelectionMode(false)
    setSelectedGames(new Set())
  }

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
          <div className="text-red-400">Franchise not found</div>
        </div>
      </PageLayout>
    )
  }

  const { series_name, owned_games, missing_games } = data
  const platforms = platformsData?.platforms || []

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/franchises"
            className="text-primary-cyan hover:text-primary-purple transition-colors mb-4 inline-block"
          >
            ← Back to Franchises
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">{series_name}</h1>
          <p className="text-gray-400">
            {owned_games.length} owned
            {missing_games.length > 0 && ` · ${missing_games.length} missing`}
          </p>
        </div>

        {/* Owned Games */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-primary-cyan mb-4">Your Games</h2>
          {owned_games.length === 0 ? (
            <Card>
              <p className="text-gray-400 text-center py-8">
                No games owned in this franchise.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {owned_games.map((game: OwnedGame) => (
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
                    <div
                      className={`absolute top-2 right-2 w-3 h-3 rounded-full ${STATUS_COLORS[game.status] || 'bg-gray-600'}`}
                      title={game.status}
                    />
                  </div>
                  <p className="text-sm text-gray-300 truncate group-hover:text-white mb-1">
                    {game.name}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {game.release_date && (
                      <span>{new Date(game.release_date).getFullYear()}</span>
                    )}
                    {game.platforms.length > 0 && (
                      <>
                        <span className="text-gray-600">·</span>
                        <span>{game.platforms.join(', ')}</span>
                      </>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Missing Games */}
        {missing_games.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-primary-purple">Missing from Your Library</h2>
              <div className="flex items-center gap-2">
                {selectionMode ? (
                  <>
                    <button
                      onClick={handleSelectAll}
                      className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-all"
                    >
                      {selectedGames.size === missing_games.length ? 'Deselect All' : 'Select All'}
                    </button>
                    <button
                      onClick={handleExitSelectionMode}
                      className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-all"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setSelectionMode(true)}
                    className="px-3 py-1.5 bg-primary-purple/20 border border-primary-purple/30 text-primary-purple hover:bg-primary-purple/30 rounded text-sm transition-all"
                  >
                    Select Games
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {missing_games.map((game: MissingGame) => {
                const isSelected = selectedGames.has(game.rawgId)
                return (
                  <div
                    key={game.rawgId}
                    className="group cursor-pointer"
                    onClick={() => selectionMode ? toggleGameSelection(game.rawgId) : handleImportClick(game)}
                  >
                    <div className={`aspect-[3/4] rounded-lg overflow-hidden bg-gray-800 mb-2 relative border transition-colors ${
                      isSelected 
                        ? 'border-primary-purple border-2' 
                        : 'border-dashed border-gray-700 hover:border-primary-purple'
                    }`}>
                      {game.background_image ? (
                        <img
                          src={game.background_image}
                          alt={game.name}
                          className={`w-full h-full object-cover transition-all ${
                            selectionMode && isSelected 
                              ? 'opacity-100 grayscale-0' 
                              : 'opacity-60 group-hover:opacity-100 grayscale group-hover:grayscale-0'
                          }`}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600">
                          No Image
                        </div>
                      )}
                      {selectionMode ? (
                        isSelected && (
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary-purple flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4 text-white">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                            </svg>
                          </div>
                        )
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
                          <span className="text-white text-sm font-medium">+ Add to Library</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 truncate group-hover:text-gray-300 mb-1">
                      {game.name}
                    </p>
                    {game.released && (
                      <p className="text-xs text-gray-600">
                        {new Date(game.released).getFullYear()}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Bulk Import Floating Action Bar */}
        {selectionMode && selectedGames.size > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 border border-gray-700 rounded-xl px-6 py-4 shadow-xl z-40 flex items-center gap-4">
            <span className="text-white font-medium">
              {selectedGames.size} game{selectedGames.size !== 1 ? 's' : ''} selected
            </span>
            <div className="h-6 w-px bg-gray-700" />
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">Import to:</span>
              <div className="flex flex-wrap gap-2 max-w-md">
                {platforms.slice(0, 6).map((platform) => (
                  <Button
                    key={platform.id}
                    variant="secondary"
                    onClick={() => handleBulkPlatformSelect(platform.id)}
                    disabled={bulkImportMutation.isPending}
                    className="text-sm py-1 px-3"
                  >
                    {platform.display_name}
                  </Button>
                ))}
                {platforms.length > 6 && (
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedGame({ rawgId: -1, id: -1, name: 'Bulk Import', slug: '', released: null, background_image: null })}
                    className="text-sm py-1 px-3"
                  >
                    More...
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Platform Selection Modal */}
        {selectedGame && (
          <div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
            onClick={() => setSelectedGame(null)}
          >
            <div
              className="bg-gray-900 rounded-xl p-6 max-w-md w-full mx-4 border border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-2">
                {selectedGame.rawgId === -1 ? 'Bulk Import' : 'Add to Library'}
              </h3>
              <p className="text-gray-400 mb-4">
                {selectedGame.rawgId === -1 
                  ? `Import ${selectedGames.size} selected game${selectedGames.size !== 1 ? 's' : ''}`
                  : selectedGame.name}
              </p>
              <p className="text-sm text-gray-500 mb-4">Select a platform:</p>
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {platforms.map((platform) => (
                  <Button
                    key={platform.id}
                    variant="secondary"
                    onClick={() => {
                      if (selectedGame.rawgId === -1) {
                        handleBulkPlatformSelect(platform.id)
                        setSelectedGame(null)
                      } else {
                        handlePlatformSelect(platform.id)
                      }
                    }}
                    disabled={importMutation.isPending || bulkImportMutation.isPending}
                    className="justify-start"
                  >
                    {platform.display_name}
                  </Button>
                ))}
              </div>
              <Button
                variant="ghost"
                onClick={() => setSelectedGame(null)}
                className="w-full mt-4"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  )
}
