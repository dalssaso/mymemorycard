import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"

interface LayoutState {
  sidebar: ReactNode | null
  customCollapsed: boolean
  showBackButton: boolean
}

interface LayoutContextValue extends LayoutState {
  setLayout: (next: LayoutState) => void
  resetLayout: () => void
}

const defaultLayout: LayoutState = {
  sidebar: null,
  customCollapsed: false,
  showBackButton: true,
}

const LayoutContext = createContext<LayoutContextValue | null>(null)

export function LayoutProvider({ children }: { children: ReactNode }): JSX.Element {
  const [layout, setLayoutState] = useState<LayoutState>(defaultLayout)

  const setLayout = useCallback((next: LayoutState) => {
    setLayoutState(next)
  }, [])

  const resetLayout = useCallback(() => {
    setLayoutState(defaultLayout)
  }, [])

  const value = useMemo(
    () => ({
      ...layout,
      setLayout,
      resetLayout,
    }),
    [layout, resetLayout, setLayout]
  )

  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>
}

export function useLayout(): LayoutContextValue {
  const context = useContext(LayoutContext)
  if (!context) {
    throw new Error("useLayout must be used within a LayoutProvider")
  }
  return context
}
