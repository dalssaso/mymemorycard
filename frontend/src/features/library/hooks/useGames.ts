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
      const previous = queryClient.getQueryData<Game>(["games", id]);
      queryClient.setQueryData(["games", id], (old: Game | undefined) => {
        if (!old) return old
        return { ...old, ...payload }
      });
      return { previous };
    },
    onError: (_err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["games", variables.id], context.previous);
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
