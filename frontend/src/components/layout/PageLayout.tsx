import { ReactNode } from 'react'
import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'

export interface PageLayoutProps {
  children: ReactNode
  sidebar?: ReactNode
}

export function PageLayout({ children, sidebar }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Navbar */}
      <Navbar />

      {/* Main Content Area with Sidebar */}
      <div className="pt-16 md:pb-0 pb-16">
        {/* Sidebar */}
        <Sidebar>{sidebar}</Sidebar>

        {/* Main Content */}
        <main className="md:ml-60 min-h-[calc(100vh-4rem)]">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  )
}
