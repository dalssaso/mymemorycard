import { useQuery, type UseQueryResult } from "@tanstack/react-query"
import { gamesAPI } from "@/lib/api"

export interface GameSummary {
  id: string
  name: string
  status: string
  cover_art_url: string | null
  last_played: string | null
  is_favorite?: boolean
}

export function useGameSummaries(): UseQueryResult<{ games: GameSummary[] }> {
  return useQuery({
    queryKey: ["games"],
    queryFn: async () => {
      const response = await gamesAPI.getAll()
      return response.data as { games: GameSummary[] }
    },
  })
}
