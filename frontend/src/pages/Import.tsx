import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { importAPI, userPlatformsAPI } from '@/lib/api'
import { PageLayout } from '@/components/layout'
import { ImportSidebar } from '@/components/sidebar'
import { useToast } from '@/components/ui/Toast'

interface UserPlatform {
  id: string
  platform_id: string
  name: string
  display_name: string
  platform_type: string | null
}

interface ImportedGame {
  game: {
    id: string
    name: string
    cover_art_url: string | null
  }
  display?: {
    name: string
    cover_art_url: string | null
  } | null
  source: 'exact' | 'selected'
}

interface NeedsReview {
  searchTerm: string
  candidates: Array<{
    id: number
    name: string
    background_image: string | null
    released: string | null
  }>
  error?: string
}

interface ImportResult {
  imported: ImportedGame[]
  needsReview: NeedsReview[]
}

export function Import() {
  const [gameNames, setGameNames] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState<string>('')
  const [results, setResults] = useState<ImportResult | null>(null)
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const refreshDashboardData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['games'] }),
      queryClient.invalidateQueries({ queryKey: ['achievementStats'] }),
      queryClient.refetchQueries({ queryKey: ['games'], type: 'all' }),
      queryClient.refetchQueries({ queryKey: ['achievementStats'], type: 'all' }),
    ])
  }

  // Fetch platforms
  const { data: platformsData } = useQuery({
    queryKey: ['user-platforms'],
    queryFn: async () => {
      const response = await userPlatformsAPI.getAll()
      return response.data as { platforms: UserPlatform[] }
    },
  })

  const platforms = (platformsData?.platforms || []).map((platform) => ({
    id: platform.platform_id,
    name: platform.name,
    display_name: platform.display_name,
    platform_type: platform.platform_type,
  }))
  
  // Set default platform to steam (first PC platform) when platforms load
  if (platforms.length > 0 && !selectedPlatform) {
    const steamPlatform = platforms.find(p => p.name === 'steam')
    setSelectedPlatform(steamPlatform?.id || platforms[0].id)
  }

  const importMutation = useMutation({
    mutationFn: ({ names, platformId }: { names: string[]; platformId?: string }) =>
      importAPI.bulk(names, platformId),
    onSuccess: async (response) => {
      setResults(response.data)
      const result = response.data as ImportResult
      
      // Refresh dashboard data so achievements sync without a full reload
      await refreshDashboardData()
      
      // Invalidate individual game caches for imported games
      // This ensures game detail pages show updated platform info
      result.imported.forEach((item) => {
        queryClient.invalidateQueries({ queryKey: ['game', item.game.id] })
      })
      
      // Show success toast
      if (result.imported.length > 0) {
        showToast(`Successfully imported ${result.imported.length} game(s)`, 'success')
      }
      
      // Show warning if there are items needing review
      if (result.needsReview.length > 0) {
        showToast(`${result.needsReview.length} game(s) need review`, 'warning')
      }
      
      // If all games were imported successfully (no review needed), navigate to library
      if (result.needsReview.length === 0 && result.imported.length > 0) {
        setTimeout(() => {
          navigate({ to: '/library' })
        }, 2000)
      }
    },
    onError: () => {
      showToast('Failed to import games', 'error')
    }
  })

  const selectMutation = useMutation({
    mutationFn: ({ rawgId, platformId }: { rawgId: number; platformId?: string }) =>
      importAPI.single(rawgId, platformId),
    onSuccess: async (response, variables) => {
      const importedGame = response.data as {
        game: ImportedGame['game']
        source: string
        display?: ImportedGame['display']
      }
      
      // Update results to move item from needsReview to imported
      setResults((prev) => {
        if (!prev) return prev
        
        // Find and remove the needsReview item that contained this candidate
        const updatedNeedsReview = prev.needsReview.filter(
          (item) => !item.candidates.some((c) => c.id === variables.rawgId)
        )
        
        return {
          imported: [
            ...prev.imported,
            { game: importedGame.game, display: importedGame.display, source: 'exact' as const },
          ],
          needsReview: updatedNeedsReview,
        }
      })
      
      // Refresh dashboard data so achievements sync without a full reload
      await refreshDashboardData()
      queryClient.invalidateQueries({ queryKey: ['game', importedGame.game.id] })
      
      showToast(`Imported ${importedGame.game.name}`, 'success')
    },
    onError: () => {
      showToast('Failed to import game', 'error')
    },
  })

  const handleImport = () => {
    const names = gameNames
      .split('\n')
      .map((n) => n.trim())
      .filter((n) => n.length > 0)

    if (names.length === 0) {
      return
    }

    if (!selectedPlatform) {
      return
    }

    setResults(null)
    importMutation.mutate({
      names,
      platformId: selectedPlatform,
    })
  }

  const sidebarContent = (
    <ImportSidebar
      platforms={platforms}
      selectedPlatform={selectedPlatform}
      onPlatformSelect={setSelectedPlatform}
      isImporting={importMutation.isPending}
    />
  )

  return (
    <PageLayout sidebar={sidebarContent}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-2">
          Import Games
        </h1>
        <p className="text-gray-400 mb-8">
          Paste game names (one per line) and we'll automatically enrich them with metadata
        </p>

        {platforms.length === 0 && (
          <div className="card mb-8">
            <p className="text-gray-400">
              You have not selected any platforms yet. Choose your platforms to start importing.
            </p>
            <div className="mt-4">
              <Link to="/platforms" className="btn btn-primary">
                Choose Platforms
              </Link>
            </div>
          </div>
        )}

        <div className="card mb-8">
          <div className="mb-6">
            <label className="block text-sm font-medium mb-3">Platform (Required)</label>
            <div className="flex gap-2 flex-wrap">
              {platforms.map((platform) => (
                <button
                  key={platform.id}
                  type="button"
                  onClick={() => setSelectedPlatform(platform.id)}
                  disabled={importMutation.isPending}
                  className={`px-4 py-2 rounded border transition-all ${
                    selectedPlatform === platform.id
                      ? 'bg-primary-purple border-purple-500 text-white shadow-glow-purple'
                      : 'bg-bg-secondary border-zinc-700 text-zinc-400 hover:border-zinc-500'
                  }`}
                >
                  {platform.display_name}
                </button>
              ))}
            </div>
            {selectedPlatform && (
              <p className="text-xs text-primary-cyan mt-2">
                Games will be imported to {platforms.find((p) => p.id === selectedPlatform)?.display_name}
              </p>
            )}
          </div>

          <label className="block text-sm font-medium mb-2">Game Names</label>
          <textarea
            value={gameNames}
            onChange={(e) => setGameNames(e.target.value)}
            className="input w-full min-h-[300px] font-mono text-sm"
            placeholder={'The Witcher 3\nGod of War\nHalo Infinite\nCyberpunk 2077\nElden Ring'}
            disabled={importMutation.isPending}
          />

          <div className="mt-4 flex gap-4">
            <button
              onClick={handleImport}
              disabled={importMutation.isPending || !gameNames.trim() || !selectedPlatform}
              className="btn btn-primary"
            >
              {importMutation.isPending ? 'Importing...' : 'Import Games'}
            </button>

            {results && results.imported.length > 0 && results.needsReview.length === 0 && (
              <Link to="/library" className="btn btn-primary">
                View Library
              </Link>
            )}
            
            {results && (
              <button
                onClick={() => {
                  setGameNames('')
                  setResults(null)
                }}
                className="btn btn-secondary"
              >
                Clear
              </button>
            )}
          </div>

          {importMutation.isError && (
            <div className="mt-4 bg-primary-red/20 border border-primary-red text-primary-red px-4 py-2 rounded">
              Failed to import games. Please try again.
            </div>
          )}
        </div>

        {importMutation.isPending && (
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-primary-purple border-t-transparent rounded-full animate-spin" />
              <span className="text-zinc-400">Importing and enriching games...</span>
            </div>
          </div>
        )}

        {results && (
          <div className="space-y-6">
            {results.imported.length > 0 && (
              <div className="card">
                <h2 className="text-2xl font-bold mb-4 text-primary-green">
                  Successfully Imported ({results.imported.length})
                </h2>
                <div className="space-y-3">
                  {results.imported.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-4 p-3 bg-bg-secondary rounded border border-zinc-700"
                    >
                      {(item.display?.cover_art_url || item.game.cover_art_url) ? (
                        <img
                          src={item.display?.cover_art_url || item.game.cover_art_url || undefined}
                          alt={item.display?.name || item.game.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-zinc-800 rounded flex items-center justify-center">
                          <span className="text-zinc-600 text-xs">No image</span>
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-medium">{item.display?.name || item.game.name}</h3>
                        <p className="text-sm text-zinc-500">
                          {item.source === 'exact' ? 'Exact match' : 'Selected'}
                        </p>
                      </div>
                      <div className="text-primary-green">
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.needsReview.length > 0 && (
              <div className="card">
                <h2 className="text-2xl font-bold mb-4 text-primary-yellow">
                  Needs Review ({results.needsReview.length})
                </h2>
                <div className="space-y-4">
                  {results.needsReview.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-bg-secondary rounded border border-zinc-700"
                    >
                      <h3 className="font-medium mb-2">"{item.searchTerm}"</h3>
                      {item.error ? (
                        <p className="text-sm text-primary-red">Error: {item.error}</p>
                      ) : item.candidates.length === 0 ? (
                        <p className="text-sm text-zinc-500">No matches found</p>
                      ) : (
                        <div className="space-y-2 mt-3">
                          <p className="text-sm text-zinc-500">
                            Found {item.candidates.length} possible matches:
                          </p>
                          {item.candidates.map((candidate) => (
                            <div
                              key={candidate.id}
                              className="flex items-center gap-3 p-2 bg-bg-hover rounded"
                            >
                              {candidate.background_image && (
                                <img
                                  src={candidate.background_image}
                                  alt={candidate.name}
                                  className="w-12 h-12 object-cover rounded"
                                />
                              )}
                              <div className="flex-1">
                                <p className="text-sm font-medium">{candidate.name}</p>
                                {candidate.released && (
                                  <p className="text-xs text-zinc-500">{candidate.released}</p>
                                )}
                              </div>
                              <button
                                onClick={() =>
                                  selectMutation.mutate({
                                    rawgId: candidate.id,
                                    platformId: selectedPlatform,
                                  })
                                }
                                disabled={selectMutation.isPending}
                                className="btn btn-primary text-sm px-3 py-1"
                              >
                                {selectMutation.isPending ? 'Importing...' : 'Select'}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </PageLayout>
  )
}
