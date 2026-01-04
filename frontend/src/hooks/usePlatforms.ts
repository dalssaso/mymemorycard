import { useQuery, type UseQueryResult } from "@tanstack/react-query"
import { platformsAPI } from "@/lib/api"

export interface PlatformSummary {
  id: string
  name: string
  display_name: string
  platform_type: "pc" | "console" | "mobile" | "physical"
  is_system: boolean
  color_primary: string
  default_icon_url: string | null
}

export function usePlatforms(): UseQueryResult<{ platforms: PlatformSummary[] }> {
  return useQuery({
    queryKey: ["platforms"],
    queryFn: async () => {
      const response = await platformsAPI.getAll()
      return response.data as { platforms: PlatformSummary[] }
    },
  })
}
