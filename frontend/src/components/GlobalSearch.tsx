import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { gamesAPI } from '@/lib/api'

interface Game {
  id: string
  name: string
  cover_art_url: string | null
  platform_display_name: string
  notes: string | null
}

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const { data } = useQuery({
    queryKey: ['games'],
    queryFn: async () => {
      const response = await gamesAPI.getAll()
      return response.data as { games: Game[] }
    },
  })

  const games = data?.games || []

  // Filter games based on search query
  const searchResults = searchQuery.trim()
    ? games.filter((game) => {
        const query = searchQuery.toLowerCase()
        const nameMatch = game.name.toLowerCase().includes(query)
        const notesMatch = game.notes?.toLowerCase().includes(query)
        return nameMatch || notesMatch
      }).slice(0, 10)
    : []

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
      }
      // Escape to close
      if (e.key === 'Escape') {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleSelectGame = (gameId: string) => {
    setIsOpen(false)
    setSearchQuery('')
    navigate({ to: '/library/$id', params: { id: gameId } })
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-start justify-center z-50 p-4 pt-24">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        onClick={() => {
          setIsOpen(false)
          setSearchQuery('')
        }}
      />

      {/* Search Modal */}
      <div className="relative w-full max-w-2xl bg-gray-900 border border-gray-700 rounded-lg shadow-2xl">
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-700">
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search games by name or notes..."
            className="flex-1 bg-transparent text-white text-lg focus:outline-none"
          />
          <kbd className="px-2 py-1 text-xs text-gray-400 bg-gray-800 border border-gray-700 rounded">
            ESC
          </kbd>
        </div>

        {/* Search Results */}
        <div className="max-h-96 overflow-y-auto">
          {searchQuery.trim() === '' ? (
            <div className="p-8 text-center text-gray-400">
              <p className="mb-2">Start typing to search your library</p>
              <p className="text-sm text-gray-500">
                Search by game name or notes content
              </p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No games found matching "{searchQuery}"
            </div>
          ) : (
            <div className="py-2">
              {searchResults.map((game) => (
                <button
                  key={game.id}
                  onClick={() => handleSelectGame(game.id)}
                  className="w-full flex items-center gap-4 px-4 py-3 hover:bg-gray-800 transition-colors text-left"
                >
                  {game.cover_art_url ? (
                    <img
                      src={game.cover_art_url}
                      alt={game.name}
                      className="w-12 h-16 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-16 bg-gray-800 rounded flex items-center justify-center">
                      <span className="text-gray-600 text-xs">No img</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium truncate">{game.name}</div>
                    <div className="text-sm text-gray-400">{game.platform_display_name}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-700 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-gray-800 border border-gray-700 rounded">↑</kbd>
              <kbd className="px-2 py-1 bg-gray-800 border border-gray-700 rounded">↓</kbd>
              <span>Navigate</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-gray-800 border border-gray-700 rounded">Enter</kbd>
              <span>Select</span>
            </div>
          </div>
          <div>
            <kbd className="px-2 py-1 bg-gray-800 border border-gray-700 rounded">
              {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'} K
            </kbd>
            <span className="ml-1">to open</span>
          </div>
        </div>
      </div>
    </div>
  )
}
