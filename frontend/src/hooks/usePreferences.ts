import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from "@tanstack/react-query"
import { preferencesAPI } from "@/lib/api"
import { useToast } from "@/components/ui/Toast"

export interface Preferences {
  theme: "light" | "dark" | "system"
  defaultView: "grid" | "list"
  defaultSort: string
  showCompletedGames: boolean
}

export function usePreferences(): UseQueryResult<Preferences> {
  return useQuery({
    queryKey: ["preferences"],
    queryFn: async () => {
      const response = await preferencesAPI.get()
      return response.data as Preferences
    },
  })
}

export function useUpdatePreferences(): UseMutationResult<unknown, Error, Partial<Preferences>> {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  return useMutation({
    mutationFn: async (preferences: Partial<Preferences>) => {
      const response = await preferencesAPI.update(preferences)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["preferences"] })
      showToast("Preferences updated", "success")
    },
    onError: () => {
      showToast("Failed to update preferences", "error")
    },
  })
}
