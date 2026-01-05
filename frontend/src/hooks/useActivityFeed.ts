import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { statsAPI, type ActivityFeedResponse } from "@/lib/api";

export interface UseActivityFeedOptions {
  page?: number;
  limit?: number;
  pageSize?: number;
  refetchOnMount?: boolean | "always";
}

export function useActivityFeed<T = unknown>(
  options: UseActivityFeedOptions = {}
): UseQueryResult<ActivityFeedResponse<T>> {
  const { page = 1, limit, pageSize, refetchOnMount } = options;

  return useQuery<ActivityFeedResponse<T>>({
    queryKey: ["activityFeed", { page, limit, pageSize }],
    queryFn: async () => {
      const response = await statsAPI.getActivityFeed({ page, limit, pageSize });
      return response.data as ActivityFeedResponse<T>;
    },
    refetchOnMount,
  });
}
