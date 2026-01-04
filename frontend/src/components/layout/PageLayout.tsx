import { useEffect, type ReactNode } from "react"
import { useLayout } from "./LayoutContext"

export interface PageLayoutProps {
  children: ReactNode
  sidebar?: ReactNode
  customCollapsed?: boolean
  showBackButton?: boolean
}

export function PageLayout({
  children,
  sidebar,
  customCollapsed = false,
  showBackButton = true,
}: PageLayoutProps) {
  const { setLayout, resetLayout } = useLayout()

  useEffect(() => {
    setLayout({
      sidebar: sidebar ?? null,
      customCollapsed,
      showBackButton,
    })

    return () => resetLayout()
  }, [customCollapsed, resetLayout, setLayout, showBackButton, sidebar])

  return (
    <div className="min-h-[calc(100vh-4rem)]">{children}</div>
  )
}
