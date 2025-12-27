import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { displayEditionAPI, DisplayEditionData, RawgEditionOption } from '@/lib/api'
import { useToast } from '@/components/ui/Toast'

interface EditionSwitcherProps {
  gameId: string
  platformId: string
}

export function EditionSwitcher({ gameId, platformId }: EditionSwitcherProps) {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [isExpanded, setIsExpanded] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['displayEdition', gameId, platformId],
    queryFn: async () => {
      const response = await displayEditionAPI.get(gameId, platformId)
      return response.data as DisplayEditionData
    },
    enabled: !!platformId,
  })

  const setEditionMutation = useMutation({
    mutationFn: (edition: RawgEditionOption) =>
      displayEditionAPI.set(gameId, {
        platformId,
        rawgEditionId: edition.rawg_id,
        editionName: edition.name,
        coverArtUrl: edition.cover_url,
        backgroundImageUrl: edition.background_url,
        description: edition.description,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['displayEdition', gameId] })
      queryClient.invalidateQueries({ queryKey: ['game', gameId] })
      queryClient.invalidateQueries({ queryKey: ['games'] })
      showToast('Display edition updated', 'success')
      setIsExpanded(false)
    },
    onError: () => {
      showToast('Failed to update display edition', 'error')
    },
  })

  const resetEditionMutation = useMutation({
    mutationFn: () => displayEditionAPI.reset(gameId, platformId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['displayEdition', gameId] })
      queryClient.invalidateQueries({ queryKey: ['game', gameId] })
      queryClient.invalidateQueries({ queryKey: ['games'] })
      showToast('Reset to base game', 'success')
    },
    onError: () => {
      showToast('Failed to reset edition', 'error')
    },
  })

  if (isLoading) {
    return (
      <div className="animate-pulse h-10 bg-gray-700 rounded" />
    )
  }

  const hasEditions = data && data.availableEditions.length > 0
  const isUsingEdition = data?.isUsingEdition

  if (!hasEditions && !isUsingEdition) {
    return null
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-400">Game Version</span>
        {isUsingEdition && (
          <button
            onClick={() => resetEditionMutation.mutate()}
            disabled={resetEditionMutation.isPending}
            className="text-xs text-gray-500 hover:text-primary-cyan transition-colors disabled:opacity-50"
          >
            Reset to Base Game
          </button>
        )}
      </div>

      {isUsingEdition && data?.currentDisplay && (
        <div className="bg-primary-purple/10 border border-primary-purple/30 rounded-lg p-3">
          <div className="text-sm text-white whitespace-normal break-words">
            {data.currentDisplay.edition_name}
          </div>
          <div className="text-xs text-primary-purple mt-1">Currently displaying</div>
        </div>
      )}

      {!isUsingEdition && data?.baseGame && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
          <div className="text-sm text-white whitespace-normal break-words">
            {data.baseGame.name}
          </div>
          <div className="text-xs text-gray-500 mt-1">Base game</div>
        </div>
      )}

      {hasEditions && (
        <>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full py-2 px-4 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-300 transition-colors flex items-center justify-between"
          >
            <span>Switch to Different Edition</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          {isExpanded && (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {data.availableEditions.map((edition) => (
                <button
                  key={edition.rawg_id}
                  onClick={() => setEditionMutation.mutate(edition)}
                  disabled={setEditionMutation.isPending}
                  className="w-full flex items-start gap-3 p-3 rounded-lg border border-gray-700 hover:border-primary-purple bg-gray-900/50 hover:bg-gray-900 transition-all text-left disabled:opacity-50"
                >
                  {edition.cover_url && (
                    <img
                      src={edition.cover_url}
                      alt={edition.name}
                      className="w-16 h-20 object-cover rounded shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white whitespace-normal break-words leading-snug">
                      {edition.name}
                    </div>
                    <div className="text-xs text-primary-cyan mt-2">
                      Click to use this edition's metadata
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <p className="text-xs text-gray-500">
        Switching editions changes the displayed name, cover art, and description. Achievements are always from the base game.
      </p>
    </div>
  )
}
