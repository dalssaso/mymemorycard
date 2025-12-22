import { ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { gamesAPI } from '@/lib/api'

export interface SidebarProps {
  children?: ReactNode
}

export function Sidebar({ children }: SidebarProps) {
  const { user } = useAuth()

  // Fetch games for stats
  const { data } = useQuery({
    queryKey: ['games'],
    queryFn: async () => {
      const response = await gamesAPI.getAll()
      return response.data as { games: any[] }
    },
  })

  const games = data?.games || []
  const totalGames = games.length
  const playingGames = games.filter((g) => g.status === 'playing').length
  const completedGames = games.filter((g) => g.status === 'completed' || g.status === 'finished').length

  return (
    <aside className="hidden md:block fixed left-0 top-16 bottom-0 w-60 bg-gray-900 border-r border-gray-800 overflow-y-auto">
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
              <span className="text-gray-400">Total Games</span>
              <span className="text-white font-medium">{totalGames}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Playing</span>
              <span className="text-primary-cyan font-medium">{playingGames}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Completed</span>
              <span className="text-primary-green font-medium">{completedGames}</span>
            </div>
          </div>
        </div>

        {/* Context-Sensitive Content */}
        {children && (
          <div>
            {children}
          </div>
        )}
      </div>
    </aside>
  )
}
