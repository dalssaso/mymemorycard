import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { preferencesAPI } from "@/lib/api"
import { getToken } from "@/lib/auth-storage"

interface SidebarContextType {
  isCollapsed: boolean
  toggleSidebar: () => void
  setCollapsed: (collapsed: boolean) => void
}

const SidebarContext = createContext<SidebarContextType | null>(null)

const STORAGE_KEY = "sidebar-collapsed"

export function SidebarProvider({ children }: { children: ReactNode }): JSX.Element {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === "true"
  })
  const debounceRef = useRef<number | null>(null)

  useEffect(() => {
    const loadPreferences = async () => {
      if (!getToken()) return
      try {
        const response = await preferencesAPI.get()
        const saved = response.data?.preferences?.sidebar_collapsed
        if (typeof saved === "boolean") {
          setIsCollapsed(saved)
        }
      } catch {
        // Ignore failed preference loads.
      }
    }

    loadPreferences()
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(isCollapsed))

    if (!getToken()) return
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current)
    }

    debounceRef.current = window.setTimeout(() => {
      preferencesAPI.update({ sidebar_collapsed: isCollapsed }).catch(() => {
        // Ignore failed preference updates.
      })
    }, 500)

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current)
      }
    }
  }, [isCollapsed])

  const toggleSidebar = useCallback(() => setIsCollapsed((prev) => !prev), [])
  const setCollapsed = useCallback((collapsed: boolean) => setIsCollapsed(collapsed), [])

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleSidebar, setCollapsed }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar(): SidebarContextType {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}
