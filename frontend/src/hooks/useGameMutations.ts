import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query"
import { gamesAPI } from "@/lib/api"
import { useToast } from "@/components/ui/Toast"

interface GameData {
  [key: string]: unknown
  id: string
  is_favorite?: boolean
  status?: string
  user_rating?: number | null
}

interface GamesResponse {
  games: GameData[]
}

export function useToggleFavorite(): UseMutationResult<
  unknown,
  Error,
  { gameId: string; platformId: string; isFavorite: boolean },
  { previousGames: GamesResponse | undefined; previousGame: GameData | undefined }
> {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  return useMutation({
    mutationFn: async ({
      gameId,
      platformId,
      isFavorite,
    }: {
      gameId: string
      platformId: string
      isFavorite: boolean
    }) => {
      const response = await gamesAPI.toggleFavorite(gameId, platformId, isFavorite)
      return response.data
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ["games"] })
      await queryClient.cancelQueries({ queryKey: ["game", variables.gameId] })

      const previousGames = queryClient.getQueryData<GamesResponse>(["games"])
      const previousGame = queryClient.getQueryData<GameData>(["game", variables.gameId])

      queryClient.setQueriesData<GamesResponse>({ queryKey: ["games"] }, (old) => {
        if (!old) return old
        return {
          ...old,
          games: old.games.map((game) =>
            game.id === variables.gameId ? { ...game, is_favorite: variables.isFavorite } : game
          ),
        }
      })

      queryClient.setQueryData<GameData>(["game", variables.gameId], (old) => {
        if (!old) return old
        return { ...old, is_favorite: variables.isFavorite }
      })

      return { previousGames, previousGame }
    },
    onError: (_, variables, context) => {
      if (context?.previousGames) {
        queryClient.setQueryData(["games"], context.previousGames)
      }
      if (context?.previousGame) {
        queryClient.setQueryData(["game", variables.gameId], context.previousGame)
      }
      showToast("Failed to update favorite status", "error")
    },
    onSuccess: (_, variables) => {
      showToast(
        variables.isFavorite ? "Added to favorites" : "Removed from favorites",
        "success"
      )
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["games"] })
      queryClient.invalidateQueries({ queryKey: ["game", variables.gameId] })
    },
  })
}

export function useUpdateGameStatus(): UseMutationResult<
  unknown,
  Error,
  { gameId: string; platformId: string; status: string },
  { previousGames: GamesResponse | undefined; previousGame: GameData | undefined }
> {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  return useMutation({
    mutationFn: async ({
      gameId,
      platformId,
      status,
    }: {
      gameId: string
      platformId: string
      status: string
    }) => {
      const response = await gamesAPI.updateStatus(gameId, platformId, status)
      return response.data
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ["games"] })
      await queryClient.cancelQueries({ queryKey: ["game", variables.gameId] })

      const previousGames = queryClient.getQueryData<GamesResponse>(["games"])
      const previousGame = queryClient.getQueryData<GameData>(["game", variables.gameId])

      queryClient.setQueriesData<GamesResponse>({ queryKey: ["games"] }, (old) => {
        if (!old) return old
        return {
          ...old,
          games: old.games.map((game) =>
            game.id === variables.gameId ? { ...game, status: variables.status } : game
          ),
        }
      })

      queryClient.setQueryData<GameData>(["game", variables.gameId], (old) => {
        if (!old) return old
        return { ...old, status: variables.status }
      })

      return { previousGames, previousGame }
    },
    onError: (_, variables, context) => {
      if (context?.previousGames) {
        queryClient.setQueryData(["games"], context.previousGames)
      }
      if (context?.previousGame) {
        queryClient.setQueryData(["game", variables.gameId], context.previousGame)
      }
      showToast("Failed to update status", "error")
    },
    onSuccess: () => {
      showToast("Status updated", "success")
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["games"] })
      queryClient.invalidateQueries({ queryKey: ["game", variables.gameId] })
      queryClient.invalidateQueries({ queryKey: ["activityFeed"] })
    },
  })
}

export function useDeleteGame(): UseMutationResult<
  unknown,
  Error,
  { gameId: string; platformId: string },
  { previousGames: GamesResponse | undefined }
> {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  return useMutation({
    mutationFn: async ({ gameId, platformId }: { gameId: string; platformId: string }) => {
      const response = await gamesAPI.delete(gameId, platformId)
      return response.data
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ["games"] })

      const previousGames = queryClient.getQueryData<GamesResponse>(["games"])

      queryClient.setQueriesData<GamesResponse>({ queryKey: ["games"] }, (old) => {
        if (!old) return old
        return {
          ...old,
          games: old.games.filter((game) => game.id !== variables.gameId),
        }
      })

      return { previousGames }
    },
    onError: (_error, _variables, context) => {
      if (context?.previousGames) {
        queryClient.setQueryData(["games"], context.previousGames)
      }
      showToast("Failed to delete game", "error")
    },
    onSuccess: () => {
      showToast("Game deleted", "success")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["games"] })
      queryClient.invalidateQueries({ queryKey: ["collections"] })
      queryClient.invalidateQueries({ queryKey: ["achievementStats"] })
    },
  })
}

export function useBulkDeleteGames(): UseMutationResult<
  unknown,
  Error,
  string[],
  { previousGames: GamesResponse | undefined }
> {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  return useMutation({
    mutationFn: async (gameIds: string[]) => {
      const response = await gamesAPI.bulkDelete(gameIds)
      return response.data
    },
    onMutate: async (gameIds) => {
      await queryClient.cancelQueries({ queryKey: ["games"] })

      const previousGames = queryClient.getQueryData<GamesResponse>(["games"])
      const gameIdSet = new Set(gameIds)

      queryClient.setQueriesData<GamesResponse>({ queryKey: ["games"] }, (old) => {
        if (!old) return old
        return {
          ...old,
          games: old.games.filter((game) => !gameIdSet.has(game.id)),
        }
      })

      return { previousGames }
    },
    onError: (_error, _variables, context) => {
      if (context?.previousGames) {
        queryClient.setQueryData(["games"], context.previousGames)
      }
      showToast("Failed to delete games", "error")
    },
    onSuccess: (_data, gameIds) => {
      showToast(`Deleted ${gameIds.length} game(s)`, "success")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["games"] })
      queryClient.invalidateQueries({ queryKey: ["collections"] })
      queryClient.invalidateQueries({ queryKey: ["achievementStats"] })
    },
  })
}

export function useUpdateGameRating(): UseMutationResult<
  unknown,
  Error,
  { gameId: string; platformId: string; rating: number },
  { previousGames: GamesResponse | undefined; previousGame: GameData | undefined }
> {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  return useMutation({
    mutationFn: async ({
      gameId,
      platformId,
      rating,
    }: {
      gameId: string
      platformId: string
      rating: number
    }) => {
      const response = await gamesAPI.updateRating(gameId, platformId, rating)
      return response.data
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ["games"] })
      await queryClient.cancelQueries({ queryKey: ["game", variables.gameId] })

      const previousGames = queryClient.getQueryData<GamesResponse>(["games"])
      const previousGame = queryClient.getQueryData<GameData>(["game", variables.gameId])

      queryClient.setQueriesData<GamesResponse>({ queryKey: ["games"] }, (old) => {
        if (!old) return old
        return {
          ...old,
          games: old.games.map((game) =>
            game.id === variables.gameId ? { ...game, user_rating: variables.rating } : game
          ),
        }
      })

      queryClient.setQueryData<GameData>(["game", variables.gameId], (old) => {
        if (!old) return old
        return { ...old, user_rating: variables.rating }
      })

      return { previousGames, previousGame }
    },
    onError: (_, variables, context) => {
      if (context?.previousGames) {
        queryClient.setQueryData(["games"], context.previousGames)
      }
      if (context?.previousGame) {
        queryClient.setQueryData(["game", variables.gameId], context.previousGame)
      }
      showToast("Failed to update rating", "error")
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["games"] })
      queryClient.invalidateQueries({ queryKey: ["game", variables.gameId] })
    },
  })
}
