import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { gamesAPI } from '@/lib/api'
import { useToast } from '@/components/ui/Toast'

interface RawgIdCorrectionProps {
  gameId: string
  currentRawgId: number | null
  gameName: string
}

export function RawgIdCorrection({ gameId, currentRawgId, gameName }: RawgIdCorrectionProps) {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [isExpanded, setIsExpanded] = useState(false)
  const [rawgInput, setRawgInput] = useState('')
  const [error, setError] = useState<string | null>(null)

  const updateMutation = useMutation({
    mutationFn: (options: { rawgId?: number; rawgSlug?: string }) => 
      gamesAPI.updateFromRawg(gameId, options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game', gameId] })
      queryClient.invalidateQueries({ queryKey: ['games'] })
      showToast('Game metadata updated from RAWG', 'success')
      setIsExpanded(false)
      setRawgInput('')
      setError(null)
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      const message = err.response?.data?.error || 'Failed to update game metadata'
      setError(message)
      showToast(message, 'error')
    },
  })

  const handleSubmit = () => {
    setError(null)
    const input = rawgInput.trim()

    if (!input) {
      setError('Please enter a RAWG URL or slug')
      return
    }

    // Check if it's a numeric ID
    const numericId = parseInt(input, 10)
    if (!isNaN(numericId) && numericId > 0 && String(numericId) === input) {
      updateMutation.mutate({ rawgId: numericId })
      return
    }

    // Otherwise treat it as a slug
    updateMutation.mutate({ rawgSlug: input })
  }

  const extractRawgSlug = (input: string): string => {
    // Extract slug from URL like https://rawg.io/games/god-of-war-2
    const urlMatch = input.match(/rawg\.io\/games\/([^/\s?#]+)/)
    if (urlMatch) {
      return urlMatch[1]
    }

    // Already a slug or ID
    return input
  }

  const handleInputChange = (value: string) => {
    setError(null)
    const extracted = extractRawgSlug(value.trim())
    setRawgInput(extracted)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-400">RAWG ID</span>
        {currentRawgId && (
          <span className="text-xs text-gray-500">Current: {currentRawgId}</span>
        )}
      </div>

      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full py-2 px-4 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-300 transition-colors flex items-center justify-between"
      >
        <span>Correct Game Metadata</span>
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
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 space-y-4">
          <div className="text-sm text-gray-300">
            <p className="mb-2">
              If this game has wrong metadata (wrong cover, wrong description, etc.), 
              you can correct it by providing the correct RAWG game page URL.
            </p>
          </div>

          <div className="bg-primary-cyan/10 border border-primary-cyan/30 rounded-lg p-3">
            <p className="text-sm text-primary-cyan font-medium mb-2">How to find the correct game:</p>
            <ol className="text-xs text-gray-300 space-y-1.5 list-decimal list-inside">
              <li>
                Go to{' '}
                <a
                  href={`https://rawg.io/search?query=${encodeURIComponent(gameName)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-cyan hover:underline"
                >
                  RAWG.io and search for "{gameName}"
                </a>
              </li>
              <li>Click on the correct game in the results</li>
              <li>Copy the URL from your browser (e.g., <code className="bg-gray-800 px-1 rounded">rawg.io/games/<strong>god-of-war-2</strong></code>)</li>
              <li>Paste the URL or just the slug below</li>
            </ol>
          </div>

          <div>
            <label htmlFor="rawg-input" className="block text-sm text-gray-400 mb-2">
              RAWG URL or Slug
            </label>
            <input
              id="rawg-input"
              type="text"
              value={rawgInput}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="e.g., god-of-war-2 or https://rawg.io/games/god-of-war-2"
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary-cyan"
            />
            {error && (
              <p className="text-sm text-red-400 mt-2">{error}</p>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={updateMutation.isPending || !rawgInput}
              className="flex-1 py-2 bg-primary-purple hover:bg-primary-purple/80 rounded-lg font-semibold transition-all disabled:opacity-50"
            >
              {updateMutation.isPending ? 'Updating...' : 'Update Metadata'}
            </button>
            <button
              onClick={() => {
                setIsExpanded(false)
                setRawgInput('')
                setError(null)
              }}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all"
            >
              Cancel
            </button>
          </div>

          <p className="text-xs text-gray-500">
            This will update the game's name, cover art, description, genres, and other metadata from RAWG.
          </p>
        </div>
      )}
    </div>
  )
}
