import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { gamesAPI } from '@/lib/api'
import { PlatformIcons } from './PlatformIcon'

interface GameFromAPI {
  id: string
  name: string
  cover_art_url: string | null
  platform_id: string
  platform_display_name: string
  notes: string | null
}

interface AggregatedGame {
  id: string
  name: string
  cover_art_url: string | null
  platforms: { id: string; displayName: string }[]
  notes: string | null
}

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<Element | null>(null)
  const navigate = useNavigate()

  const closeModal = useCallback(() => {
    setIsOpen(false)
    setSearchQuery('')
    // Return focus to the element that triggered the modal
    if (triggerRef.current instanceof HTMLElement) {
      triggerRef.current.focus()
    }
  }, [])

  const { data } = useQuery({
    queryKey: ['games'],
    queryFn: async () => {
      const response = await gamesAPI.getAll()
      return response.data as { games: GameFromAPI[] }
    },
  })

  const rawGames = data?.games || []

  // Aggregate games by ID to handle multiple platforms
  const games = useMemo(() => {
    const gameMap = new Map<string, AggregatedGame>()
    
    for (const game of rawGames) {
      const existing = gameMap.get(game.id)
      if (existing) {
        existing.platforms.push({
          id: game.platform_id,
          displayName: game.platform_display_name,
        })
      } else {
        gameMap.set(game.id, {
          id: game.id,
          name: game.name,
          cover_art_url: game.cover_art_url,
          platforms: [{
            id: game.platform_id,
            displayName: game.platform_display_name,
          }],
          notes: game.notes,
        })
      }
    }
    
    return Array.from(gameMap.values())
  }, [rawGames])

  // Filter games based on search query
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    
    const query = searchQuery.toLowerCase()
    return games.filter((game) => {
      const nameMatch = game.name.toLowerCase().includes(query)
      const notesMatch = game.notes?.toLowerCase().includes(query)
      return nameMatch || notesMatch
    }).slice(0, 10)
  }, [games, searchQuery])

  // Reset selected index when search results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [searchQuery])

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        // Store the currently focused element before opening
        triggerRef.current = document.activeElement
        setIsOpen(true)
      }
      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault()
        closeModal()
      }

      // Arrow navigation and Enter selection when modal is open
      if (isOpen && searchResults.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setSelectedIndex((prev) => (prev + 1) % searchResults.length)
        } else if (e.key === 'ArrowUp') {
          e.preventDefault()
          setSelectedIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length)
        } else if (e.key === 'Enter' && searchResults[selectedIndex]) {
          e.preventDefault()
          handleSelectGame(searchResults[selectedIndex].id)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, searchResults, selectedIndex, closeModal])

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Focus trap - keep focus within modal when open
  useEffect(() => {
    if (!isOpen || !modalRef.current) return

    const modal = modalRef.current
    const focusableElements = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    modal.addEventListener('keydown', handleTabKey)
    return () => modal.removeEventListener('keydown', handleTabKey)
  }, [isOpen])

  const handleSelectGame = (gameId: string) => {
    closeModal()
    navigate({ to: '/library/$id', params: { id: gameId } })
  }

  if (!isOpen) {
    return null
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-start justify-center z-50 p-4 pt-24"
      role="dialog"
      aria-modal="true"
      aria-label="Search games"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        onClick={closeModal}
        aria-hidden="true"
      />

      {/* Search Modal */}
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl bg-gray-900 border border-gray-700 rounded-lg shadow-2xl"
      >
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
            aria-label="Search games by name or notes"
            aria-controls="search-results"
            aria-autocomplete="list"
            className="flex-1 bg-transparent text-white text-lg focus:outline-none"
          />
          <kbd className="px-2 py-1 text-xs text-gray-400 bg-gray-800 border border-gray-700 rounded">
            ESC
          </kbd>
        </div>

        {/* Screen reader announcement for search results */}
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {searchQuery.trim() !== '' && (
            searchResults.length === 0
              ? `No games found matching ${searchQuery}`
              : `${searchResults.length} game${searchResults.length === 1 ? '' : 's'} found`
          )}
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
            <div id="search-results" className="py-2" role="listbox" aria-label="Search results">
              {searchResults.map((game, index) => (
                <button
                  key={game.id}
                  onClick={() => handleSelectGame(game.id)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center gap-4 px-4 py-3 transition-colors text-left ${
                    index === selectedIndex
                      ? 'bg-primary-purple/20 border-l-2 border-primary-purple'
                      : 'hover:bg-gray-800'
                  }`}
                  role="option"
                  aria-selected={index === selectedIndex}
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
                    <PlatformIcons platforms={game.platforms.map(p => p.displayName)} size="sm" />
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
