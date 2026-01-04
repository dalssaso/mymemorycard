import { useQuery, type UseQueryResult } from "@tanstack/react-query"
import { statsAPI, type AchievementStats } from "@/lib/api"

export function useAchievementStats(): UseQueryResult<AchievementStats> {
  return useQuery({
    queryKey: ["achievementStats"],
    queryFn: async () => {
      const response = await statsAPI.getAchievementStats()
      return response.data as AchievementStats
    },
    refetchOnMount: "always",
    staleTime: 30000,
  })
}
