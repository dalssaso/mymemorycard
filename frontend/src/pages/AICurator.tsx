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
  Button,
  Card,
  Checkbox,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import {
  aiAPI,
  collectionsAPI,
  type CollectionSuggestion,
  type NextGameSuggestion,
} from "@/lib/api";
import { AICuratorSidebar } from "@/components/sidebar";

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
  const [generateCoverOnCreate, setGenerateCoverOnCreate] = useState(false);

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

  const createCollectionMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      description: string;
      gameIds: string[];
      generateCover?: boolean;
    }) => {
      const createResult = await collectionsAPI.create(data.name, data.description);
      const collectionId = createResult.data.collection.id;

      if (data.gameIds.length > 0) {
        await collectionsAPI.bulkAddGames(collectionId, data.gameIds);
      }

      let coverCost = 0;
      if (data.generateCover) {
        const coverResult = await aiAPI.generateCover(data.name, data.description, collectionId);
        coverCost = coverResult.data.cost;
      }

      return {
        collection: createResult.data.collection,
        addedCount: data.gameIds.length,
        coverCost,
      };
    },
    onSuccess: (result, variables) => {
      const gameCount = result.addedCount;
      let message =
        gameCount > 0
          ? `Created "${variables.name}" with ${gameCount} games`
          : `Created collection: ${variables.name}`;
      if (result.coverCost > 0) {
        message += ` (cover: $${result.coverCost.toFixed(4)})`;
      }
      showToast(message, "success");
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({ queryKey: ["ai-activity"] });
    },
    onError: () => {
      showToast("Failed to create collection", "error");
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
              className="rounded-lg p-2 text-ctp-subtext0 transition-all hover:bg-ctp-surface0 hover:text-ctp-text md:hidden"
            />
            <h1 className="text-4xl font-bold text-ctp-text">AI Curator</h1>
          </div>

          <Card className="p-8 text-center">
            <svg
              className="mx-auto mb-4 h-16 w-16 text-ctp-overlay0"
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
            <h2 className="mb-2 text-2xl font-semibold text-ctp-text">AI Curator Not Enabled</h2>
            <p className="mb-6 text-ctp-subtext0">
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
            className="rounded-lg p-2 text-ctp-subtext0 transition-all hover:bg-ctp-surface0 hover:text-ctp-text md:hidden"
          />
          <h1 className="text-4xl font-bold text-ctp-text">AI Curator</h1>
        </div>

        <Card className="mb-6 p-6">
          <p className="mb-4 text-ctp-subtext0">
            Powered by AI, the Curator analyzes your game library to provide personalized
            recommendations and help you organize your collection.
          </p>
          <p className="text-xs text-ctp-overlay1">
            Provider: {settingsData?.activeProvider?.provider} | Model:{" "}
            {settingsData?.activeProvider?.model}
          </p>
        </Card>

        <div className="mb-8 grid items-start gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card
            className={`cursor-pointer transition-all ${
              expandedCard === "collections" ? "p-6" : "p-4"
            } hover:bg-ctp-surface0/50`}
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
              <div className="bg-ctp-mauve/20 rounded-lg p-2">
                <svg
                  className="h-5 w-5 text-ctp-mauve"
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
              <h3 className="text-base font-semibold text-ctp-text">Suggest Collections</h3>
            </div>
            {expandedCard === "collections" && (
              <>
                <p className="mb-4 mt-3 text-sm text-ctp-subtext0">
                  AI analyzes your library to suggest themed collections based on mood, gameplay
                  style, and context
                </p>
                <div className="mb-4">
                  <label
                    className="mb-2 block text-sm font-medium text-ctp-text"
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
                    className="bg-ctp-surface0 text-ctp-text focus-visible:ring-ctp-mauve"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <p className="mt-1 text-xs text-ctp-overlay1">
                    Leave empty for general suggestions, or specify themes for targeted collections
                  </p>
                </div>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSuggestCollections();
                  }}
                  disabled={suggestCollectionsMutation.isPending}
                  className="hover:bg-ctp-mauve/90 w-full bg-ctp-mauve text-ctp-base"
                >
                  {suggestCollectionsMutation.isPending ? "Generating..." : "Generate Suggestions"}
                </Button>
              </>
            )}
          </Card>

          <Card
            className={`cursor-pointer transition-all ${
              expandedCard === "nextGame" ? "p-6" : "p-4"
            } hover:bg-ctp-surface0/50`}
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
              <div className="bg-ctp-blue/20 rounded-lg p-2">
                <svg
                  className="h-5 w-5 text-ctp-blue"
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
              <h3 className="text-base font-semibold text-ctp-text">Suggest Next Game</h3>
            </div>
            {expandedCard === "nextGame" && (
              <>
                <p className="mb-4 mt-3 text-sm text-ctp-subtext0">
                  Get personalized recommendations on what to play next based on your play history
                  and preferences
                </p>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowNextGameModal(true);
                  }}
                  disabled={suggestNextGameMutation.isPending}
                  className="hover:bg-ctp-blue/90 w-full bg-ctp-blue text-ctp-base disabled:opacity-50"
                >
                  {suggestNextGameMutation.isPending ? "Analyzing..." : "Get Recommendation"}
                </Button>
              </>
            )}
          </Card>

          <Card
            className={`cursor-pointer transition-all ${
              expandedCard === "generateCover" ? "p-6" : "p-4"
            } hover:bg-ctp-surface0/50`}
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
              <div className="bg-ctp-green/20 rounded-lg p-2">
                <svg
                  className="h-5 w-5 text-ctp-green"
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
              <h3 className="text-base font-semibold text-ctp-text">Generate Collection Cover</h3>
            </div>
            {expandedCard === "generateCover" && (
              <>
                <p className="mb-4 mt-3 text-sm text-ctp-subtext0">
                  Create AI-generated cover art for your collections based on their name and
                  description
                </p>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowGenerateCoverModal(true);
                  }}
                  disabled={generateCoverMutation.isPending || !collectionsData?.collections.length}
                  className="hover:bg-ctp-green/90 w-full bg-ctp-green text-ctp-base disabled:opacity-50"
                >
                  {generateCoverMutation.isPending ? "Generating..." : "Select Collection"}
                </Button>
              </>
            )}
          </Card>
        </div>

        {activityData && activityData.logs.length > 0 && (
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold text-ctp-mauve">Recent Activity</h2>
            <div className="space-y-2">
              {activityData.logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between rounded-lg bg-ctp-surface0 p-3"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-ctp-text">
                        {log.actionType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </span>
                      {log.success ? (
                        <span className="bg-ctp-green/20 rounded px-2 py-0.5 text-xs text-ctp-green">
                          Success
                        </span>
                      ) : (
                        <span className="bg-ctp-red/20 rounded px-2 py-0.5 text-xs text-ctp-red">
                          Failed
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-ctp-overlay1">
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
        <DialogContent className="max-h-[80vh] max-w-3xl overflow-y-auto border-ctp-surface1 bg-ctp-mantle">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-ctp-text">
              Collection Suggestions
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {suggestedCollections.map((collection, index) => (
              <div key={index} className="rounded-lg border border-ctp-surface1 p-4">
                <h3 className="mb-2 text-lg font-semibold text-ctp-mauve">{collection.name}</h3>
                <p className="mb-3 text-sm text-ctp-subtext0">{collection.description}</p>
                <div className="mb-3 break-words text-xs text-ctp-overlay1">
                  <strong>Games ({collection.gameNames.length}):</strong>{" "}
                  {collection.gameNames.join(", ")}
                </div>
                <div className="mb-3 text-xs italic text-ctp-overlay2">{collection.reasoning}</div>
                {settingsData?.activeProvider?.provider === "openai" && (
                  <div className="mb-3 flex items-center gap-2 text-sm text-ctp-subtext0">
                    <Checkbox
                      id={`generate-cover-${index}`}
                      checked={generateCoverOnCreate}
                      onCheckedChange={(checked) => setGenerateCoverOnCreate(checked === true)}
                    />
                    <label htmlFor={`generate-cover-${index}`}>Generate AI cover (~$0.04)</label>
                  </div>
                )}
                <Button
                  onClick={() => {
                    createCollectionMutation.mutate({
                      name: collection.name,
                      description: collection.description,
                      gameIds: collection.gameIds,
                      generateCover: generateCoverOnCreate,
                    });
                  }}
                  disabled={createCollectionMutation.isPending}
                  className="hover:bg-ctp-mauve/90 w-full bg-ctp-mauve text-ctp-base sm:w-auto"
                >
                  {createCollectionMutation.isPending ? "Creating..." : "Create Collection"}
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showNextGameModal} onOpenChange={setShowNextGameModal}>
        <DialogContent className="max-w-2xl border-ctp-surface1 bg-ctp-mantle">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-ctp-text">
              What Should I Play Next?
            </DialogTitle>
          </DialogHeader>

          {!suggestedGame ? (
            <div className="space-y-4">
              <div>
                <label
                  className="mb-2 block text-sm font-medium text-ctp-text"
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
                  className="bg-ctp-surface0 text-ctp-text focus-visible:ring-ctp-mauve"
                />
              </div>
              <DialogFooter>
                <Button
                  onClick={handleSuggestNextGame}
                  disabled={suggestNextGameMutation.isPending}
                  className="hover:bg-ctp-blue/90 w-full bg-ctp-blue text-ctp-base"
                >
                  {suggestNextGameMutation.isPending ? "Analyzing..." : "Get Suggestion"}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg bg-ctp-surface0 p-4">
                <h3 className="mb-2 text-xl font-semibold text-ctp-blue">
                  {suggestedGame.gameName}
                </h3>
                {suggestedGame.estimatedHours && (
                  <p className="mb-3 text-sm text-ctp-overlay1">
                    Estimated playtime: {suggestedGame.estimatedHours} hours
                  </p>
                )}
                <p className="text-sm text-ctp-subtext0">{suggestedGame.reasoning}</p>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => {
                    setSuggestedGame(null);
                    setNextGameInput("");
                  }}
                  className="w-full bg-ctp-surface0 text-ctp-text hover:bg-ctp-surface1"
                >
                  Get Another Suggestion
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showGenerateCoverModal} onOpenChange={setShowGenerateCoverModal}>
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto border-ctp-surface1 bg-ctp-mantle">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-ctp-text">
              Generate Collection Cover
            </DialogTitle>
          </DialogHeader>

          <p className="text-sm text-ctp-subtext0">
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
                className="w-full justify-start bg-ctp-surface0 p-4 text-left hover:bg-ctp-surface1"
              >
                <h3 className="mb-1 text-base font-semibold text-ctp-text">{collection.name}</h3>
                {collection.description && (
                  <p className="text-sm text-ctp-subtext0">{collection.description}</p>
                )}
              </Button>
            ))}
          </div>

          {collectionsData?.collections.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-ctp-subtext0">No collections found. Create a collection first.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={showConfirmModal}
        onOpenChange={(open: boolean) => !open && handleCancelAction()}
      >
        {confirmAction && (
          <AlertDialogContent className="border-ctp-surface1 bg-ctp-mantle">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-bold text-ctp-text">
                Confirm Action
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="rounded-lg bg-ctp-surface0 p-4">
                  <div className="flex items-start gap-3">
                    <svg
                      className="mt-0.5 h-6 w-6 flex-shrink-0 text-ctp-blue"
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
                      <p className="mb-2 text-sm text-ctp-text">
                        {confirmAction.type === "collections"
                          ? confirmAction.theme
                            ? `This will analyze your game library and generate collection suggestions for theme: "${confirmAction.theme}".`
                            : "This will analyze your game library and generate collection suggestions."
                          : confirmAction.type === "nextGame"
                            ? "This will analyze your play history and suggest what to play next."
                            : `This will generate an AI cover image for "${confirmAction.collectionName}".`}
                      </p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs text-ctp-subtext0">Estimated cost:</span>
                        <span className="text-lg font-semibold text-ctp-mauve">
                          ${confirmAction.cost.toFixed(4)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-4 flex flex-col gap-3 sm:flex-row">
              <AlertDialogCancel className="flex-1 border-ctp-surface1 bg-ctp-surface1 text-ctp-text hover:bg-ctp-surface2">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmAction}
                className="hover:bg-ctp-mauve/90 flex-1 bg-ctp-mauve text-ctp-base"
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
