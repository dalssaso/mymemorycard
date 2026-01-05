import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BackButton, PageLayout } from "@/components/layout";
import { CollectionDetailSidebar } from "@/components/sidebar/CollectionDetailSidebar";
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  ScrollFade,
  Textarea,
} from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { collectionsAPI, gamesAPI } from "@/lib/api";

interface Game {
  id: string;
  name: string;
  cover_art_url: string | null;
  platform_display_name: string;
  status: string;
  user_rating: number | null;
  is_favorite: boolean;
}

interface Collection {
  id: string;
  name: string;
  description: string | null;
  cover_filename: string | null;
  cover_art_url: string | null;
}

const collectionSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
});

type CollectionFormValues = z.infer<typeof collectionSchema>;

interface LibraryGame {
  id: string;
  name: string;
  cover_art_url: string | null;
  platform_display_name: string;
}

export function CollectionDetail() {
  const { id } = useParams({ from: "/collections/$id" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddGamesModal, setShowAddGamesModal] = useState(false);
  const [selectedGameIds, setSelectedGameIds] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedCollectionGameIds, setSelectedCollectionGameIds] = useState<string[]>([]);
  const [coverKey, setCoverKey] = useState(Date.now());

  const { data, isLoading } = useQuery({
    queryKey: ["collection", id],
    queryFn: async () => {
      const response = await collectionsAPI.getOne(id);
      return response.data as { collection: Collection; games: Game[] };
    },
  });

  const { data: libraryData } = useQuery({
    queryKey: ["library-games"],
    queryFn: async () => {
      const response = await gamesAPI.getAll();
      return response.data as { games: LibraryGame[] };
    },
  });

  const updateCollectionMutation = useMutation({
    mutationFn: ({ name, description }: { name: string; description: string }) =>
      collectionsAPI.update(id, name, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collection", id] });
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      showToast("Collection updated successfully", "success");
      setIsEditingName(false);
      setIsEditingDescription(false);
    },
    onError: () => {
      showToast("Failed to update collection", "error");
    },
  });

  const addGameMutation = useMutation({
    mutationFn: (gameIds: string[]) => collectionsAPI.bulkAddGames(id, gameIds),
    onMutate: async (gameIds) => {
      await queryClient.cancelQueries({ queryKey: ["collection", id] });
      await queryClient.cancelQueries({ queryKey: ["collections"] });

      const previousCollection = queryClient.getQueryData<{ collection: Collection; games: Game[] }>(
        ["collection", id]
      );
      const previousCollections = queryClient.getQueryData<{ collections: Array<{ id: string; game_count: number }> }>(
        ["collections"]
      );
      const libraryGames = queryClient.getQueryData<{ games: LibraryGame[] }>(["library-games"]);

      const existingIds = new Set(previousCollection?.games?.map((game) => game.id) ?? []);
      const newGameIds = gameIds.filter((gameId) => !existingIds.has(gameId));
      const newGames =
        libraryGames?.games
          ?.filter((game) => newGameIds.includes(game.id))
          .map((game) => ({
            id: game.id,
            name: game.name,
            cover_art_url: game.cover_art_url,
            platform_display_name: game.platform_display_name,
            status: "backlog",
            user_rating: null,
            is_favorite: false,
          })) ?? [];

      if (previousCollection) {
        queryClient.setQueryData(["collection", id], {
          ...previousCollection,
          games: [...previousCollection.games, ...newGames],
        });
      }

      if (previousCollections) {
        queryClient.setQueryData(["collections"], {
          ...previousCollections,
          collections: previousCollections.collections.map((collection) =>
            collection.id === id
              ? { ...collection, game_count: collection.game_count + newGameIds.length }
              : collection
          ),
        });
      }

      return { previousCollection, previousCollections };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collection", id] });
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      showToast("Games added to collection", "success");
      setSelectedGameIds([]);
      setSearchQuery("");
      setShowAddGamesModal(false);
    },
    onError: (_error, _variables, context) => {
      if (context?.previousCollection) {
        queryClient.setQueryData(["collection", id], context.previousCollection);
      }
      if (context?.previousCollections) {
        queryClient.setQueryData(["collections"], context.previousCollections);
      }
      showToast("Failed to add games", "error");
    },
  });

  const removeGameMutation = useMutation({
    mutationFn: (gameIds: string[]) =>
      Promise.all(gameIds.map((gameId) => collectionsAPI.removeGame(id, gameId))),
    onMutate: async (gameIds) => {
      await queryClient.cancelQueries({ queryKey: ["collection", id] });
      await queryClient.cancelQueries({ queryKey: ["collections"] });

      const previousCollection = queryClient.getQueryData<{ collection: Collection; games: Game[] }>(
        ["collection", id]
      );
      const previousCollections = queryClient.getQueryData<{ collections: Array<{ id: string; game_count: number }> }>(
        ["collections"]
      );

      const removedCount = previousCollection?.games
        ? previousCollection.games.filter((game) => gameIds.includes(game.id)).length
        : 0;

      if (previousCollection) {
        queryClient.setQueryData(["collection", id], {
          ...previousCollection,
          games: previousCollection.games.filter((game) => !gameIds.includes(game.id)),
        });
      }

      if (previousCollections) {
        queryClient.setQueryData(["collections"], {
          ...previousCollections,
          collections: previousCollections.collections.map((collection) =>
            collection.id === id
              ? { ...collection, game_count: Math.max(0, collection.game_count - removedCount) }
              : collection
          ),
        });
      }

      return { previousCollection, previousCollections };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collection", id] });
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      showToast("Games removed from collection", "success");
      setSelectedCollectionGameIds([]);
      setSelectionMode(false);
    },
    onError: (_error, _variables, context) => {
      if (context?.previousCollection) {
        queryClient.setQueryData(["collection", id], context.previousCollection);
      }
      if (context?.previousCollections) {
        queryClient.setQueryData(["collections"], context.previousCollections);
      }
      showToast("Failed to remove games", "error");
    },
  });

  const deleteCollectionMutation = useMutation({
    mutationFn: () => collectionsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      showToast("Collection deleted", "success");
      navigate({ to: "/collections" });
    },
    onError: () => {
      showToast("Failed to delete collection", "error");
    },
  });

  const games = useMemo(() => data?.games ?? [], [data?.games]);

  const collectionGameIds = useMemo(() => new Set(games.map((game) => game.id)), [games]);

  const libraryItems = useMemo(() => libraryData?.games ?? [], [libraryData?.games]);

  const collectionForm = useForm<CollectionFormValues>({
    resolver: zodResolver(collectionSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    if (!data?.collection) return;
    collectionForm.reset({
      name: data.collection.name ?? "",
      description: data.collection.description ?? "",
    });
  }, [data?.collection, collectionForm]);

  const libraryGames = useMemo(() => {
    const items = libraryItems;
    const uniqueGames = new Map<string, LibraryGame>();
    for (const game of items) {
      if (!uniqueGames.has(game.id)) {
        uniqueGames.set(game.id, game);
      }
    }
    return Array.from(uniqueGames.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [libraryItems]);

  const availableGames = useMemo(
    () => libraryGames.filter((game) => !collectionGameIds.has(game.id)),
    [libraryGames, collectionGameIds]
  );

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const searchResults = useMemo(() => {
    if (!normalizedQuery) return [];
    const results = availableGames.filter((game) =>
      game.name.toLowerCase().includes(normalizedQuery)
    );
    const selectedSet = new Set(selectedGameIds);
    results.sort((a, b) => {
      const aSelected = selectedSet.has(a.id);
      const bSelected = selectedSet.has(b.id);
      if (aSelected !== bSelected) return aSelected ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    return results.slice(0, 20);
  }, [availableGames, normalizedQuery, selectedGameIds]);

  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-ctp-subtext0">Loading...</div>
        </div>
      </PageLayout>
    );
  }

  if (!data) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-ctp-red">Collection not found</div>
        </div>
      </PageLayout>
    );
  }

  const { collection } = data;

  const toggleSelectedGame = (gameId: string) => {
    setSelectedGameIds((current) =>
      current.includes(gameId) ? current.filter((id) => id !== gameId) : [...current, gameId]
    );
  };

  const toggleSelectedCollectionGame = (gameId: string) => {
    setSelectedCollectionGameIds((current) =>
      current.includes(gameId) ? current.filter((id) => id !== gameId) : [...current, gameId]
    );
  };

  const handleDeleteCollection = () => {
    if (confirm(`Are you sure you want to delete "${collection.name}"?`)) {
      deleteCollectionMutation.mutate();
    }
  };

  const handleSaveName = collectionForm.handleSubmit((values) => {
    updateCollectionMutation.mutate({
      name: values.name.trim(),
      description: collection.description || "",
    });
  });

  const handleSaveDescription = collectionForm.handleSubmit((values) => {
    updateCollectionMutation.mutate({
      name: collection.name,
      description: values.description?.trim() || "",
    });
  });

  const handleUploadCover = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      showToast("Image must be under 5MB", "error");
      return;
    }

    try {
      await collectionsAPI.uploadCover(id, file);
      setCoverKey(Date.now());
      await queryClient.refetchQueries({ queryKey: ["collection", id] });
      await queryClient.invalidateQueries({ queryKey: ["collections"] });
      showToast("Cover updated", "success");
    } catch (error: unknown) {
      const message =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      showToast(message ?? "Failed to upload cover", "error");
    }
  };

  const handleDeleteCover = async () => {
    if (!confirm("Remove custom cover? Will revert to auto-selected game cover.")) {
      return;
    }
    try {
      await collectionsAPI.deleteCover(id);
      setCoverKey(Date.now());
      await queryClient.refetchQueries({ queryKey: ["collection", id] });
      await queryClient.invalidateQueries({ queryKey: ["collections"] });
      showToast("Cover removed", "success");
    } catch {
      showToast("Failed to remove cover", "error");
    }
  };

  const handleUploadCoverClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/jpg,image/png,image/webp,image/gif";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) handleUploadCover(file);
    };
    input.click();
  };

  return (
    <PageLayout
      customCollapsed={true}
      showBackButton={false}
      sidebar={
        <CollectionDetailSidebar
          collectionId={id}
          collectionName={collection.name}
          gameCount={games.length}
          isUpdating={updateCollectionMutation.isPending || deleteCollectionMutation.isPending}
        />
      }
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/collections"
            className="hidden md:inline-block text-ctp-teal hover:text-ctp-mauve transition-colors mb-4"
          >
            Back to Collections
          </Link>
          <div className="mb-4">
            {isEditingName ? (
              <form onSubmit={handleSaveName}>
                <div className="flex items-center gap-3 mb-2">
                  <BackButton
                    iconOnly={true}
                    className="md:hidden p-2 rounded-lg text-ctp-subtext0 hover:bg-ctp-surface0 hover:text-ctp-text transition-all"
                  />
                  <Input
                    type="text"
                    {...collectionForm.register("name")}
                    className="flex-1 bg-ctp-mantle text-4xl font-bold text-ctp-text focus-visible:ring-ctp-mauve"
                  />
                </div>
                {collectionForm.formState.errors.name && (
                  <p className="text-xs text-ctp-red mb-2">
                    {collectionForm.formState.errors.name.message}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={updateCollectionMutation.isPending}
                    size="sm"
                  >
                    {updateCollectionMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    type="button"
                    onClick={() => {
                      collectionForm.reset({
                        name: collection.name ?? "",
                        description: collection.description ?? "",
                      });
                      setIsEditingName(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BackButton
                    iconOnly={true}
                    className="md:hidden p-2 rounded-lg text-ctp-subtext0 hover:bg-ctp-surface0 hover:text-ctp-text transition-all"
                  />
                  <h1 className="text-4xl font-bold text-ctp-text">{collection.name}</h1>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    collectionForm.reset({
                      name: collection.name ?? "",
                      description: collection.description ?? "",
                    });
                    setIsEditingName(true);
                  }}
                  className="text-ctp-teal hover:text-ctp-mauve hover:bg-transparent"
                >
                  Edit
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar - Cover and Controls */}
          <div className="lg:col-span-1">
            {/* Cover Art */}
            <div className="aspect-[3/4] rounded-lg overflow-hidden bg-ctp-surface0 mb-4">
              {collection.cover_filename ? (
                <img
                  src={`/api/collection-covers/${collection.cover_filename}?v=${coverKey}`}
                  alt={collection.name}
                  className="w-full h-full object-cover"
                />
              ) : collection.cover_art_url ? (
                <img
                  src={`${collection.cover_art_url}${collection.cover_art_url.includes("?") ? "&" : "?"}v=${coverKey}`}
                  alt={collection.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-ctp-overlay1">
                  <span className="text-sm">No Cover</span>
                </div>
              )}
            </div>

            {/* Cover Upload/Delete Buttons */}
            <div className="flex gap-2 mb-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleUploadCoverClick}
                className="flex-1"
              >
                {collection.cover_filename ? "Change Cover" : "Add Cover"}
              </Button>

              {collection.cover_filename && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleDeleteCover}
                  className="flex-1"
                >
                  Remove Cover
                </Button>
              )}
            </div>

            {/* Game Count */}
            <div className="bg-ctp-teal/10 border border-ctp-teal/30 rounded-lg p-3 mb-4">
              <div className="text-xs text-ctp-teal">Games</div>
              <div className="text-lg font-semibold text-ctp-text">
                {games.length} {games.length === 1 ? "game" : "games"}
              </div>
            </div>

            {/* Delete Collection Button */}
            <Button variant="destructive" onClick={handleDeleteCollection} className="w-full">
              Delete Collection
            </Button>
          </div>

          {/* Main Content - Collection Details and Games */}
          <div className="lg:col-span-2">
            {/* Collection Description */}
            <div id="description" className="mb-6 bg-ctp-surface0/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-semibold text-ctp-mauve">Description</h2>
                {!isEditingDescription && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      collectionForm.reset({
                        name: collection.name ?? "",
                        description: collection.description ?? "",
                      });
                      setIsEditingDescription(true);
                    }}
                    className="text-ctp-teal hover:text-ctp-mauve hover:bg-transparent"
                  >
                    {collection.description ? "Edit" : "Add Description"}
                  </Button>
                )}
              </div>

              {isEditingDescription ? (
                <form onSubmit={handleSaveDescription}>
                  <Textarea
                    {...collectionForm.register("description")}
                    className="min-h-24 bg-ctp-mantle text-ctp-text focus-visible:ring-ctp-mauve"
                    placeholder="Describe your collection..."
                  />
                  {collectionForm.formState.errors.description && (
                    <p className="text-xs text-ctp-red mt-1">
                      {collectionForm.formState.errors.description.message}
                    </p>
                  )}
                  <div className="flex gap-2 mt-2">
                    <Button
                      type="submit"
                      disabled={updateCollectionMutation.isPending}
                      size="sm"
                    >
                      {updateCollectionMutation.isPending ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      type="button"
                      onClick={() => {
                        collectionForm.reset({
                          name: collection.name ?? "",
                          description: collection.description ?? "",
                        });
                        setIsEditingDescription(false);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="text-ctp-subtext1 bg-ctp-mantle/50 rounded-lg p-4">
                  {collection.description || "No description yet"}
                </div>
              )}
            </div>

            {/* Games Section */}
            <div id="games" className="mb-6 bg-ctp-surface0/30 rounded-lg p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                <h2 className="text-xl font-semibold text-ctp-mauve">Games in Collection</h2>
                <div className="flex items-center gap-2">
                  {selectionMode ? (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          if (selectedCollectionGameIds.length === games.length) {
                            setSelectedCollectionGameIds([]);
                          } else {
                            setSelectedCollectionGameIds(games.map((game) => game.id));
                          }
                        }}
                        className="bg-ctp-surface1 hover:bg-ctp-surface2"
                      >
                        {selectedCollectionGameIds.length === games.length
                          ? "Deselect All"
                          : "Select All"}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setSelectionMode(false);
                          setSelectedCollectionGameIds([]);
                        }}
                        className="bg-ctp-surface1 hover:bg-ctp-surface2"
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectionMode(true)}
                        disabled={games.length === 0}
                        className="bg-ctp-mauve/20 border-ctp-mauve/30 text-ctp-mauve hover:bg-ctp-mauve/30"
                      >
                        Select Games
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setShowAddGamesModal(true)}
                        disabled={availableGames.length === 0}
                      >
                        Add Games
                      </Button>
                    </>
                  )}
                </div>
              </div>
              {games.length === 0 ? (
                <p className="text-ctp-subtext0 text-center py-8">
                  No games in this collection yet. Add games from your library!
                </p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {games.map((game) => {
                    const isSelected = selectedCollectionGameIds.includes(game.id);
                    if (selectionMode) {
                      return (
                        <div
                          key={game.id}
                          className="group cursor-pointer"
                          onClick={() => toggleSelectedCollectionGame(game.id)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              toggleSelectedCollectionGame(game.id);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                        >
                          <div
                            className={`aspect-[3/4] rounded-lg overflow-hidden bg-ctp-surface0 mb-2 relative border transition-colors ${
                              isSelected
                                ? "border-ctp-mauve bg-ctp-mauve/20"
                                : "border-dashed border-ctp-surface1 hover:border-ctp-mauve"
                            }`}
                          >
                            {game.cover_art_url ? (
                              <img
                                src={game.cover_art_url}
                                alt={game.name}
                                className={`w-full h-full object-cover transition-all ${
                                  isSelected
                                    ? "opacity-100 grayscale-0"
                                    : "opacity-60 group-hover:opacity-100"
                                }`}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-ctp-overlay1">
                                No Cover
                              </div>
                            )}
                            {isSelected && (
                              <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-ctp-mauve flex items-center justify-center">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth={3}
                                  stroke="currentColor"
                                  className="w-4 h-4 text-ctp-text"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="m4.5 12.75 6 6 9-13.5"
                                  />
                                </svg>
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-ctp-subtext0 truncate group-hover:text-ctp-subtext1 mb-1">
                            {game.name}
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div key={game.id} className="group relative">
                        <Link to="/library/$id" params={{ id: game.id }}>
                          <div className="aspect-[3/4] rounded-lg overflow-hidden bg-ctp-surface0 mb-2">
                            {game.cover_art_url ? (
                              <img
                                src={game.cover_art_url}
                                alt={game.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-ctp-overlay1">
                                No Cover
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-ctp-subtext1 truncate group-hover:text-ctp-text">
                            {game.name}
                          </p>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeGameMutation.mutate([game.id])}
                          className="absolute top-2 right-2 bg-ctp-red/80 hover:bg-ctp-red text-ctp-base rounded-full w-6 h-6 opacity-0 group-hover:opacity-100"
                          title="Remove from collection"
                        >
                          ×
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectionMode && selectedCollectionGameIds.length > 0 && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 bg-ctp-mantle border border-ctp-surface1 rounded-xl px-6 py-4 shadow-xl z-40 flex items-center gap-4">
          <span className="text-ctp-text font-medium">
            {selectedCollectionGameIds.length} game
            {selectedCollectionGameIds.length !== 1 ? "s" : ""} selected
          </span>
          <div className="h-6 w-px bg-ctp-surface1" />
          <Button
            variant="destructive"
            onClick={() => removeGameMutation.mutate(selectedCollectionGameIds)}
            disabled={removeGameMutation.isPending}
            className="text-sm py-1 px-3"
          >
            {removeGameMutation.isPending ? "Removing..." : "Remove from Collection"}
          </Button>
        </div>
      )}

      <Dialog
        open={showAddGamesModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddGamesModal(false);
            setSelectedGameIds([]);
            setSearchQuery("");
          }
        }}
      >
        <DialogContent className="max-w-2xl bg-ctp-mantle border-ctp-surface1">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-ctp-text">Add Games</DialogTitle>
            <DialogDescription className="flex items-center justify-between">
              <span>Search your library and select multiple games to add.</span>
              {selectedGameIds.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedGameIds([])}
                  className="text-xs text-ctp-subtext0 hover:text-ctp-text hover:bg-transparent h-auto py-0"
                >
                  Clear selection
                </Button>
              )}
            </DialogDescription>
          </DialogHeader>
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your library..."
            className="bg-ctp-surface0 text-ctp-text focus-visible:ring-ctp-mauve"
          />
          {normalizedQuery && (
            <ScrollFade axis="y" className="max-h-80 overflow-y-auto space-y-2">
              {searchResults.length === 0 ? (
                <div className="text-sm text-ctp-subtext0 text-center py-6">
                  No games matched your search.
                </div>
              ) : (
                searchResults.map((game) => (
                  <label
                    key={game.id}
                    className={`w-full flex items-center gap-3 border rounded-lg p-2 text-left transition-colors cursor-pointer ${
                      selectedGameIds.includes(game.id)
                        ? "border-ctp-mauve bg-ctp-mauve/10"
                        : "border-ctp-surface1 bg-ctp-surface0/60 hover:bg-ctp-surface1"
                    }`}
                  >
                    <Checkbox
                      id={`collection-add-${game.id}`}
                      checked={selectedGameIds.includes(game.id)}
                      onCheckedChange={() => toggleSelectedGame(game.id)}
                    />
                    <div className="w-10 h-14 rounded-md overflow-hidden bg-ctp-surface0 flex-shrink-0">
                      {game.cover_art_url ? (
                        <img
                          src={game.cover_art_url}
                          alt={game.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-ctp-overlay1 text-xs">
                          No Cover
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-ctp-text truncate">{game.name}</div>
                      <div className="text-xs text-ctp-subtext0 truncate">
                        {game.platform_display_name}
                      </div>
                    </div>
                  </label>
                ))
              )}
            </ScrollFade>
          )}
          <DialogFooter className="flex items-center justify-between gap-3 sm:justify-between">
            <div className="text-sm text-ctp-subtext0">{selectedGameIds.length} selected</div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowAddGamesModal(false);
                  setSelectedGameIds([]);
                  setSearchQuery("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => addGameMutation.mutate(selectedGameIds)}
                disabled={selectedGameIds.length === 0 || addGameMutation.isPending}
              >
                {addGameMutation.isPending ? "Adding..." : "Add Selected"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
