import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  GamesService,
  type Game,
  type GamesListResponse,
  type ImportGameRequest,
  type UpdateGameRequest,
} from "@/shared/api/services";

export interface GameFilters {
  status?: string;
  platform?: string;
  store?: string;
  q?: string;
  sort?: "name" | "recent" | "rating" | "playtime";
}

/**
 * Fetch user's imported games with optional filters.
 *
 * @param filters - Optional filter parameters
 * @returns TanStack Query result with games data
 */
export function useGames(filters: GameFilters = {}): UseQueryResult<GamesListResponse> {
  return useQuery({
    queryKey: ["games", filters],
    queryFn: () => GamesService.list({ ...filters }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch single game by ID.
 *
 * @param id - Game ID to fetch
 * @returns TanStack Query result with game data
 */
export function useGame(id: string): UseQueryResult<Game> {
  return useQuery({
    queryKey: ["games", id],
    queryFn: () => GamesService.getOne(id),
    enabled: !!id,
  });
}

/** Context type for optimistic update rollback */
interface UpdateGameContext {
  previous: Game | undefined;
  previousList: GamesListResponse | undefined;
}

/**
 * Mutation to update game status/rating/favorite with optimistic updates.
 *
 * @returns TanStack Mutation hook for updating games
 */
export function useUpdateGame(): UseMutationResult<
  Game,
  Error,
  { id: string; payload: UpdateGameRequest },
  UpdateGameContext
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateGameRequest }) =>
      GamesService.update(id, payload),
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ["games"] });

      // Snapshot detail cache
      const previous = queryClient.getQueryData<Game>(["games", id]);

      // Snapshot list cache (first matching list query)
      const previousList = queryClient.getQueryData<GamesListResponse>(["games", {}]);

      // Optimistically update detail cache
      queryClient.setQueryData(["games", id], (old: Game | undefined) => {
        if (!old) return old;
        return { ...old, ...payload };
      });

      // Optimistically update list cache
      queryClient.setQueriesData<GamesListResponse>(
        { queryKey: ["games"], exact: false },
        (old) => {
          if (!old?.games) return old;
          return {
            ...old,
            games: old.games.map((g) => (g.id === id ? { ...g, ...payload } : g)),
          };
        }
      );

      return { previous, previousList };
    },
    onError: (_err, variables, context) => {
      // Restore detail cache
      if (context?.previous) {
        queryClient.setQueryData(["games", variables.id], context.previous);
      }
      // Restore list cache
      if (context?.previousList) {
        queryClient.setQueryData(["games", {}], context.previousList);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["games"] });
    },
  });
}

/**
 * Mutation to delete game from library.
 *
 * @returns TanStack Mutation hook for deleting games
 */
export function useDeleteGame(): UseMutationResult<void, Error, string, unknown> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => GamesService.delete(id),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["games"] });
    },
  });
}

/**
 * Mutation to import game from IGDB to user's library.
 *
 * @returns TanStack Mutation hook for creating/importing games
 */
export function useCreateGame(): UseMutationResult<Game, Error, ImportGameRequest, unknown> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ImportGameRequest) => GamesService.create(payload),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["games"] });
    },
  });
}
