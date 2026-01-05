import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import { collectionsAPI } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";

interface GameInCollection {
  [key: string]: unknown;
  id: string;
}

interface CollectionResponse {
  [key: string]: unknown;
  games: GameInCollection[];
}

export function useCreateCollection(): UseMutationResult<
  unknown,
  Error,
  { name: string; description?: string }
> {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      const response = await collectionsAPI.create(name, description);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      showToast("Collection created", "success");
    },
    onError: () => {
      showToast("Failed to create collection", "error");
    },
  });
}

export function useUpdateCollection(): UseMutationResult<
  unknown,
  Error,
  { collectionId: string; name: string; description?: string }
> {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async ({
      collectionId,
      name,
      description,
    }: {
      collectionId: string;
      name: string;
      description?: string;
    }) => {
      const response = await collectionsAPI.update(collectionId, name, description);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["collection", variables.collectionId] });
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      showToast("Collection updated", "success");
    },
    onError: () => {
      showToast("Failed to update collection", "error");
    },
  });
}

export function useDeleteCollection(): UseMutationResult<unknown, Error, string> {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (collectionId: string) => {
      const response = await collectionsAPI.delete(collectionId);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      showToast("Collection deleted", "success");
    },
    onError: () => {
      showToast("Failed to delete collection", "error");
    },
  });
}

export function useAddGamesToCollection(): UseMutationResult<
  unknown,
  Error,
  { collectionId: string; gameIds: string[] }
> {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async ({ collectionId, gameIds }: { collectionId: string; gameIds: string[] }) => {
      const response = await collectionsAPI.bulkAddGames(collectionId, gameIds);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["collection", variables.collectionId] });
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      showToast("Games added to collection", "success");
    },
    onError: () => {
      showToast("Failed to add games", "error");
    },
  });
}

export function useRemoveGameFromCollection(): UseMutationResult<
  unknown,
  Error,
  { collectionId: string; gameId: string },
  { previousCollection: CollectionResponse | undefined }
> {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async ({ collectionId, gameId }: { collectionId: string; gameId: string }) => {
      const response = await collectionsAPI.removeGame(collectionId, gameId);
      return response.data;
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ["collection", variables.collectionId] });

      const previousCollection = queryClient.getQueryData<CollectionResponse>([
        "collection",
        variables.collectionId,
      ]);

      queryClient.setQueryData<CollectionResponse>(
        ["collection", variables.collectionId],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            games: old.games.filter((game) => game.id !== variables.gameId),
          };
        }
      );

      return { previousCollection };
    },
    onError: (_, variables, context) => {
      if (context?.previousCollection) {
        queryClient.setQueryData(
          ["collection", variables.collectionId],
          context.previousCollection
        );
      }
      showToast("Failed to remove game", "error");
    },
    onSuccess: () => {
      showToast("Game removed from collection", "success");
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["collection", variables.collectionId] });
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
  });
}

export function useBulkRemoveGamesFromCollection(): UseMutationResult<
  void,
  Error,
  { collectionId: string; gameIds: string[] },
  { previousCollection: CollectionResponse | undefined }
> {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async ({ collectionId, gameIds }: { collectionId: string; gameIds: string[] }) => {
      await Promise.all(gameIds.map((gameId) => collectionsAPI.removeGame(collectionId, gameId)));
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ["collection", variables.collectionId] });

      const previousCollection = queryClient.getQueryData<CollectionResponse>([
        "collection",
        variables.collectionId,
      ]);
      const gameIdSet = new Set(variables.gameIds);

      queryClient.setQueryData<CollectionResponse>(
        ["collection", variables.collectionId],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            games: old.games.filter((game) => !gameIdSet.has(game.id)),
          };
        }
      );

      return { previousCollection };
    },
    onError: (_, variables, context) => {
      if (context?.previousCollection) {
        queryClient.setQueryData(
          ["collection", variables.collectionId],
          context.previousCollection
        );
      }
      showToast("Failed to remove games", "error");
    },
    onSuccess: () => {
      showToast("Games removed from collection", "success");
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["collection", variables.collectionId] });
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
  });
}
