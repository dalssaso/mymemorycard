import { useEffect } from "react"
import { useNavigate, useRouterState } from "@tanstack/react-router"

const AUTH_EVENT = "auth:unauthorized"

export function AuthRedirectListener(): JSX.Element | null {
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  useEffect(() => {
    const handleUnauthorized = () => {
      const isAuthRoute = pathname === "/login" || pathname === "/register"
      if (isAuthRoute) return
      navigate({ to: "/login", replace: true })
    }

    window.addEventListener(AUTH_EVENT, handleUnauthorized)
    return () => window.removeEventListener(AUTH_EVENT, handleUnauthorized)
  }, [navigate, pathname])

  return null
}
