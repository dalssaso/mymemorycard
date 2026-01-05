import type { QueryClient } from "@tanstack/react-query";
import { userPlatformsAPI } from "@/lib/api";

export async function hasUserPlatforms(queryClient: QueryClient): Promise<boolean> {
  const data = await queryClient.ensureQueryData({
    queryKey: ["user-platforms"],
    queryFn: async () => {
      const response = await userPlatformsAPI.getAll();
      return response.data as { platforms?: unknown[] };
    },
  });

  return Array.isArray(data?.platforms) && data.platforms.length > 0;
}
