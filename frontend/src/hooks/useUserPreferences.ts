import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { preferencesAPI } from "@/lib/api";

export interface UserPreferences {
  default_view: "grid" | "table";
  items_per_page: number;
  theme: "light" | "dark" | "auto";
}

export function useUserPreferences(): UseQueryResult<{ preferences: UserPreferences }> {
  return useQuery({
    queryKey: ["preferences"],
    queryFn: async () => {
      const response = await preferencesAPI.get();
      return response.data as { preferences: UserPreferences };
    },
  });
}
