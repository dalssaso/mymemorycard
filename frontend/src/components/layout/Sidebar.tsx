import { ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useSidebar } from '@/contexts/SidebarContext'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { gamesAPI, collectionsAPI } from '@/lib/api'

export interface SidebarProps {
  children?: ReactNode
}

export function Sidebar({ children }: SidebarProps) {
  const { user } = useAuth()
  const { isCollapsed, toggleSidebar } = useSidebar()

  // Fetch games for stats
  const { data } = useQuery({
    queryKey: ['games'],
    queryFn: async () => {
      const response = await gamesAPI.getAll()
      return response.data as { games: any[] }
    },
  })

  // Fetch collections
  const { data: collectionsData } = useQuery({
    queryKey: ['collections'],
    queryFn: async () => {
      const response = await collectionsAPI.getAll()
      return response.data as { collections: Array<{ id: string; name: string; game_count: number }> }
    },
  })

  const games = data?.games || []
  const totalGames = games.length
  const playingGames = games.filter((g) => g.status === 'playing').length
  const completedGames = games.filter((g) => g.status === 'completed' || g.status === 'finished').length
  const favoriteGames = games.filter((g) => g.is_favorite === true).length
  const collections = collectionsData?.collections || []

  return (
    <>
      {/* Collapse Toggle Button - positioned outside sidebar to avoid overflow clipping */}
      <button
        onClick={toggleSidebar}
        className={`hidden md:flex fixed top-20 z-20 w-6 h-6 bg-gray-800 border border-gray-700 rounded-full items-center justify-center hover:bg-gray-700 hover:border-gray-600 transition-all duration-300 ${
          isCollapsed ? 'left-[52px]' : 'left-[228px]'
        }`}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <svg
          className={`w-3 h-3 text-gray-400 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <aside
        className={`hidden md:block fixed left-0 top-16 bottom-0 bg-gray-900 border-r border-gray-800 overflow-y-auto transition-all duration-300 ${
          isCollapsed ? 'w-16' : 'w-60'
        }`}
      >

      {/* Collapsed View - Icons Only */}
      {isCollapsed && (
        <div className="p-2 space-y-4 pt-10">
          {/* User Avatar */}
          <div className="flex justify-center pb-3 border-b border-gray-800">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-cyan to-primary-purple rounded-full flex items-center justify-center" title={user?.username}>
              <span className="text-white font-medium text-sm">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
          </div>

          {/* Quick Stats Icons */}
          <div className="space-y-3">
            <div className="flex flex-col items-center gap-1" title="Total Games">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span className="text-xs text-white font-medium">{totalGames}</span>
            </div>
            <div className="flex flex-col items-center gap-1" title="Playing">
              <svg className="w-5 h-5 text-primary-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs text-primary-cyan font-medium">{playingGames}</span>
            </div>
            <div className="flex flex-col items-center gap-1" title="Completed">
              <svg className="w-5 h-5 text-primary-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs text-primary-green font-medium">{completedGames}</span>
            </div>
            <div className="flex flex-col items-center gap-1" title="Favorites">
              <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              <span className="text-xs text-red-400 font-medium">{favoriteGames}</span>
            </div>
          </div>

          {/* Collections Icon */}
          {collections.length > 0 && (
            <div className="pt-3 border-t border-gray-800">
              <Link
                to="/collections"
                className="flex flex-col items-center gap-1 hover:text-primary-purple transition-colors"
                title="Collections"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span className="text-xs text-gray-400 font-medium">{collections.length}</span>
              </Link>
            </div>
          )}

          {/* Context-Sensitive Content (Collapsed) */}
          {children}
        </div>
      )}

      {/* Expanded View - Full Content */}
      {!isCollapsed && (
        <div className="p-4 space-y-6">
          {/* User Section */}
          <div className="pb-4 border-b border-gray-800">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-cyan to-primary-purple rounded-full flex items-center justify-center">
                <span className="text-white font-medium">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.username}
                </p>
                <p className="text-xs text-gray-400">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Quick Stats
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <span className="text-gray-400">Total Games</span>
                </div>
                <span className="text-white font-medium">{totalGames}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-primary-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-400">Playing</span>
                </div>
                <span className="text-primary-cyan font-medium">{playingGames}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-primary-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-400">Completed</span>
                </div>
                <span className="text-primary-green font-medium">{completedGames}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                  <span className="text-gray-400">Favorites</span>
                </div>
                <span className="text-red-400 font-medium">{favoriteGames}</span>
              </div>
            </div>
          </div>

          {/* Collections */}
          {collections.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                My Collections
              </h3>
              <div className="space-y-1">
                {collections.slice(0, 5).map((collection) => (
                  <Link
                    key={collection.id}
                    to="/collections/$id"
                    params={{ id: collection.id }}
                    className="flex items-center justify-between text-sm px-2 py-1.5 rounded hover:bg-gray-800 transition-colors"
                  >
                    <span className="text-gray-300 truncate">{collection.name}</span>
                    <span className="text-gray-500 text-xs">{collection.game_count}</span>
                  </Link>
                ))}
                {collections.length > 5 && (
                  <Link
                    to="/collections"
                    className="text-xs text-primary-cyan hover:text-primary-purple transition-colors block px-2 py-1"
                  >
                    View all ({collections.length})
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Context-Sensitive Content */}
          {children && (
            <div>
              {children}
            </div>
          )}
        </div>
      )}
      </aside>
    </>
  )
}
