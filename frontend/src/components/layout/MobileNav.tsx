import { Link, useRouterState } from '@tanstack/react-router'
import { useGlobalSearch } from '@/components/GlobalSearch'
import { useAuth } from '@/contexts/AuthContext'

export function MobileNav() {
  const { user } = useAuth()
  const { openSearch } = useGlobalSearch()
  const locationHref = useRouterState({ select: (state) => state.location.href })

  const getNavLinkClass = (isActive: boolean) => (
    `flex flex-col items-center justify-center rounded-lg transition-colors ${
      isActive
        ? 'text-ctp-mauve bg-ctp-mauve/10'
        : 'text-ctp-subtext0 hover:text-ctp-text hover:bg-ctp-surface0'
    }`
  )
  
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-ctp-mantle border-t border-ctp-surface0 z-50">
      <div className="h-full grid grid-cols-7 gap-1">
        <Link
          to="/dashboard"
          className={getNavLinkClass(locationHref.includes('/dashboard'))}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-xs mt-1">Home</span>
        </Link>

        <Link
          to="/library"
          className={getNavLinkClass(locationHref.includes('/library'))}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span className="text-xs mt-1">Library</span>
        </Link>

        <Link
          to="/collections"
          className={getNavLinkClass(locationHref.includes('/collections'))}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span className="text-xs mt-1">Collections</span>
        </Link>

        <Link
          to="/franchises"
          className={getNavLinkClass(locationHref.includes('/franchises'))}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <span className="text-xs mt-1">Franchises</span>
        </Link>

        <Link
          to="/import"
          className={getNavLinkClass(locationHref.includes('/import'))}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-xs mt-1">Import</span>
        </Link>

        <button
          type="button"
          onClick={(event) => openSearch(event.currentTarget)}
          className="flex flex-col items-center justify-center text-ctp-subtext0 hover:text-ctp-text transition-colors"
          aria-label="Search games"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <span className="text-xs mt-1">Search</span>
        </button>

        <div className="flex flex-col items-center justify-center text-ctp-subtext0">
          <div className="w-6 h-6 bg-gradient-to-br from-primary-cyan to-primary-purple rounded-full flex items-center justify-center">
            <span className="text-ctp-text font-medium text-xs">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <span className="text-xs mt-1">Profile</span>
        </div>
      </div>
    </nav>
  )
}
