import { Link } from '@tanstack/react-router'
import { useAuth } from '@/contexts/AuthContext'

export function MobileNav() {
  const { user } = useAuth()
  
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-gray-900 border-t border-gray-800 z-50">
      <div className="h-full grid grid-cols-6 gap-1">
        <Link
          to="/dashboard"
          className="flex flex-col items-center justify-center text-gray-400 hover:text-white transition-colors"
          activeProps={{
            className: 'text-primary-purple'
          }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-xs mt-1">Home</span>
        </Link>

        <Link
          to="/library"
          className="flex flex-col items-center justify-center text-gray-400 hover:text-white transition-colors"
          activeProps={{
            className: 'text-primary-purple'
          }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span className="text-xs mt-1">Library</span>
        </Link>

        <Link
          to="/collections"
          className="flex flex-col items-center justify-center text-gray-400 hover:text-white transition-colors"
          activeProps={{
            className: 'text-primary-purple'
          }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span className="text-xs mt-1">Collections</span>
        </Link>

        <Link
          to="/franchises"
          className="flex flex-col items-center justify-center text-gray-400 hover:text-white transition-colors"
          activeProps={{
            className: 'text-primary-purple'
          }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <span className="text-xs mt-1">Franchises</span>
        </Link>

        <Link
          to="/import"
          className="flex flex-col items-center justify-center text-gray-400 hover:text-white transition-colors"
          activeProps={{
            className: 'text-primary-purple'
          }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-xs mt-1">Import</span>
        </Link>

        <div className="flex flex-col items-center justify-center text-gray-400">
          <div className="w-6 h-6 bg-gradient-to-br from-primary-cyan to-primary-purple rounded-full flex items-center justify-center">
            <span className="text-white font-medium text-xs">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <span className="text-xs mt-1">Profile</span>
        </div>
      </div>
    </nav>
  )
}
