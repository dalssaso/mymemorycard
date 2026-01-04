import type { QueryClient } from "@tanstack/react-query"
import type { AuthContextType } from "@/contexts/AuthContext"

export interface RouterContext {
  auth: AuthContextType
  queryClient: QueryClient
}
