import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BackButton, PageLayout } from "@/components/layout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button,
  Card,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  ScrollFade,
} from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import {
  aiAPI,
  collectionsAPI,
  type CollectionSuggestion,
  type NextGameSuggestion,
} from "@/lib/api";
import { AICuratorSidebar } from "@/components/sidebar";
import { cn } from "@/lib/cn";

interface CollectionCreationData {
  name: string;
  description: string;
  gameIds: string[];
  generateCover: boolean;
  index: number;
}

interface CollectionCreationResult {
  collection: {
    id: string;
    name: string;
  };
  addedCount: number;
  coverCost: number;
  coverError?: unknown;
}

interface CollectionCreationError {
  collectionName: string;
  error: unknown;
}

interface BulkCreationResponse {
  results: CollectionCreationResult[];
  errors: CollectionCreationError[];
}

export function AICurator() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [showCollectionsModal, setShowCollectionsModal] = useState(false);
  const [showNextGameModal, setShowNextGameModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showGenerateCoverModal, setShowGenerateCoverModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: "collections" | "nextGame" | "generateCover";
    cost: number;
    collectionId?: string;
    collectionName?: string;
    collectionDescription?: string;
    theme?: string;
  } | null>(null);
  const [nextGameInput, setNextGameInput] = useState("");
  const [collectionThemeInput, setCollectionThemeInput] = useState("");
  const [suggestedCollections, setSuggestedCollections] = useState<CollectionSuggestion[]>([]);
  const [suggestedGame, setSuggestedGame] = useState<NextGameSuggestion | null>(null);
  const [expandedCard, setExpandedCard] = useState<
    "collections" | "nextGame" | "generateCover" | null
  >(null);
  const [collectionsWithCover, setCollectionsWithCover] = useState<Set<number>>(new Set());
  const [selectedCollectionIndexes, setSelectedCollectionIndexes] = useState<number[]>([]);
  const [isConfirmCollectionsModalOpen, setIsConfirmCollectionsModalOpen] = useState(false);
  const [collectionsForConfirmation, setCollectionsForConfirmation] = useState<
    CollectionSuggestion[]
  >([]);

  const getApiErrorMessage = (error: unknown): string | null => {
    if (!error || typeof error !== "object") {
      return null;
    }
    if ("response" in error) {
      const response = (error as { response?: { data?: { error?: string } } }).response;
      return response?.data?.error ?? null;
    }
    return null;
  };

  const { data: settingsData } = useQuery({
    queryKey: ["ai-settings"],
    queryFn: async () => {
      const response = await aiAPI.getSettings();
      return response.data;
    },
  });

  const { data: activityData } = useQuery({
    queryKey: ["ai-activity"],
    queryFn: async () => {
      const response = await aiAPI.getActivity(20);
      return response.data;
    },
  });

  const { data: collectionsData } = useQuery({
    queryKey: ["collections"],
    queryFn: async () => {
      const response = await collectionsAPI.getAll();
      return response.data as {
        collections: Array<{ id: string; name: string; description: string | null }>;
      };
    },
  });

  const suggestCollectionsMutation = useMutation({
    mutationFn: (theme?: string) => aiAPI.suggestCollections(theme),
    onSuccess: (response) => {
      setSuggestedCollections(response.data.collections);
      setShowCollectionsModal(true);
      showToast(
        `Generated ${response.data.collections.length} collection suggestions ($${response.data.cost.toFixed(4)})`,
        "success"
      );
      queryClient.invalidateQueries({ queryKey: ["ai-activity"] });
    },
    onError: (error: unknown) => {
      showToast(getApiErrorMessage(error) ?? "Failed to generate suggestions", "error");
    },
  });

  const suggestNextGameMutation = useMutation({
    mutationFn: (userInput?: string) => aiAPI.suggestNextGame(userInput),
    onSuccess: (response) => {
      setSuggestedGame(response.data.suggestion);
      setShowNextGameModal(true);
      showToast(`Suggested next game ($${response.data.cost.toFixed(4)})`, "success");
      queryClient.invalidateQueries({ queryKey: ["ai-activity"] });
    },
    onError: (error: unknown) => {
      showToast(getApiErrorMessage(error) ?? "Failed to generate suggestion", "error");
    },
  });

  const generateCoverMutation = useMutation({
    mutationFn: (data: {
      collectionName: string;
      collectionDescription: string;
      collectionId: string;
    }) => aiAPI.generateCover(data.collectionName, data.collectionDescription, data.collectionId),
    onSuccess: (response, variables) => {
      showToast(`Cover generated ($${response.data.cost.toFixed(4)})`, "success");
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({ queryKey: ["collection", variables.collectionId] });
      queryClient.invalidateQueries({ queryKey: ["ai-activity"] });
      setShowGenerateCoverModal(false);
      // Navigate to the collection to show the new cover
      navigate({ to: "/collections/$id", params: { id: variables.collectionId } });
    },
    onError: (error: unknown) => {
      showToast(getApiErrorMessage(error) ?? "Failed to generate cover", "error");
    },
  });

  const bulkCreateCollectionsMutation = useMutation({
    mutationFn: async (data: {
      collections: CollectionCreationData[];
    }): Promise<BulkCreationResponse> => {
      const results: CollectionCreationResult[] = [];
      const errors: CollectionCreationError[] = [];

      for (const collection of data.collections) {
        try {
          const createResult = await collectionsAPI.create(collection.name, collection.description);
          const collectionId = createResult.data.collection.id;

          if (collection.gameIds.length > 0) {
            await collectionsAPI.bulkAddGames(collectionId, collection.gameIds);
          }

          let coverCost = 0;
          let coverError = null;

          if (collection.generateCover) {
            try {
              const coverResult = await aiAPI.generateCover(
                collection.name,
                collection.description,
                collectionId
              );
              coverCost = coverResult.data.cost;
            } catch (err) {
              // Cover generation failed, but collection was created successfully
              coverError = err;
            }
          }

          results.push({
            collection: createResult.data.collection,
            addedCount: collection.gameIds.length,
            coverCost,
            coverError,
          });
        } catch (error) {
          errors.push({
            collectionName: collection.name,
            error,
          });
        }
      }

      return { results, errors };
    },
    onSuccess: (data) => {
      const { results, errors } = data;

      // Count successful and failed cover generations
      const successfulCovers = results.filter((r) => r.coverCost > 0).length;
      const failedCovers = results.filter((r) => r.coverError).length;
      const totalCost = results.reduce((sum, r) => sum + r.coverCost, 0);

      // Show success toast
      if (results.length > 0) {
        let message = `Created ${results.length} collection(s)`;
        if (successfulCovers > 0) {
          message += ` with ${successfulCovers} cover${successfulCovers > 1 ? "s" : ""} ($${totalCost.toFixed(4)})`;
        }
        showToast(message, "success");
      }

      // Show cover generation errors (non-fatal)
      if (failedCovers > 0) {
        showToast(
          `${failedCovers} cover generation${failedCovers > 1 ? "s" : ""} failed (collections were still created)`,
          "warning"
        );
      }

      // Show collection creation errors (fatal)
      if (errors.length > 0) {
        showToast(`Failed to create ${errors.length} collection(s)`, "error");
      }

      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({ queryKey: ["ai-activity"] });

      setIsConfirmCollectionsModalOpen(false);
      setShowCollectionsModal(false);
      setSelectedCollectionIndexes([]);
      setCollectionsWithCover(new Set());

      // Navigate based on TOTAL collections created (not just successful covers)
      if (results.length === 1) {
        navigate({ to: "/collections/$id", params: { id: results[0].collection.id } });
      } else if (results.length > 1) {
        navigate({ to: "/collections" });
      }
    },
    onError: () => {
      showToast("Failed to create collections", "error");
    },
  });

  const handleSuggestCollections = async () => {
    try {
      const { data } = await aiAPI.estimateCost("suggest_collections");
      setConfirmAction({
        type: "collections",
        cost: data.estimatedCostUsd,
        theme: collectionThemeInput || undefined,
      });
      setShowConfirmModal(true);
    } catch (error) {
      console.error("Failed to estimate cost:", error);
      showToast("Failed to estimate cost", "error");
    }
  };

  const handleSuggestNextGame = async () => {
    try {
      const { data } = await aiAPI.estimateCost("suggest_next_game");
      setConfirmAction({ type: "nextGame", cost: data.estimatedCostUsd });
      setShowConfirmModal(true);
    } catch (error) {
      console.error("Failed to estimate cost:", error);
      showToast("Failed to estimate cost", "error");
    }
  };

  const handleGenerateCover = async (collectionId: string) => {
    const collection = collectionsData?.collections.find((c) => c.id === collectionId);
    if (!collection) return;

    try {
      const { data } = await aiAPI.estimateCost("generate_cover_image");
      setConfirmAction({
        type: "generateCover",
        cost: data.estimatedCostUsd,
        collectionId: collection.id,
        collectionName: collection.name,
        collectionDescription: collection.description || "",
      });
      setShowConfirmModal(true);
    } catch (error) {
      console.error("Failed to estimate cost:", error);
      showToast("Failed to estimate cost", "error");
    }
  };

  const toggleCollectionSelection = (index: number): void => {
    setSelectedCollectionIndexes((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const selectAllCollections = (): void => {
    setSelectedCollectionIndexes(suggestedCollections.map((_, index) => index));
  };

  const clearCollectionSelection = (): void => {
    setSelectedCollectionIndexes([]);
  };

  const handleCreateSelected = (): void => {
    if (selectedCollectionIndexes.length === 0) return;

    const collectionsData = selectedCollectionIndexes
      .map((index) => suggestedCollections[index])
      .filter((col): col is CollectionSuggestion => col !== undefined);

    setCollectionsForConfirmation(collectionsData);
    setShowCollectionsModal(false);
    setIsConfirmCollectionsModalOpen(true);
  };

  const handleCancelCollectionsConfirmation = (): void => {
    setIsConfirmCollectionsModalOpen(false);
    setShowCollectionsModal(true);
  };

  const handleConfirmCollectionsCreation = (): void => {
    const collectionsToCreate: CollectionCreationData[] = selectedCollectionIndexes.map(
      (index) => ({
        name: suggestedCollections[index].name,
        description: suggestedCollections[index].description,
        gameIds: suggestedCollections[index].gameIds,
        generateCover: collectionsWithCover.has(index),
        index,
      })
    );

    bulkCreateCollectionsMutation.mutate({ collections: collectionsToCreate });
  };

  const handleConfirmAction = () => {
    if (!confirmAction) return;

    setShowConfirmModal(false);
    if (confirmAction.type === "collections") {
      suggestCollectionsMutation.mutate(confirmAction.theme);
    } else if (confirmAction.type === "nextGame") {
      suggestNextGameMutation.mutate(nextGameInput || undefined);
    } else if (confirmAction.type === "generateCover" && confirmAction.collectionId) {
      generateCoverMutation.mutate({
        collectionId: confirmAction.collectionId,
        collectionName: confirmAction.collectionName || "",
        collectionDescription: confirmAction.collectionDescription || "",
      });
    }
    setConfirmAction(null);
  };

  const handleCancelAction = () => {
    setShowConfirmModal(false);
    setConfirmAction(null);
  };

  const isEnabled =
    settingsData?.activeProvider !== null && settingsData?.activeProvider !== undefined;

  if (!isEnabled) {
    return (
      <PageLayout sidebar={<AICuratorSidebar />}>
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 flex items-center gap-3">
            <BackButton
              iconOnly={true}
              className="text-text-secondary hover:bg-surface hover:text-text-primary rounded-lg p-2 transition-all md:hidden"
            />
            <h1 className="text-text-primary text-4xl font-bold">AI Curator</h1>
          </div>

          <Card className="p-8 text-center">
            <svg
              className="text-text-muted mx-auto mb-4 h-16 w-16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            <h2 className="text-text-primary mb-2 text-2xl font-semibold">AI Curator Not Enabled</h2>
            <p className="text-text-secondary mb-6">
              Configure your AI settings to unlock collection suggestions and game recommendations.
            </p>
            <Button asChild>
              <a href="/settings">Go to Settings</a>
            </Button>
          </Card>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout sidebar={<AICuratorSidebar />}>
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center gap-3">
          <BackButton
            iconOnly={true}
            className="text-text-secondary hover:bg-surface hover:text-text-primary rounded-lg p-2 transition-all md:hidden"
          />
          <h1 className="text-text-primary text-4xl font-bold">AI Curator</h1>
        </div>

        <Card className="mb-6 p-6">
          <p className="text-text-secondary mb-4">
            Powered by AI, the Curator analyzes your game library to provide personalized
            recommendations and help you organize your collection.
          </p>
          <p className="text-text-muted text-xs">
            Provider: {settingsData?.activeProvider?.provider} | Model:{" "}
            {settingsData?.activeProvider?.model}
          </p>
        </Card>

        <div className="mb-8 grid items-start gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card
            className={`cursor-pointer transition-all ${
              expandedCard === "collections" ? "p-6" : "p-4"
            } hover:bg-surface/50`}
            onClick={() => setExpandedCard(expandedCard === "collections" ? null : "collections")}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setExpandedCard(expandedCard === "collections" ? null : "collections");
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div className="flex items-center gap-3">
              <div className="bg-accent/20 rounded-lg p-2">
                <svg
                  className="text-accent h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <h3 className="text-text-primary text-base font-semibold">Suggest Collections</h3>
            </div>
            {expandedCard === "collections" && (
              <>
                <p className="text-text-secondary mb-4 mt-3 text-sm">
                  AI analyzes your library to suggest themed collections based on mood, gameplay
                  style, and context
                </p>
                <div className="mb-4">
                  <label
                    className="text-text-primary mb-2 block text-sm font-medium"
                    htmlFor="collection-theme"
                  >
                    Theme (Optional)
                  </label>
                  <Input
                    id="collection-theme"
                    type="text"
                    value={collectionThemeInput}
                    onChange={(e) => setCollectionThemeInput(e.target.value)}
                    placeholder="e.g., Scary games, To play with my S.O., Short games..."
                    className="bg-surface text-text-primary focus-visible:ring-accent"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                  <p className="text-text-muted mt-1 text-xs">
                    Leave empty for general suggestions, or specify themes for targeted collections
                  </p>
                </div>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSuggestCollections();
                  }}
                  disabled={suggestCollectionsMutation.isPending}
                  className="hover:bg-accent/90 bg-accent text-base w-full"
                >
                  {suggestCollectionsMutation.isPending ? "Generating..." : "Generate Suggestions"}
                </Button>
              </>
            )}
          </Card>

          <Card
            className={`cursor-pointer transition-all ${
              expandedCard === "nextGame" ? "p-6" : "p-4"
            } hover:bg-surface/50`}
            onClick={() => setExpandedCard(expandedCard === "nextGame" ? null : "nextGame")}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setExpandedCard(expandedCard === "nextGame" ? null : "nextGame");
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div className="flex items-center gap-3">
              <div className="bg-accent/20 rounded-lg p-2">
                <svg
                  className="text-accent h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-text-primary text-base font-semibold">Suggest Next Game</h3>
            </div>
            {expandedCard === "nextGame" && (
              <>
                <p className="text-text-secondary mb-4 mt-3 text-sm">
                  Get personalized recommendations on what to play next based on your play history
                  and preferences
                </p>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowNextGameModal(true);
                  }}
                  disabled={suggestNextGameMutation.isPending}
                  className="hover:bg-accent/90 bg-accent text-base w-full disabled:opacity-50"
                >
                  {suggestNextGameMutation.isPending ? "Analyzing..." : "Get Recommendation"}
                </Button>
              </>
            )}
          </Card>

          <Card
            className={`cursor-pointer transition-all ${
              expandedCard === "generateCover" ? "p-6" : "p-4"
            } hover:bg-surface/50`}
            onClick={() =>
              setExpandedCard(expandedCard === "generateCover" ? null : "generateCover")
            }
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setExpandedCard(expandedCard === "generateCover" ? null : "generateCover");
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div className="flex items-center gap-3">
              <div className="bg-status-finished/20 rounded-lg p-2">
                <svg
                  className="text-status-finished h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-text-primary text-base font-semibold">Generate Collection Cover</h3>
            </div>
            {expandedCard === "generateCover" && (
              <>
                <p className="text-text-secondary mb-4 mt-3 text-sm">
                  Create AI-generated cover art for your collections based on their name and
                  description
                </p>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowGenerateCoverModal(true);
                  }}
                  disabled={generateCoverMutation.isPending || !collectionsData?.collections.length}
                  className="hover:bg-status-finished/90 bg-status-finished text-base w-full disabled:opacity-50"
                >
                  {generateCoverMutation.isPending ? "Generating..." : "Select Collection"}
                </Button>
              </>
            )}
          </Card>
        </div>

        {activityData && activityData.logs.length > 0 && (
          <Card className="p-6">
            <h2 className="text-accent mb-4 text-xl font-semibold">Recent Activity</h2>
            <div className="space-y-2">
              {activityData.logs.map((log) => (
                <div
                  key={log.id}
                  className="bg-surface flex items-center justify-between rounded-lg p-3"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-text-primary text-sm font-medium">
                        {log.actionType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </span>
                      {log.success ? (
                        <span className="bg-status-finished/20 text-status-finished rounded px-2 py-0.5 text-xs">
                          Success
                        </span>
                      ) : (
                        <span className="bg-status-dropped/20 text-status-dropped rounded px-2 py-0.5 text-xs">
                          Failed
                        </span>
                      )}
                    </div>
                    <div className="text-text-muted mt-1 text-xs">
                      {new Date(log.createdAt).toLocaleString()} •{" "}
                      {log.estimatedCostUsd ? `$${log.estimatedCostUsd.toFixed(4)}` : "N/A"} •{" "}
                      {log.durationMs ? `${(log.durationMs / 1000).toFixed(1)}s` : "N/A"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      <Dialog open={showCollectionsModal} onOpenChange={setShowCollectionsModal}>
        <DialogContent className="border-border bg-elevated max-h-[80vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-text-primary text-2xl font-bold">
              Collection Suggestions
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {suggestedCollections.map((collection, index) => {
              const isSelected = selectedCollectionIndexes.includes(index);
              return (
                <div
                  key={index}
                  className={cn(
                    "rounded-lg border p-4 transition-colors",
                    isSelected ? "bg-accent/10 border-accent" : "border-border"
                  )}
                >
                  <div className="mb-3 flex items-start gap-3">
                    <Checkbox
                      id={`select-collection-${index}`}
                      checked={isSelected}
                      onCheckedChange={() => toggleCollectionSelection(index)}
                    />
                    <div className="flex-1">
                      <h3 className="text-accent text-lg font-semibold">{collection.name}</h3>
                      <p className="text-text-secondary mt-1 text-sm">{collection.description}</p>
                    </div>
                  </div>

                  <div className="text-text-muted mb-3 break-words text-xs">
                    <strong>Games ({collection.gameNames.length}):</strong>{" "}
                    {collection.gameNames.join(", ")}
                  </div>

                  <div className="text-text-muted mb-3 text-xs italic">
                    {collection.reasoning}
                  </div>

                  <div className="text-text-secondary flex items-center gap-2 text-sm">
                    <Checkbox
                      id={`generate-cover-${index}`}
                      checked={collectionsWithCover.has(index)}
                      onCheckedChange={(checked) => {
                        setCollectionsWithCover((prev) => {
                          const next = new Set(prev);
                          if (checked) {
                            next.add(index);
                          } else {
                            next.delete(index);
                          }
                          return next;
                        });
                      }}
                    />
                    <label htmlFor={`generate-cover-${index}`}>Generate AI cover (~$0.04)</label>
                  </div>
                </div>
              );
            })}
          </div>

          <DialogFooter className="mt-4 flex items-center justify-between gap-3 sm:justify-between">
            <div className="text-text-secondary text-sm">
              {selectedCollectionIndexes.length} selected
              {collectionsWithCover.size > 0 && ` (${collectionsWithCover.size} with covers)`}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={selectAllCollections}
                disabled={selectedCollectionIndexes.length === suggestedCollections.length}
                variant="secondary"
                size="sm"
              >
                Select all
              </Button>

              <Button
                onClick={clearCollectionSelection}
                disabled={selectedCollectionIndexes.length === 0}
                variant="secondary"
                size="sm"
              >
                Clear
              </Button>

              <Button
                onClick={handleCreateSelected}
                disabled={
                  selectedCollectionIndexes.length === 0 || bulkCreateCollectionsMutation.isPending
                }
                className="hover:bg-accent/90 bg-accent text-base"
              >
                {bulkCreateCollectionsMutation.isPending
                  ? "Creating..."
                  : `Create selected (${selectedCollectionIndexes.length})`}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Collections Confirmation Modal */}
      <Dialog
        open={isConfirmCollectionsModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedCollectionIndexes([]);
            setCollectionsWithCover(new Set());
            handleCancelCollectionsConfirmation();
          }
        }}
      >
        <DialogContent className="border-border bg-elevated flex max-h-[85vh] max-w-2xl flex-col">
          <DialogHeader>
            <DialogTitle className="text-text-primary text-2xl font-bold">
              Confirm Collection Creation
            </DialogTitle>
            <DialogDescription>
              You are about to create {collectionsForConfirmation.length} collection(s)
              {collectionsWithCover.size > 0 &&
                ` with ${collectionsWithCover.size} AI-generated cover(s)`}
            </DialogDescription>
          </DialogHeader>

          <ScrollFade axis="y" className="flex-1 space-y-2 overflow-y-auto pr-2">
            {collectionsForConfirmation.map((collection, confirmIndex) => {
              const originalIndex = selectedCollectionIndexes[confirmIndex];
              const hasCover = collectionsWithCover.has(originalIndex);

              return (
                <div
                  key={confirmIndex}
                  className="bg-surface/60 border-border rounded border p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="text-accent font-semibold">{collection.name}</h3>
                      <p className="text-text-secondary mt-1 text-sm">{collection.description}</p>
                      <p className="text-text-muted mt-2 text-xs">
                        {collection.gameNames.length} game(s)
                      </p>
                    </div>
                    {hasCover && (
                      <Badge className="bg-status-finished/20 text-status-finished">With cover</Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </ScrollFade>

          <DialogFooter className="mt-4 flex items-center justify-between gap-3 sm:justify-between">
            <Button
              variant="secondary"
              onClick={handleCancelCollectionsConfirmation}
              disabled={bulkCreateCollectionsMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmCollectionsCreation}
              disabled={bulkCreateCollectionsMutation.isPending}
              className="hover:bg-accent/90 bg-accent text-base"
            >
              {bulkCreateCollectionsMutation.isPending
                ? "Creating..."
                : `Create ${collectionsForConfirmation.length} collection(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showNextGameModal} onOpenChange={setShowNextGameModal}>
        <DialogContent className="border-border bg-elevated max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-text-primary text-2xl font-bold">
              What Should I Play Next?
            </DialogTitle>
          </DialogHeader>

          {!suggestedGame ? (
            <div className="space-y-4">
              <div>
                <label
                  className="text-text-primary mb-2 block text-sm font-medium"
                  htmlFor="next-game-input"
                >
                  What are you in the mood for? (Optional)
                </label>
                <Input
                  id="next-game-input"
                  type="text"
                  value={nextGameInput}
                  onChange={(e) => setNextGameInput(e.target.value)}
                  placeholder="e.g., something short, action game, story-driven..."
                  className="bg-surface text-text-primary focus-visible:ring-accent"
                />
              </div>
              <DialogFooter>
                <Button
                  onClick={handleSuggestNextGame}
                  disabled={suggestNextGameMutation.isPending}
                  className="hover:bg-accent/90 bg-accent text-base w-full"
                >
                  {suggestNextGameMutation.isPending ? "Analyzing..." : "Get Suggestion"}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-surface rounded-lg p-4">
                <h3 className="text-accent mb-2 text-xl font-semibold">
                  {suggestedGame.gameName}
                </h3>
                {suggestedGame.estimatedHours && (
                  <p className="text-text-muted mb-3 text-sm">
                    Estimated playtime: {suggestedGame.estimatedHours} hours
                  </p>
                )}
                <p className="text-text-secondary text-sm">{suggestedGame.reasoning}</p>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => {
                    setSuggestedGame(null);
                    setNextGameInput("");
                  }}
                  className="bg-surface text-text-primary hover:bg-elevated w-full"
                >
                  Get Another Suggestion
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showGenerateCoverModal} onOpenChange={setShowGenerateCoverModal}>
        <DialogContent className="border-border bg-elevated max-h-[80vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-text-primary text-2xl font-bold">
              Generate Collection Cover
            </DialogTitle>
          </DialogHeader>

          <p className="text-text-secondary text-sm">
            Select a collection to generate AI-powered cover art. The image will be based on the
            collection&apos;s name and description.
          </p>

          <div className="space-y-2">
            {collectionsData?.collections.map((collection) => (
              <Button
                key={collection.id}
                onClick={() => {
                  setShowGenerateCoverModal(false);
                  handleGenerateCover(collection.id);
                }}
                variant="ghost"
                className="bg-surface hover:bg-elevated w-full justify-start p-4 text-left"
              >
                <h3 className="text-text-primary mb-1 text-base font-semibold">{collection.name}</h3>
                {collection.description && (
                  <p className="text-text-secondary text-sm">{collection.description}</p>
                )}
              </Button>
            ))}
          </div>

          {collectionsData?.collections.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-text-secondary">No collections found. Create a collection first.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={showConfirmModal}
        onOpenChange={(open: boolean) => !open && handleCancelAction()}
      >
        {confirmAction && (
          <AlertDialogContent className="border-border bg-elevated">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-text-primary text-xl font-bold">
                Confirm Action
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="bg-surface rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg
                      className="text-accent mt-0.5 h-6 w-6 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div>
                      <p className="text-text-primary mb-2 text-sm">
                        {confirmAction.type === "collections"
                          ? confirmAction.theme
                            ? `This will analyze your game library and generate collection suggestions for theme: "${confirmAction.theme}".`
                            : "This will analyze your game library and generate collection suggestions."
                          : confirmAction.type === "nextGame"
                            ? "This will analyze your play history and suggest what to play next."
                            : `This will generate an AI cover image for "${confirmAction.collectionName}".`}
                      </p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-text-secondary text-xs">Estimated cost:</span>
                        <span className="text-accent text-lg font-semibold">
                          ${confirmAction.cost.toFixed(4)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-4 flex flex-col gap-3 sm:flex-row">
              <AlertDialogCancel className="border-border bg-elevated text-text-primary hover:bg-elevated flex-1">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmAction}
                className="hover:bg-accent/90 bg-accent text-base flex-1"
              >
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>
    </PageLayout>
  );
}
