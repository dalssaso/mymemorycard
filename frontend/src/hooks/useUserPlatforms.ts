import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { userPlatformsAPI } from "@/lib/api";

export interface UserPlatformSummary {
  id: string;
  platform_id: string;
  username?: string | null;
  name: string;
  display_name: string;
  icon_url: string | null;
  color_primary: string;
  default_icon_url?: string | null;
  platform_type?: string | null;
}

export function useUserPlatforms(): UseQueryResult<{ platforms: UserPlatformSummary[] }> {
  const { token } = useAuth();

  return useQuery({
    queryKey: ["user-platforms"],
    queryFn: async () => {
      const response = await userPlatformsAPI.getAll();
      return response.data as { platforms: UserPlatformSummary[] };
    },
    enabled: Boolean(token),
  });
}
