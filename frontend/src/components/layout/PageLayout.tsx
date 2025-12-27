import { ReactNode } from 'react'
import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'
import { useSidebar } from '@/contexts/SidebarContext'

export interface PageLayoutProps {
  children: ReactNode
  sidebar?: ReactNode
  customCollapsed?: boolean
}

export function PageLayout({ children, sidebar, customCollapsed = false }: PageLayoutProps) {
  const { isCollapsed } = useSidebar()

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Navbar */}
      <Navbar />

      {/* Main Content Area with Sidebar */}
      <div className="pt-16 md:pb-0 pb-16">
        {/* Sidebar */}
        <Sidebar customCollapsed={customCollapsed}>{sidebar}</Sidebar>

        {/* Main Content */}
        <main
          className={`min-h-[calc(100vh-4rem)] overflow-x-hidden transition-all duration-300 ${
            isCollapsed ? 'md:ml-16' : 'md:ml-60'
          }`}
        >
          <div className="p-4 sm:p-6">{children}</div>
        </main>
      </div>

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  )
}
