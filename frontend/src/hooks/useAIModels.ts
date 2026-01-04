import { useQuery, type UseQueryResult } from "@tanstack/react-query"
import { aiAPI, type ModelsResponse } from "@/lib/api"

export function useAIModels(provider: string | null): UseQueryResult<ModelsResponse> {
  return useQuery({
    queryKey: ["ai-models", provider],
    queryFn: async () => {
      const response = await aiAPI.getModels(provider ?? "")
      return response.data as ModelsResponse
    },
    enabled: Boolean(provider),
    staleTime: 24 * 60 * 60 * 1000,
  })
}
