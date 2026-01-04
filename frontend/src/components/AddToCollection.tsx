import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  ScrollFade,
} from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { collectionsAPI } from "@/lib/api";

interface AddToCollectionProps {
  gameId: string;
  onClose?: () => void;
}

interface Collection {
  id: string;
  name: string;
  game_count: number;
}

export function AddToCollection({ gameId, onClose }: AddToCollectionProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [showDropdown, setShowDropdown] = useState(false);

  const { data } = useQuery({
    queryKey: ["collections"],
    queryFn: async () => {
      const response = await collectionsAPI.getAll();
      return response.data as { collections: Collection[] };
    },
  });

  const addToCollectionMutation = useMutation({
    mutationFn: (collectionId: string) => collectionsAPI.addGame(collectionId, gameId),
    onMutate: async (collectionId) => {
      await queryClient.cancelQueries({ queryKey: ["collections"] });
      const previousCollections = queryClient.getQueriesData({ queryKey: ["collections"] });

      queryClient.setQueriesData<{ collections: Collection[] }>(
        { queryKey: ["collections"] },
        (oldData) => {
          if (!oldData?.collections) return oldData;
        return {
          ...oldData,
          collections: oldData.collections.map((collection: Collection) =>
            collection.id === collectionId
              ? { ...collection, game_count: collection.game_count + 1 }
              : collection
          ),
        };
        }
      );

      return { previousCollections };
    },
    onSuccess: (_, collectionId) => {
      queryClient.invalidateQueries({ queryKey: ["collection", collectionId] });
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      const collection = collections.find((c) => c.id === collectionId);
      showToast(`Added to ${collection?.name || "collection"}`, "success");
      setShowDropdown(false);
      onClose?.();
    },
    onError: (_error, _variables, context) => {
      context?.previousCollections?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      showToast("Failed to add to collection", "error");
    },
  });

  const collections = data?.collections || [];

  return (
    <DropdownMenu open={showDropdown} onOpenChange={setShowDropdown}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="border-ctp-mauve/30 bg-ctp-mauve/20 text-ctp-mauve hover:bg-ctp-mauve/30"
        >
          Add to Collection
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-64 border-ctp-surface1 bg-ctp-surface0"
      >
        <ScrollFade axis="y" className="max-h-64 overflow-y-auto">
          {collections.length === 0 ? (
            <div className="px-4 py-3 text-sm text-ctp-subtext0 text-center">
              No collections yet. Create one first!
            </div>
          ) : (
            collections.map((collection) => (
              <DropdownMenuItem
                key={collection.id}
                onClick={() => addToCollectionMutation.mutate(collection.id)}
                disabled={addToCollectionMutation.isPending}
                className="flex flex-col items-start gap-0.5"
              >
                <span className="font-medium">{collection.name}</span>
                <span className="text-xs text-ctp-overlay1">
                  {collection.game_count} games
                </span>
              </DropdownMenuItem>
            ))
          )}
        </ScrollFade>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
