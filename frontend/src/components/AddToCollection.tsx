import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ScrollFade } from "@/components/ui";
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
    onSuccess: (_, collectionId) => {
      queryClient.invalidateQueries({ queryKey: ["collection", collectionId] });
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      const collection = collections.find((c) => c.id === collectionId);
      showToast(`Added to ${collection?.name || "collection"}`, "success");
      setShowDropdown(false);
      onClose?.();
    },
    onError: () => {
      showToast("Failed to add to collection", "error");
    },
  });

  const collections = data?.collections || [];

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowDropdown(!showDropdown);
        }}
        className="px-3 py-1 bg-ctp-mauve/20 border border-ctp-mauve/30 text-ctp-mauve hover:bg-ctp-mauve/30 rounded-lg text-sm transition-all"
      >
        Add to Collection
      </button>

      {showDropdown && (
        <>
          <button
            type="button"
            aria-label="Close collection dropdown"
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
          <ScrollFade
            axis="y"
            className="absolute right-0 mt-2 w-64 bg-ctp-surface0 border border-ctp-surface1 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
          >
            <div className="py-1">
              {collections.length === 0 ? (
                <div className="px-4 py-3 text-sm text-ctp-subtext0 text-center">
                  No collections yet. Create one first!
                </div>
              ) : (
                collections.map((collection) => (
                  <button
                    key={collection.id}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      addToCollectionMutation.mutate(collection.id);
                    }}
                    disabled={addToCollectionMutation.isPending}
                    className="w-full text-left px-4 py-2 text-sm text-ctp-subtext1 hover:bg-ctp-surface1 hover:text-ctp-text disabled:opacity-50"
                  >
                    <div className="font-medium">{collection.name}</div>
                    <div className="text-xs text-ctp-overlay1">{collection.game_count} games</div>
                  </button>
                ))
              )}
            </div>
          </ScrollFade>
        </>
      )}
    </div>
  );
}
