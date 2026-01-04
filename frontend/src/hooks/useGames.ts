import { useQuery, type UseQueryResult } from "@tanstack/react-query"
import { gamesAPI } from "@/lib/api"
import type { LibraryFilters } from "@/hooks/useLibraryFilters"

export function useGames(filters: LibraryFilters): UseQueryResult<{ games: unknown[] }> {
  return useQuery({
    queryKey: ["games", filters],
    queryFn: async () => {
      const response = await gamesAPI.getAll({
        platform: filters.platform || undefined,
        status: filters.status || undefined,
        favorites: filters.favorites || undefined,
        genre: filters.genre.length > 0 ? filters.genre.join(",") : undefined,
        collection: filters.collection.length > 0 ? filters.collection.join(",") : undefined,
        franchise: filters.franchise.length > 0 ? filters.franchise.join(",") : undefined,
        sort: filters.sort || undefined,
      })
      return response.data as { games: unknown[] }
    },
  })
}
