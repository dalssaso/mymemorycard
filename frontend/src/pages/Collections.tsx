import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { BackButton, PageLayout } from "@/components/layout";
import { CollectionsSidebar } from "@/components/sidebar";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Textarea,
} from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { collectionsAPI, aiAPI, type CollectionSuggestion } from "@/lib/api";
import { useCollections } from "@/hooks/useCollections";

export function Collections() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDescription, setNewCollectionDescription] = useState("");
  const [newCollectionCoverFile, setNewCollectionCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [coverKey, setCoverKey] = useState(Date.now());
  const [useAI, setUseAI] = useState(false);
  const [aiTheme, setAiTheme] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState<CollectionSuggestion | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showAICostConfirm, setShowAICostConfirm] = useState(false);
  const [estimatedAICost, setEstimatedAICost] = useState(0);
  const [generateCoverOnCreate, setGenerateCoverOnCreate] = useState(false);

  const resetCreateModal = () => {
    setNewCollectionName("");
    setNewCollectionDescription("");
    setNewCollectionCoverFile(null);
    setCoverPreviewUrl(null);
    setUseAI(false);
    setAiTheme("");
    setAiSuggestion(null);
    setGenerateCoverOnCreate(false);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    resetCreateModal();
  };

  const { data: collectionsData } = useCollections();

  const { data: settingsData } = useQuery({
    queryKey: ["ai-settings"],
    queryFn: async () => {
      const response = await aiAPI.getSettings();
      return response.data;
    },
  });

  const bulkDeleteCollectionsMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => collectionsAPI.delete(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      setSelectedCollectionIds([]);
      setSelectionMode(false);
      setShowDeleteConfirm(false);
      showToast("Collections deleted", "success");
    },
    onError: () => {
      showToast("Failed to delete collections", "error");
    },
  });

  const collections = collectionsData?.collections || [];

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) {
      showToast("Collection name is required", "error");
      return;
    }

    setIsUploadingCover(true);

    try {
      const result = await collectionsAPI.create(newCollectionName, newCollectionDescription);
      const newCollectionId = result.data.collection.id;

      // Upload cover if provided
      if (newCollectionCoverFile && newCollectionId) {
        await collectionsAPI.uploadCover(newCollectionId, newCollectionCoverFile);
      }

      // Add AI-suggested games if available
      if (aiSuggestion && aiSuggestion.gameIds.length > 0) {
        await collectionsAPI.bulkAddGames(newCollectionId, aiSuggestion.gameIds);
      }

      // Generate AI cover if requested and no manual cover was uploaded
      let coverCost = 0;
      if (generateCoverOnCreate && !newCollectionCoverFile) {
        const coverResult = await aiAPI.generateCover(
          newCollectionName,
          newCollectionDescription,
          newCollectionId
        );
        coverCost = coverResult.data.cost;
      }

      setCoverKey(Date.now());
      await queryClient.refetchQueries({ queryKey: ["collections"] });
      if (coverCost > 0) {
        queryClient.invalidateQueries({ queryKey: ["ai-activity"] });
      }

      const gameCount = aiSuggestion?.gameIds.length || 0;
      let message =
        gameCount > 0
          ? `Collection created with ${gameCount} games`
          : "Collection created successfully";
      if (coverCost > 0) {
        message += ` (cover: $${coverCost.toFixed(4)})`;
      }
      showToast(message, "success");

      // Reset state
      setShowCreateModal(false);
      setNewCollectionName("");
      setNewCollectionDescription("");
      setNewCollectionCoverFile(null);
      setCoverPreviewUrl(null);
      setUseAI(false);
      setAiTheme("");
      setAiSuggestion(null);
      setGenerateCoverOnCreate(false);
    } catch (error: unknown) {
      const message =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      showToast(message ?? "Failed to create collection", "error");
    } finally {
      setIsUploadingCover(false);
    }
  };

  const toggleCollectionSelection = (id: string) => {
    setSelectedCollectionIds((current) =>
      current.includes(id)
        ? current.filter((collectionId) => collectionId !== id)
        : [...current, id]
    );
  };

  const allSelected = collections.length > 0 && selectedCollectionIds.length === collections.length;

  const handleExitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedCollectionIds([]);
  };

  const handleGenerateAISuggestion = async () => {
    if (!aiTheme.trim()) {
      showToast("Please enter a theme for AI suggestions", "error");
      return;
    }

    try {
      const { data } = await aiAPI.estimateCost("suggest_collections");
      setEstimatedAICost(data.estimatedCostUsd);
      setShowAICostConfirm(true);
    } catch {
      showToast("Failed to estimate cost", "error");
    }
  };

  const handleConfirmAIGeneration = async () => {
    setShowAICostConfirm(false);
    setIsGeneratingAI(true);

    try {
      const response = await aiAPI.suggestCollections(aiTheme);
      // Take the first suggestion and pre-fill the form
      if (response.data.collections.length > 0) {
        const suggestion = response.data.collections[0];
        setAiSuggestion(suggestion);
        setNewCollectionName(suggestion.name);
        setNewCollectionDescription(suggestion.description);
        showToast(`AI suggestion generated ($${response.data.cost.toFixed(4)})`, "success");
      } else {
        showToast("No suggestions generated for this theme", "error");
      }
    } catch (error: unknown) {
      const message =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      showToast(message ?? "Failed to generate AI suggestion", "error");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  return (
    <PageLayout
      sidebar={<CollectionsSidebar onCreateCollection={() => setShowCreateModal(true)} />}
      customCollapsed={true}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-3 mb-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <BackButton
                iconOnly={true}
                className="md:hidden p-2 rounded-lg text-ctp-subtext0 hover:bg-ctp-surface0 hover:text-ctp-text transition-all"
              />
              <h1 className="text-3xl font-bold text-ctp-text sm:text-4xl">Collections</h1>
            </div>
            <p className="text-ctp-subtext0 mt-1">Organize your games into custom collections</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="w-full sm:w-auto">
            Create Collection
          </Button>
        </div>

        <div>
          {collections.length === 0 ? (
            <Card>
              <p className="text-ctp-subtext0 text-center py-8">
                No collections yet. Create your first collection to organize your games!
              </p>
            </Card>
          ) : (
            <>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm text-ctp-subtext0">
                  {collections.length} {collections.length === 1 ? "collection" : "collections"}
                </span>
                {!selectionMode && collections.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectionMode(true)}
                    className="h-auto border-ctp-surface1 text-ctp-subtext0 hover:border-ctp-surface2 hover:text-ctp-text"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                      />
                    </svg>
                    Select
                  </Button>
                )}
              </div>

              {selectionMode && (
                <div className="mb-4 p-3 bg-ctp-surface0/50 border border-ctp-surface1 rounded-lg flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm font-medium text-ctp-text">
                      {selectedCollectionIds.length > 0
                        ? `${selectedCollectionIds.length} collection(s) selected`
                        : "Select collections to manage"}
                    </span>
                    {collections.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setSelectedCollectionIds(
                            allSelected ? [] : collections.map((collection) => collection.id)
                          )
                        }
                        className="h-auto px-2 text-sm text-ctp-subtext0 hover:text-ctp-text hover:bg-transparent"
                      >
                        {allSelected ? "Deselect all" : "Select all"}
                      </Button>
                    )}
                    {selectedCollectionIds.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedCollectionIds([])}
                        className="h-auto px-2 text-sm text-ctp-subtext0 hover:text-ctp-text hover:bg-transparent"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    {selectedCollectionIds.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="h-auto border-ctp-red/30 bg-ctp-red/20 text-ctp-red hover:bg-ctp-red/30"
                      >
                        Delete
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleExitSelectionMode}
                      className="h-auto bg-ctp-surface1 text-ctp-text hover:bg-ctp-surface2"
                    >
                      Done
                    </Button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {collections.map((collection) => {
                  const isSelected = selectedCollectionIds.includes(collection.id);
                  const cardContent = (
                    <>
                      <div className="aspect-[3/4] rounded-lg overflow-hidden bg-ctp-surface0 mb-2 relative">
                        {collection.cover_filename ? (
                          <img
                            src={`/api/collection-covers/${collection.cover_filename}?v=${coverKey}`}
                            alt={collection.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : collection.cover_art_url ? (
                          <img
                            src={`${collection.cover_art_url}${collection.cover_art_url.includes("?") ? "&" : "?"}v=${coverKey}`}
                            alt={collection.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-ctp-overlay1">
                            <span className="text-sm">No Cover</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-ctp-base/70 via-ctp-base/20 to-transparent dark:from-ctp-crust/80 dark:via-transparent dark:to-transparent" />
                        {selectionMode && isSelected && (
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
                      <div className="flex flex-col gap-1 px-2 pb-2 sm:px-0 sm:pb-0">
                        <p className="text-ctp-text font-medium truncate group-hover:text-ctp-mauve transition-colors">
                          {collection.name}
                        </p>
                        <p className="text-sm text-ctp-mauve">
                          {collection.game_count} {collection.game_count === 1 ? "game" : "games"}
                        </p>
                      </div>
                    </>
                  );

                  const cardClassName = selectionMode
                    ? `rounded-xl border border-ctp-surface1 bg-ctp-surface0/40 cursor-pointer transition-all group relative p-0 sm:p-3 ${isSelected ? "bg-ctp-mauve/20 border-ctp-mauve" : "hover:border-zinc-500"}`
                    : "rounded-xl border border-ctp-surface1 bg-ctp-surface0/40 hover:border-ctp-mauve transition-all cursor-pointer group relative p-0 sm:p-3";

                  return selectionMode ? (
                    <div
                      key={collection.id}
                      className={cardClassName}
                      onClick={() => toggleCollectionSelection(collection.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          toggleCollectionSelection(collection.id);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      {cardContent}
                    </div>
                  ) : (
                    <Link
                      key={collection.id}
                      to="/collections/$id"
                      params={{ id: collection.id }}
                      className={cardClassName}
                    >
                      {cardContent}
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent className="border-ctp-surface1 bg-ctp-mantle">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-bold text-ctp-text">
                Delete Collections
              </AlertDialogTitle>
              <AlertDialogDescription className="text-ctp-subtext0">
                Are you sure you want to delete {selectedCollectionIds.length} collection(s)? This
                action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-4 flex flex-col gap-3 sm:flex-row">
              <AlertDialogCancel className="border-ctp-surface1 bg-ctp-surface1 text-ctp-text hover:bg-ctp-surface2">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => bulkDeleteCollectionsMutation.mutate(selectedCollectionIds)}
                className="bg-ctp-red text-ctp-base hover:bg-ctp-red/90"
              >
                {bulkDeleteCollectionsMutation.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Create Collection Modal */}
        <Dialog
          open={showCreateModal}
          onOpenChange={(open) => {
            if (open) {
              setShowCreateModal(true);
            } else {
              handleCloseCreateModal();
            }
          }}
        >
          <DialogContent className="max-w-md border-ctp-surface1 bg-ctp-mantle">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-ctp-text">Create Collection</DialogTitle>
              <DialogDescription className="text-ctp-subtext0">
                Organize your games into a custom collection.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
                {/* AI Toggle */}
                <div className="flex items-center gap-3 p-3 bg-ctp-surface0 rounded-lg">
                  <Checkbox
                    id="use-ai"
                    checked={useAI}
                    onCheckedChange={(checked) => {
                      const nextValue = checked === true;
                      setUseAI(nextValue);
                      if (!nextValue) {
                        setAiSuggestion(null);
                        setAiTheme("");
                      }
                    }}
                  />
                  <label htmlFor="use-ai" className="text-sm text-ctp-text cursor-pointer flex-1">
                    Use AI to create collection
                  </label>
                </div>

                {/* AI Theme Input (shown when AI is enabled and no suggestion yet) */}
                {useAI && !aiSuggestion && (
                  <div className="p-3 bg-ctp-mauve/10 border border-ctp-mauve/20 rounded-lg">
                    <label
                      className="block text-sm font-medium text-ctp-text mb-2"
                      htmlFor="collection-theme"
                    >
                      Collection Theme
                    </label>
                    <Input
                      id="collection-theme"
                      type="text"
                      value={aiTheme}
                      onChange={(e) => setAiTheme(e.target.value)}
                      placeholder="e.g., Cozy games for rainy days"
                      className="mb-3 bg-ctp-surface0 text-ctp-text focus-visible:ring-ctp-mauve"
                    />
                    <Button
                      onClick={handleGenerateAISuggestion}
                      disabled={isGeneratingAI || !aiTheme.trim()}
                      className="w-full"
                    >
                      {isGeneratingAI ? "Generating..." : "Generate AI Suggestion"}
                    </Button>
                  </div>
                )}

                {/* AI Suggestion Preview */}
                {aiSuggestion && (
                  <div className="p-3 bg-ctp-green/10 border border-ctp-green/20 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-ctp-green">AI Suggestion</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setAiSuggestion(null);
                          setNewCollectionName("");
                          setNewCollectionDescription("");
                        }}
                        className="h-auto px-2 text-xs text-ctp-subtext0 hover:text-ctp-text hover:bg-transparent"
                      >
                        Clear
                      </Button>
                    </div>
                    <p className="text-xs text-ctp-overlay1 mb-1">
                      {aiSuggestion.gameIds.length} games will be added:{" "}
                      {aiSuggestion.gameNames.slice(0, 3).join(", ")}
                      {aiSuggestion.gameNames.length > 3 &&
                        ` +${aiSuggestion.gameNames.length - 3} more`}
                    </p>
                    <p className="text-xs text-ctp-overlay2 italic">{aiSuggestion.reasoning}</p>
                  </div>
                )}

                {/* Manual fields - only show when AI is off OR suggestion exists */}
                {(!useAI || aiSuggestion) && (
                  <>
                    {/* Name field */}
                    <div>
                      <label
                        className="block text-sm font-medium text-ctp-subtext0 mb-2"
                        htmlFor="collection-name"
                      >
                        Name{" "}
                        {aiSuggestion && <span className="text-ctp-green">(AI suggested)</span>}
                      </label>
                      <Input
                        id="collection-name"
                        type="text"
                        value={newCollectionName}
                        onChange={(e) => setNewCollectionName(e.target.value)}
                        placeholder="e.g., Couch Co-op Games"
                        className="bg-ctp-surface0 text-ctp-text focus-visible:ring-ctp-mauve"
                      />
                    </div>

                    {/* Description field */}
                    <div>
                      <label
                        className="block text-sm font-medium text-ctp-subtext0 mb-2"
                        htmlFor="collection-description"
                      >
                        Description (optional){" "}
                        {aiSuggestion && <span className="text-ctp-green">(AI suggested)</span>}
                      </label>
                      <Textarea
                        id="collection-description"
                        value={newCollectionDescription}
                        onChange={(e) => setNewCollectionDescription(e.target.value)}
                        placeholder="Describe your collection..."
                        className="min-h-24 bg-ctp-surface0 text-ctp-text focus-visible:ring-ctp-mauve"
                      />
                    </div>

                    {/* Cover Image upload */}
                    <div>
                      <label
                        className="block text-sm font-medium text-ctp-subtext0 mb-2"
                        htmlFor="collection-cover"
                      >
                        Cover Image (optional)
                      </label>
                      <p className="text-xs text-ctp-overlay1 mb-2">
                        Recommended: 600x900px or similar aspect ratio (3:4). Max 5MB.
                      </p>
                      <Input
                        id="collection-cover"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 5 * 1024 * 1024) {
                              showToast("Image must be under 5MB", "error");
                              e.target.value = "";
                              return;
                            }
                            setNewCollectionCoverFile(file);
                            setCoverPreviewUrl(URL.createObjectURL(file));
                          }
                        }}
                        className="bg-ctp-surface0 text-ctp-text focus-visible:ring-ctp-mauve"
                      />
                      {coverPreviewUrl && (
                        <div className="mt-2">
                          <img
                            src={coverPreviewUrl}
                            alt="Preview"
                            className="max-h-48 rounded-lg mx-auto"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setNewCollectionCoverFile(null);
                              setCoverPreviewUrl(null);
                            }}
                            className="mt-1 h-auto px-2 text-sm text-ctp-subtext0 hover:text-ctp-text hover:bg-transparent"
                          >
                            Remove
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* AI Cover Generation option */}
                    {aiSuggestion &&
                      !coverPreviewUrl &&
                      settingsData?.activeProvider?.provider === "openai" && (
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="generate-cover"
                            checked={generateCoverOnCreate}
                            onCheckedChange={(checked) =>
                              setGenerateCoverOnCreate(checked === true)
                            }
                          />
                          <label
                            htmlFor="generate-cover"
                            className="text-sm text-ctp-subtext0 cursor-pointer"
                          >
                            Generate AI cover (~$0.04)
                          </label>
                        </div>
                      )}
                  </>
                )}
              </div>
            <DialogFooter className="mt-2 flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={handleCreateCollection}
                disabled={isUploadingCover || (useAI && !aiSuggestion && !newCollectionName.trim())}
                className="flex-1"
              >
                {isUploadingCover
                  ? "Creating..."
                  : aiSuggestion
                    ? `Create with ${aiSuggestion.gameIds.length} games`
                    : "Create"}
              </Button>
              <Button variant="secondary" onClick={handleCloseCreateModal} className="flex-1">
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* AI Cost Confirmation Modal */}
        <AlertDialog open={showAICostConfirm} onOpenChange={setShowAICostConfirm}>
          <AlertDialogContent className="border-ctp-surface1 bg-ctp-mantle">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-bold text-ctp-text">
                Confirm AI Generation
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-ctp-subtext0">
                This will generate an AI-powered collection suggestion for theme: &quot;{aiTheme}
                &quot;
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex items-baseline gap-2">
              <span className="text-sm text-ctp-subtext0">Estimated cost:</span>
              <span className="text-lg font-semibold text-ctp-mauve">
                ${estimatedAICost.toFixed(4)}
              </span>
            </div>
            <AlertDialogFooter className="mt-4 flex flex-col gap-3 sm:flex-row">
              <AlertDialogCancel className="flex-1 border-ctp-surface1 bg-ctp-surface1 text-ctp-text hover:bg-ctp-surface2">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmAIGeneration}
                className="flex-1 bg-ctp-mauve text-ctp-base hover:bg-ctp-mauve/90"
              >
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageLayout>
  );
}
