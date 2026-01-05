import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { collectionsAPI } from "@/lib/api";

export interface CollectionSummary {
  id: string;
  name: string;
  description: string | null;
  game_count: number;
  cover_art_url?: string | null;
  cover_filename?: string | null;
  created_at?: string;
}

export function useCollections(): UseQueryResult<{ collections: CollectionSummary[] }> {
  return useQuery({
    queryKey: ["collections"],
    queryFn: async () => {
      const response = await collectionsAPI.getAll();
      return response.data as { collections: CollectionSummary[] };
    },
  });
}
