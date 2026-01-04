import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useGlobalSearch } from '@/components/GlobalSearch'
import { PlatformIcons } from '@/components/PlatformIcon'
import { PlatformTypeIcon } from '@/components/PlatformTypeIcon'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { useAuth } from '@/contexts/AuthContext'
import { collectionsAPI, franchisesAPI, gamesAPI, userPlatformsAPI } from '@/lib/api'

type GameSearchItem = {
  type: 'game'
  id: string
  name: string
  imageUrl: string | null
  platforms: Array<{
    displayName: string
    colorPrimary: string
  }>
  index: number
}

type CollectionSearchItem = {
  type: 'collection'
  id: string
  name: string
  imageUrl: string | null
  subtitle: string
  index: number
}

type FranchiseSearchItem = {
  type: 'franchise'
  id: string
  name: string
  imageUrl: string | null
  subtitle: string
  index: number
}

type PlatformSearchItem = {
  type: 'platform'
  id: string
  name: string
  imageUrl: string | null
  subtitle: string
  platformType: string
  color: string
  index: number
}

type SearchItem = GameSearchItem | CollectionSearchItem | FranchiseSearchItem | PlatformSearchItem

type SearchSection = {
  label: string
  items: SearchItem[]
}

export function Navbar() {
  const { user, logout } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const { isOpen } = useGlobalSearch()
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const locationHref = useRouterState({ select: (state) => state.location.href })

  const { data: gamesData } = useQuery({
    queryKey: ['games'],
    queryFn: async () => {
      const response = await gamesAPI.getAll()
      return response.data as {
        games: Array<{
          id: string
          name: string
          cover_art_url: string | null
          platform_id: string
          platform_display_name: string
        }>
      }
    },
  })

  const { data: collectionsData } = useQuery({
    queryKey: ['collections'],
    queryFn: async () => {
      const response = await collectionsAPI.getAll()
      return response.data as {
        collections: Array<{
          id: string
          name: string
          description: string | null
          game_count: number
          cover_art_url: string | null
          cover_filename: string | null
        }>
      }
    },
  })

  const { data: franchisesData } = useQuery({
    queryKey: ['franchises'],
    queryFn: async () => {
      const response = await franchisesAPI.getAll()
      return response.data as {
        franchises: Array<{
          series_name: string
          game_count: number
          cover_art_url: string | null
        }>
      }
    },
  })

  const { data: platformsData } = useQuery({
    queryKey: ['user-platforms'],
    queryFn: async () => {
      const response = await userPlatformsAPI.getAll()
      return response.data as {
        platforms: Array<{
          id: string
          name: string
          display_name: string
          platform_type: string
          username: string | null
          icon_url: string | null
          default_icon_url: string | null
          color_primary: string
        }>
      }
    },
  })

  useEffect(() => {
    if (isOpen) {
      setIsSearchExpanded(false)
    }
  }, [isOpen])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isSearchExpanded) return
      const target = event.target as Node
      if (searchContainerRef.current && !searchContainerRef.current.contains(target)) {
        setIsSearchExpanded(false)
        setSearchQuery('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isSearchExpanded])

  useEffect(() => {
    if (isSearchExpanded) {
      searchInputRef.current?.focus()
    }
  }, [isSearchExpanded])

  const aggregatedGames = useMemo(() => {
    const rawGames = gamesData?.games || []
    const platformColorMap = new Map<string, string>()
    const rawPlatforms = platformsData?.platforms || []
    for (const platform of rawPlatforms) {
      platformColorMap.set(platform.id, platform.color_primary)
    }
    const gameMap = new Map<
      string,
      {
        id: string
        name: string
        cover_art_url: string | null
        platforms: Array<{
          displayName: string
          colorPrimary: string
        }>
      }
    >()

    for (const game of rawGames) {
      const existing = gameMap.get(game.id)
      if (existing) {
        existing.platforms.push({
          displayName: game.platform_display_name,
          colorPrimary: platformColorMap.get(game.platform_id) ?? '#6B7280',
        })
      } else {
        gameMap.set(game.id, {
          id: game.id,
          name: game.name,
          cover_art_url: game.cover_art_url,
          platforms: [
            {
              displayName: game.platform_display_name,
              colorPrimary: platformColorMap.get(game.platform_id) ?? '#6B7280',
            },
          ],
        })
      }
    }

    return Array.from(gameMap.values())
  }, [gamesData, platformsData])

  const searchResults = useMemo<SearchSection[]>(() => {
    if (!searchQuery.trim()) return []
    const query = searchQuery.toLowerCase()
    const collections = collectionsData?.collections || []
    const franchises = franchisesData?.franchises || []
    const platforms = platformsData?.platforms || []
    let index = 0

    const gameResults = aggregatedGames
      .filter((game) => game.name.toLowerCase().includes(query))
      .slice(0, 4)
      .map((game) => ({
        type: 'game' as const,
        id: game.id,
        name: game.name,
        imageUrl: game.cover_art_url,
        platforms: game.platforms,
        index: index++,
      }))

    const collectionResults = collections
      .filter((collection) => {
        const nameMatch = collection.name.toLowerCase().includes(query)
        const descriptionMatch = collection.description?.toLowerCase().includes(query)
        return nameMatch || descriptionMatch
      })
      .slice(0, 3)
      .map((collection) => ({
        type: 'collection' as const,
        id: collection.id,
        name: collection.name,
        imageUrl: collection.cover_filename
          ? `/api/collection-covers/${collection.cover_filename}`
          : collection.cover_art_url,
        subtitle: `${collection.game_count} ${collection.game_count === 1 ? 'game' : 'games'}`,
        index: index++,
      }))

    const franchiseResults = franchises
      .filter((franchise) => franchise.series_name.toLowerCase().includes(query))
      .slice(0, 3)
      .map((franchise) => ({
        type: 'franchise' as const,
        id: franchise.series_name,
        name: franchise.series_name,
        imageUrl: franchise.cover_art_url,
        subtitle: `${franchise.game_count} ${franchise.game_count === 1 ? 'game' : 'games'}`,
        index: index++,
      }))

    const platformResults = platforms
      .filter((platform) => {
        const nameMatch = platform.display_name.toLowerCase().includes(query)
        const altNameMatch = platform.name.toLowerCase().includes(query)
        return nameMatch || altNameMatch
      })
      .slice(0, 3)
      .map((platform) => ({
        type: 'platform' as const,
        id: platform.id,
        name: platform.display_name,
        imageUrl: platform.icon_url || platform.default_icon_url,
        subtitle: platform.username || '',
        platformType: platform.platform_type,
        color: platform.color_primary,
        index: index++,
      }))

    return [
      { label: 'Games', items: gameResults },
      { label: 'Collections', items: collectionResults },
      { label: 'Franchises', items: franchiseResults },
      { label: 'Platforms', items: platformResults },
    ].filter((section) => section.items.length > 0)
  }, [aggregatedGames, collectionsData, franchisesData, platformsData, searchQuery])

  const flatResults = useMemo<SearchItem[]>(
    () => searchResults.flatMap((section) => section.items),
    [searchResults]
  )

  const handleSelectResult = (result: SearchItem) => {
    setIsSearchExpanded(false)
    setSearchQuery('')
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

  const getNavLinkClass = (isActive: boolean) =>
    `px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
      isActive
        ? 'text-ctp-mauve bg-ctp-mauve/10'
        : 'text-ctp-subtext1 hover:text-ctp-text hover:bg-ctp-surface0'
    }`

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 h-16 bg-ctp-mantle border-b border-ctp-surface0 z-50">
        <div className="h-full px-6 flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <img src="/favicon.svg" alt="MyMemoryCard" className="w-8 h-8" />
              <span className="text-ctp-text font-bold text-xl">MyMemoryCard</span>
            </Link>

            {/* Navigation Links - Hidden on mobile */}
            <div className="hidden md:flex items-center space-x-1">
              <Link
                to="/dashboard"
                className={getNavLinkClass(locationHref.includes('/dashboard'))}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                Dashboard
              </Link>
              <Link to="/library" className={getNavLinkClass(locationHref.includes('/library'))}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                Library
              </Link>
              <Link
                to="/collections"
                className={getNavLinkClass(locationHref.includes('/collections'))}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8"
                  />
                </svg>
                Collections
              </Link>
              <Link
                to="/franchises"
                className={getNavLinkClass(locationHref.includes('/franchises'))}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
                Franchises
              </Link>
              <Link
                to="/ai-curator"
                className={getNavLinkClass(locationHref.includes('/ai-curator'))}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
                AI Curator
              </Link>
            </div>
          </div>

          {/* Search + User Menu */}
          <div className="relative flex items-center gap-3">
            <div
              ref={searchContainerRef}
              className={`hidden md:flex items-center gap-2 h-9 border border-ctp-surface1 bg-ctp-surface0/60 rounded-lg px-3 text-ctp-subtext0 transition-all duration-200 overflow-hidden focus-within:border-ctp-mauve ${
                isSearchExpanded ? 'w-72' : 'w-10'
              }`}
            >
              <button
                type="button"
                onClick={() => setIsSearchExpanded(true)}
                className="text-ctp-subtext0 hover:text-ctp-text transition-colors"
                aria-label="Search games"
              >
                <svg
                  className="w-4 h-4 shrink-0"
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
              </button>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search games, collections, franchises, platforms..."
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    setIsSearchExpanded(false)
                    setSearchQuery('')
                  }
                  if (event.key === 'Enter' && flatResults[0]) {
                    event.preventDefault()
                    handleSelectResult(flatResults[0])
                  }
                }}
                className={`bg-transparent text-sm text-ctp-text placeholder-ctp-overlay1 focus:outline-none transition-all duration-200 ${
                  isSearchExpanded ? 'w-full opacity-100' : 'w-0 opacity-0'
                }`}
                aria-label="Search games"
              />
            </div>

            <ThemeToggle />

            {isSearchExpanded && searchQuery.trim() !== '' && (
              <div className="absolute right-0 top-12 w-80 bg-ctp-mantle border border-ctp-surface1 rounded-lg shadow-lg z-50">
                {searchResults.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-ctp-subtext0">No results found</div>
                ) : (
                  <div className="py-2">
                    {searchResults.map((section) => (
                      <div key={section.label} className="px-2 py-2">
                        <div className="px-2 pb-2 text-xs uppercase tracking-wide text-ctp-overlay1">
                          {section.label}
                        </div>
                        <div className="space-y-1">
                          {section.items.map((item) => (
                            <button
                              key={`${item.type}-${item.id}`}
                              type="button"
                              onClick={() => handleSelectResult(item)}
                              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-ctp-subtext1 hover:bg-ctp-surface0 hover:text-ctp-text transition-colors"
                            >
                              <div
                                className="w-9 h-12 rounded overflow-hidden flex-shrink-0"
                                style={
                                  item.type === 'platform'
                                    ? { backgroundColor: item.color }
                                    : undefined
                                }
                              >
                                {item.imageUrl ? (
                                  <img
                                    src={item.imageUrl}
                                    alt={item.name}
                                    className={`w-full h-full ${item.type === 'platform' ? 'object-contain p-1.5' : 'object-cover'}`}
                                  />
                                ) : item.type === 'platform' ? (
                                  <div className="w-full h-full flex items-center justify-center text-ctp-base text-xs font-semibold">
                                    {item.name?.charAt(0).toUpperCase() || '?'}
                                  </div>
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-ctp-overlay1 text-[10px]">
                                    No Cover
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="text-sm font-medium text-ctp-text truncate">
                                    {item.name}
                                  </div>
                                  <span className="text-[10px] uppercase tracking-wide text-ctp-overlay1">
                                    {item.type}
                                  </span>
                                </div>
                                {item.type === 'game' ? (
                                  <div className="mt-1">
                                    <PlatformIcons
                                      platforms={item.platforms}
                                      size="xs"
                                      maxDisplay={3}
                                    />
                                  </div>
                                ) : item.type === 'platform' ? (
                                  <div className="flex items-center gap-2 text-xs text-ctp-overlay1 mt-1">
                                    <PlatformTypeIcon
                                      type={
                                        item.platformType as
                                          | 'pc'
                                          | 'console'
                                          | 'mobile'
                                          | 'physical'
                                      }
                                      size="sm"
                                      showLabel={true}
                                    />
                                    {item.subtitle && (
                                      <span className="text-ctp-overlay1 truncate">
                                        {item.subtitle}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-xs text-ctp-overlay1 mt-1 truncate">
                                    {item.subtitle}
                                  </div>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 px-3 py-2 text-ctp-subtext1 hover:text-ctp-text hover:bg-ctp-surface0 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-ctp-surface1 border border-ctp-surface2 rounded-full flex items-center justify-center">
                  <span className="text-ctp-text font-medium text-sm">
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <span className="hidden md:inline text-sm">{user?.username}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <>
                  {/* Backdrop */}
                  <button
                    type="button"
                    aria-label="Close user menu"
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  />

                  {/* Menu */}
                  <div className="absolute right-0 mt-2 w-48 bg-ctp-surface0 border border-ctp-surface1 rounded-lg shadow-lg z-50">
                    <div className="py-1">
                      <Link
                        to="/settings"
                        onClick={() => setShowUserMenu(false)}
                        className="block w-full text-left px-4 py-2 text-sm text-ctp-subtext1 hover:bg-ctp-surface1 hover:text-ctp-text"
                      >
                        Settings
                      </Link>
                      <button
                        onClick={() => {
                          setShowUserMenu(false)
                          logout()
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-ctp-subtext1 hover:bg-ctp-surface1 hover:text-ctp-text"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}
