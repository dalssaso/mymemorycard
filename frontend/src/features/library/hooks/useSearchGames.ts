import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { GamesService, type GameSearchResult } from "@/shared/api/services";

/** Return type for the useSearchGames hook */
export interface UseSearchGamesResult {
  results: GameSearchResult[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  cancelSearch: () => void;
}

/**
 * Server-side game search with debouncing and request cancellation.
 *
 * @param query - Search query string
 * @param debounceMs - Debounce delay in milliseconds (default: 300)
 * @returns Search results with loading and error states
 */
export function useSearchGames(query: string, debounceMs = 300): UseSearchGamesResult {
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["games", "search", debouncedQuery],
    queryFn: () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      return GamesService.search({
        query: debouncedQuery,
        signal: abortControllerRef.current.signal,
      });
    },
    enabled: debouncedQuery.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const cancelSearch = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    results: data?.games || [],
    isLoading,
    isError,
    error,
    cancelSearch,
  };
}
