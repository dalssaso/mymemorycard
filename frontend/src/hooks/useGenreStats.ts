import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { gamesAPI } from "@/lib/api";

export interface GenreStat {
  name: string;
  count: number;
}

export function useGenreStats(): UseQueryResult<{ genres: GenreStat[] }> {
  return useQuery({
    queryKey: ["genreStats"],
    queryFn: async () => {
      const response = await gamesAPI.getGenreStats();
      return response.data as { genres: GenreStat[] };
    },
  });
}
