import { useQuery, type UseQueryResult } from "@tanstack/react-query"
import { franchisesAPI, type FranchiseSummary } from "@/lib/api"

export function useFranchises(): UseQueryResult<{ franchises: FranchiseSummary[] }> {
  return useQuery({
    queryKey: ["franchises"],
    queryFn: async () => {
      const response = await franchisesAPI.getAll()
      return response.data as { franchises: FranchiseSummary[] }
    },
  })
}
