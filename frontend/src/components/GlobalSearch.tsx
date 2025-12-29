import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  createContext,
  useContext,
  type MutableRefObject,
  type ReactNode,
} from 'react'
import { ScrollFade } from '@/components/ui'
import { collectionsAPI, franchisesAPI, gamesAPI, userPlatformsAPI } from '@/lib/api'
import { PlatformIcon, PlatformIconBadge } from './PlatformIcon'
import { PlatformTypeIcon } from './PlatformTypeIcon'

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
  platforms: { id: string; displayName: string; colorPrimary: string | null }[]
  notes: string | null
}

interface CollectionFromAPI {
  id: string
  name: string
  description: string | null
  game_count: number
  cover_art_url: string | null
  cover_filename: string | null
}

interface FranchiseFromAPI {
  series_name: string
  game_count: number
  cover_art_url: string | null
}

interface UserPlatformFromAPI {
  id: string
  name: string
  display_name: string
  platform_type: string
  username: string | null
  icon_url: string | null
  default_icon_url: string | null
  color_primary: string
}

type SearchItem =
  | {
      type: 'game'
      id: string
      name: string
      imageUrl: string | null
      platforms: { id: string; displayName: string; colorPrimary: string | null }[]
      notes: string | null
    }
  | {
      type: 'collection'
      id: string
      name: string
      imageUrl: string | null
      subtitle: string
    }
  | {
      type: 'franchise'
      id: string
      name: string
      imageUrl: string | null
      subtitle: string
    }
  | {
      type: 'platform'
      id: string
      name: string
      imageUrl: string | null
      subtitle: string
      platformType: string
      color: string
    }

interface SectionedResults {
  sections: Array<{
    label: string
    items: Array<SearchItem & { index: number }>
  }>
  flatResults: Array<SearchItem & { index: number }>
}

interface GlobalSearchContextValue {
  isOpen: boolean
  openSearch: (trigger?: Element | null) => void
  closeSearch: () => void
  triggerRef: MutableRefObject<Element | null>
}

const GlobalSearchContext = createContext<GlobalSearchContextValue | null>(null)

export function GlobalSearchProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<Element | null>(null)

  const openSearch = useCallback((trigger?: Element | null) => {
    triggerRef.current = trigger ?? document.activeElement
    setIsOpen(true)
  }, [])

  const closeSearch = useCallback(() => {
    setIsOpen(false)
  }, [])

  return (
    <GlobalSearchContext.Provider value={{ isOpen, openSearch, closeSearch, triggerRef }}>
      {children}
    </GlobalSearchContext.Provider>
  )
}

export function useGlobalSearch() {
  const context = useContext(GlobalSearchContext)
  if (!context) {
    throw new Error('useGlobalSearch must be used within GlobalSearchProvider')
  }
  return context
}

export function GlobalSearch() {
  const { isOpen, openSearch, closeSearch, triggerRef } = useGlobalSearch()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const closeModal = useCallback(() => {
    closeSearch()
    setSearchQuery('')
    setSelectedIndex(0)
    if (triggerRef.current instanceof HTMLElement) {
      triggerRef.current.focus()
    }
  }, [closeSearch, triggerRef])

  const { data: gamesData } = useQuery({
    queryKey: ['games'],
    queryFn: async () => {
      const response = await gamesAPI.getAll()
      return response.data as { games: GameFromAPI[] }
    },
  })

  const { data: collectionsData } = useQuery({
    queryKey: ['collections'],
    queryFn: async () => {
      const response = await collectionsAPI.getAll()
      return response.data as { collections: CollectionFromAPI[] }
    },
  })

  const { data: franchisesData } = useQuery({
    queryKey: ['franchises'],
    queryFn: async () => {
      const response = await franchisesAPI.getAll()
      return response.data as { franchises: FranchiseFromAPI[] }
    },
  })

  const { data: userPlatformsData } = useQuery({
    queryKey: ['user-platforms'],
    queryFn: async () => {
      const response = await userPlatformsAPI.getAll()
      return response.data as { platforms: UserPlatformFromAPI[] }
    },
  })

  const rawGames = gamesData?.games || []
  const rawCollections = collectionsData?.collections || []
  const rawFranchises = franchisesData?.franchises || []
  const rawPlatforms = userPlatformsData?.platforms || []

  // Aggregate games by ID to handle multiple platforms
  const games = useMemo(() => {
    const gameMap = new Map<string, AggregatedGame>()
    const platformColorMap = new Map<string, string>()

    for (const platform of rawPlatforms) {
      platformColorMap.set(platform.id, platform.color_primary)
    }

    for (const game of rawGames) {
      const existing = gameMap.get(game.id)
      if (existing) {
        existing.platforms.push({
          id: game.platform_id,
          displayName: game.platform_display_name,
          colorPrimary: platformColorMap.get(game.platform_id) ?? null,
        })
      } else {
        gameMap.set(game.id, {
          id: game.id,
          name: game.name,
          cover_art_url: game.cover_art_url,
          platforms: [{
            id: game.platform_id,
            displayName: game.platform_display_name,
            colorPrimary: platformColorMap.get(game.platform_id) ?? null,
          }],
          notes: game.notes,
        })
      }
    }

    return Array.from(gameMap.values())
  }, [rawGames])

  const searchResults = useMemo<SectionedResults>(() => {
    if (!searchQuery.trim()) {
      return { sections: [], flatResults: [] }
    }

    const query = searchQuery.toLowerCase()
    let index = 0

    const gameItems: Array<SearchItem & { index: number }> = games
      .filter((game) => {
        const nameMatch = game.name.toLowerCase().includes(query)
        const notesMatch = game.notes?.toLowerCase().includes(query)
        return nameMatch || notesMatch
      })
      .slice(0, 10)
      .map((game) => ({
        type: 'game',
        id: game.id,
        name: game.name,
        imageUrl: game.cover_art_url,
        platforms: game.platforms,
        notes: game.notes,
        index: index++,
      }))

    const collectionItems: Array<SearchItem & { index: number }> = rawCollections
      .filter((collection) => {
        const nameMatch = collection.name.toLowerCase().includes(query)
        const descriptionMatch = collection.description?.toLowerCase().includes(query)
        return nameMatch || descriptionMatch
      })
      .slice(0, 10)
      .map((collection) => ({
        type: 'collection',
        id: collection.id,
        name: collection.name,
        imageUrl: collection.cover_filename
          ? `/api/collection-covers/${collection.cover_filename}`
          : collection.cover_art_url,
        subtitle: `${collection.game_count} ${collection.game_count === 1 ? 'game' : 'games'}`,
        index: index++,
      }))

    const franchiseItems: Array<SearchItem & { index: number }> = rawFranchises
      .filter((franchise) => franchise.series_name.toLowerCase().includes(query))
      .slice(0, 10)
      .map((franchise) => ({
        type: 'franchise',
        id: franchise.series_name,
        name: franchise.series_name,
        imageUrl: franchise.cover_art_url,
        subtitle: `${franchise.game_count} ${franchise.game_count === 1 ? 'game' : 'games'}`,
        index: index++,
      }))

    const platformItems: Array<SearchItem & { index: number }> = rawPlatforms
      .filter((platform) => {
        const nameMatch = platform.display_name.toLowerCase().includes(query)
        const altNameMatch = platform.name.toLowerCase().includes(query)
        return nameMatch || altNameMatch
      })
      .slice(0, 10)
      .map((platform) => ({
        type: 'platform',
        id: platform.id,
        name: platform.display_name,
        imageUrl: platform.icon_url || platform.default_icon_url,
        subtitle: platform.username || '',
        platformType: platform.platform_type,
        color: platform.color_primary,
        index: index++,
      }))

    const sections = [
      { label: 'Games', items: gameItems },
      { label: 'Collections', items: collectionItems },
      { label: 'Franchises', items: franchiseItems },
      { label: 'Platforms', items: platformItems },
    ].filter((section) => section.items.length > 0)

    const flatResults = sections.flatMap((section) => section.items)

    return { sections, flatResults }
  }, [games, rawCollections, rawFranchises, rawPlatforms, searchQuery])

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
        openSearch(document.activeElement)
      }
      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault()
        closeModal()
      }

      // Arrow navigation and Enter selection when modal is open
      if (isOpen && searchResults.flatResults.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setSelectedIndex((prev) => (prev + 1) % searchResults.flatResults.length)
        } else if (e.key === 'ArrowUp') {
          e.preventDefault()
          setSelectedIndex((prev) => (prev - 1 + searchResults.flatResults.length) % searchResults.flatResults.length)
        } else if (e.key === 'Enter' && searchResults.flatResults[selectedIndex]) {
          e.preventDefault()
          handleSelectResult(searchResults.flatResults[selectedIndex])
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [closeModal, isOpen, openSearch, searchResults, selectedIndex])

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

  const handleSelectResult = (result: SearchItem) => {
    closeModal()
    if (result.type === 'game') {
      navigate({ to: '/library/$id', params: { id: result.id } })
      return
    }
    if (result.type === 'collection') {
      navigate({ to: '/collections/$id', params: { id: result.id } })
      return
    }
    if (result.type === 'franchise') {
      navigate({ to: '/franchises/$seriesName', params: { seriesName: result.id } })
      return
    }
    if (result.type === 'platform') {
      navigate({ to: '/platforms/$id', params: { id: result.id } })
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div
      className="fixed inset-0 bg-ctp-base/80 flex items-start justify-center z-50 p-4 pt-24"
      role="dialog"
      aria-modal="true"
      aria-label="Search"
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
        className="relative w-full max-w-2xl bg-ctp-mantle border border-ctp-surface1 rounded-lg shadow-2xl"
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b border-ctp-surface1">
          <svg
            className="w-5 h-5 text-ctp-subtext0"
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
            placeholder="Search games, collections, franchises, platforms..."
            aria-label="Search games, collections, franchises, platforms"
            aria-controls="search-results"
            aria-autocomplete="list"
            className="flex-1 bg-transparent text-ctp-text text-lg focus:outline-none"
          />
          <kbd className="px-2 py-1 text-xs text-ctp-subtext0 bg-ctp-surface0 border border-ctp-surface1 rounded">
            ESC
          </kbd>
        </div>

        {/* Screen reader announcement for search results */}
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {searchQuery.trim() !== '' && (
            searchResults.flatResults.length === 0
              ? `No results found matching ${searchQuery}`
              : `${searchResults.flatResults.length} result${searchResults.flatResults.length === 1 ? '' : 's'} found`
          )}
        </div>

        {/* Search Results */}
        <ScrollFade axis="y" className="max-h-96 overflow-y-auto">
          {searchQuery.trim() === '' ? (
            <div className="p-8 text-center text-ctp-subtext0">
              <p className="mb-2">Start typing to search</p>
              <p className="text-sm text-ctp-overlay1">
                Search games, collections, franchises, or platforms
              </p>
            </div>
          ) : searchResults.flatResults.length === 0 ? (
            <div className="p-8 text-center text-ctp-subtext0">
              No results found for "{searchQuery}"
            </div>
          ) : (
            <div id="search-results" className="py-2" role="listbox" aria-label="Search results">
              {searchResults.sections.map((section) => (
                <div key={section.label} className="px-2 py-2">
                  <div className="px-2 pb-2 text-xs uppercase tracking-wide text-ctp-overlay1">
                    {section.label}
                  </div>
                  <div className="space-y-1">
                    {section.items.map((item) => (
                      <button
                        key={`${item.type}-${item.id}`}
                        onClick={() => handleSelectResult(item)}
                        onMouseEnter={() => setSelectedIndex(item.index)}
                        className={`w-full flex items-center gap-4 px-3 py-2 rounded-lg transition-colors text-left ${
                          selectedIndex === item.index
                            ? 'bg-ctp-surface0 text-ctp-text'
                            : 'text-ctp-subtext1 hover:bg-ctp-surface0/50'
                        }`}
                        role="option"
                        aria-selected={selectedIndex === item.index}
                      >
                        <div
                          className="w-12 h-16 rounded overflow-hidden flex-shrink-0"
                          style={item.type === 'platform' ? { backgroundColor: item.color } : undefined}
                        >
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className={`w-full h-full ${item.type === 'platform' ? 'object-contain p-2' : 'object-cover'}`}
                            />
                          ) : item.type === 'platform' ? (
                            <div className="w-full h-full flex items-center justify-center text-ctp-base text-sm font-semibold">
                              {item.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-ctp-overlay1 text-xs">
                              No Cover
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="font-medium text-ctp-text truncate">{item.name}</div>
                            <span className="text-[10px] uppercase tracking-wide text-ctp-overlay1">
                              {item.type}
                            </span>
                          </div>
                          {item.type === 'game' ? (
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {item.platforms.map((platform) => (
                          <div
                            key={platform.id}
                            className="flex items-center gap-1 text-xs text-ctp-subtext0"
                          >
                            {platform.colorPrimary ? (
                              <PlatformIconBadge
                                platform={{
                                  displayName: platform.displayName,
                                  colorPrimary: platform.colorPrimary,
                                  iconUrl: null,
                                }}
                                size="xs"
                              />
                            ) : (
                              <PlatformIcon platform={platform.displayName} size="xs" />
                            )}
                            <span>{platform.displayName}</span>
                          </div>
                        ))}
                            </div>
                          ) : item.type === 'platform' ? (
                            <div className="flex items-center gap-2 text-xs text-ctp-overlay1 mt-1">
                              <PlatformTypeIcon
                                type={item.platformType as 'pc' | 'console' | 'mobile' | 'physical'}
                                size="sm"
                                showLabel={true}
                                color={item.color}
                              />
                              {item.subtitle && <span className="text-ctp-overlay1 truncate">{item.subtitle}</span>}
                            </div>
                          ) : (
                            <div className="text-xs text-ctp-overlay1 mt-1 truncate">
                              {item.subtitle}
                            </div>
                          )}
                          {item.type === 'game' && item.notes && (
                            <div className="text-xs text-ctp-overlay1 mt-1 truncate">{item.notes}</div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollFade>
      </div>
    </div>
  )
}
