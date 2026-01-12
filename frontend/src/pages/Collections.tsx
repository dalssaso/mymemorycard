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
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <BackButton
                iconOnly={true}
                className="rounded-lg p-2 text-text-secondary transition-all hover:bg-surface hover:text-text-primary md:hidden"
              />
              <h1 className="text-3xl font-bold text-text-primary sm:text-4xl">Collections</h1>
            </div>
            <p className="mt-1 text-text-secondary">Organize your games into custom collections</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="w-full sm:w-auto">
            Create Collection
          </Button>
        </div>

        <div>
          {collections.length === 0 ? (
            <Card className="px-6 py-10" padded={true}>
              <div className="grid gap-6 text-center md:grid-cols-[2fr_1fr] md:text-left">
                <div>
                  <h2 className="mb-3 text-2xl font-bold text-text-primary">No Collections Yet</h2>
                  <p className="mb-6 text-text-secondary">
                    Group your games by theme, mood, or completion goals.
                  </p>
                  <Button onClick={() => setShowCreateModal(true)}>Create Collection</Button>
                </div>
                <div className="bg-surface/40 rounded-lg border border-border p-4">
                  <h3 className="text-sm font-semibold text-text-primary">Ideas to try</h3>
                  <div className="mt-2 space-y-2 text-sm text-text-secondary">
                    <p>Story-driven RPGs</p>
                    <p>Short backlog wins</p>
                    <p>Co-op with friends</p>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm text-text-secondary">
                  {collections.length} {collections.length === 1 ? "collection" : "collections"}
                </span>
                {!selectionMode && collections.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectionMode(true)}
                    className="h-auto text-sm"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="h-4 w-4"
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
                <div className="bg-surface/50 mb-4 flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm font-medium text-text-primary">
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
                        className="h-auto px-2 text-sm"
                      >
                        {allSelected ? "Deselect all" : "Select all"}
                      </Button>
                    )}
                    {selectedCollectionIds.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedCollectionIds([])}
                        className="h-auto px-2 text-sm"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    {selectedCollectionIds.length > 0 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setShowDeleteConfirm(true)}
                      >
                        Delete
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleExitSelectionMode}
                      className="h-auto bg-elevated text-text-primary hover:bg-elevated"
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
                      <div className="relative mb-2 aspect-[3/4] overflow-hidden rounded-lg bg-surface">
                        {collection.cover_filename ? (
                          <img
                            src={`/api/collection-covers/${collection.cover_filename}?v=${coverKey}`}
                            alt={collection.name}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          />
                        ) : collection.cover_art_url ? (
                          <img
                            src={`${collection.cover_art_url}${collection.cover_art_url.includes("?") ? "&" : "?"}v=${coverKey}`}
                            alt={collection.name}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-text-muted">
                            <span className="text-sm">No Cover</span>
                          </div>
                        )}
                        <div className="from-base/70 via-base/20 dark:from-base/80 absolute inset-0 bg-gradient-to-t to-transparent dark:via-transparent dark:to-transparent" />
                        {selectionMode && isSelected && (
                          <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-accent">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={3}
                              stroke="currentColor"
                              className="h-4 w-4 text-text-primary"
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
                        <p className="truncate font-medium text-text-primary transition-colors group-hover:text-accent">
                          {collection.name}
                        </p>
                        <p className="text-sm text-accent">
                          {collection.game_count} {collection.game_count === 1 ? "game" : "games"}
                        </p>
                      </div>
                    </>
                  );

                  const cardClassName = selectionMode
                    ? `rounded-xl border border-border bg-surface/40 cursor-pointer transition-all group relative p-0 sm:p-3 ${isSelected ? "bg-accent/20 border-accent" : "hover:border-border"}`
                    : "rounded-xl border border-border bg-surface/40 hover:border-accent transition-all cursor-pointer group relative p-0 sm:p-3";

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
          <AlertDialogContent className="border-border bg-elevated">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-bold text-text-primary">
                Delete Collections
              </AlertDialogTitle>
              <AlertDialogDescription className="text-text-secondary">
                Are you sure you want to delete {selectedCollectionIds.length} collection(s)? This
                action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-4 flex flex-col gap-3 sm:flex-row">
              <AlertDialogCancel className="border-border bg-elevated text-text-primary hover:bg-elevated">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => bulkDeleteCollectionsMutation.mutate(selectedCollectionIds)}
                className="hover:bg-status-dropped/90 bg-status-dropped text-text-primary"
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
          <DialogContent className="max-w-md border-border bg-elevated">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-text-primary">
                Create Collection
              </DialogTitle>
              <DialogDescription className="text-text-secondary">
                Organize your games into a custom collection.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* AI Toggle */}
              <div className="flex items-center gap-3 rounded-lg bg-surface p-3">
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
                <label htmlFor="use-ai" className="flex-1 cursor-pointer text-sm text-text-primary">
                  Use AI to create collection
                </label>
              </div>

              {/* AI Theme Input (shown when AI is enabled and no suggestion yet) */}
              {useAI && !aiSuggestion && (
                <div className="bg-accent/10 border-accent/20 rounded-lg border p-3">
                  <label
                    className="mb-2 block text-sm font-medium text-text-primary"
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
                    className="mb-3 bg-surface text-text-primary focus-visible:ring-accent"
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
                <div className="bg-status-finished/10 border-status-finished/20 rounded-lg border p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-status-finished">AI Suggestion</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setAiSuggestion(null);
                        setNewCollectionName("");
                        setNewCollectionDescription("");
                      }}
                      className="h-auto px-2 text-xs"
                    >
                      Clear
                    </Button>
                  </div>
                  <p className="mb-1 text-xs text-text-muted">
                    {aiSuggestion.gameIds.length} games will be added:{" "}
                    {aiSuggestion.gameNames.slice(0, 3).join(", ")}
                    {aiSuggestion.gameNames.length > 3 &&
                      ` +${aiSuggestion.gameNames.length - 3} more`}
                  </p>
                  <p className="text-xs italic text-text-muted">{aiSuggestion.reasoning}</p>
                </div>
              )}

              {/* Manual fields - only show when AI is off OR suggestion exists */}
              {(!useAI || aiSuggestion) && (
                <>
                  {/* Name field */}
                  <div>
                    <label
                      className="mb-2 block text-sm font-medium text-text-secondary"
                      htmlFor="collection-name"
                    >
                      Name{" "}
                      {aiSuggestion && <span className="text-status-finished">(AI suggested)</span>}
                    </label>
                    <Input
                      id="collection-name"
                      type="text"
                      value={newCollectionName}
                      onChange={(e) => setNewCollectionName(e.target.value)}
                      placeholder="e.g., Couch Co-op Games"
                      className="bg-surface text-text-primary focus-visible:ring-accent"
                    />
                  </div>

                  {/* Description field */}
                  <div>
                    <label
                      className="mb-2 block text-sm font-medium text-text-secondary"
                      htmlFor="collection-description"
                    >
                      Description (optional){" "}
                      {aiSuggestion && <span className="text-status-finished">(AI suggested)</span>}
                    </label>
                    <Textarea
                      id="collection-description"
                      value={newCollectionDescription}
                      onChange={(e) => setNewCollectionDescription(e.target.value)}
                      placeholder="Describe your collection..."
                      className="min-h-24 bg-surface text-text-primary focus-visible:ring-accent"
                    />
                  </div>

                  {/* Cover Image upload */}
                  <div>
                    <label
                      className="mb-2 block text-sm font-medium text-text-secondary"
                      htmlFor="collection-cover"
                    >
                      Cover Image (optional)
                    </label>
                    <p className="mb-2 text-xs text-text-muted">
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
                      className="bg-surface text-text-primary focus-visible:ring-accent"
                    />
                    {coverPreviewUrl && (
                      <div className="mt-2">
                        <img
                          src={coverPreviewUrl}
                          alt="Preview"
                          className="mx-auto max-h-48 rounded-lg"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setNewCollectionCoverFile(null);
                            setCoverPreviewUrl(null);
                          }}
                          className="mt-1 h-auto px-2 text-sm"
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
                          onCheckedChange={(checked) => setGenerateCoverOnCreate(checked === true)}
                        />
                        <label
                          htmlFor="generate-cover"
                          className="cursor-pointer text-sm text-text-secondary"
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
          <AlertDialogContent className="border-border bg-elevated">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-bold text-text-primary">
                Confirm AI Generation
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-text-secondary">
                This will generate an AI-powered collection suggestion for theme: &quot;{aiTheme}
                &quot;
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex items-baseline gap-2">
              <span className="text-sm text-text-secondary">Estimated cost:</span>
              <span className="text-lg font-semibold text-accent">
                ${estimatedAICost.toFixed(4)}
              </span>
            </div>
            <AlertDialogFooter className="mt-4 flex flex-col gap-3 sm:flex-row">
              <AlertDialogCancel className="flex-1 border-border bg-elevated text-text-primary hover:bg-elevated">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmAIGeneration}
                className="hover:bg-accent/90 flex-1 bg-accent text-text-primary"
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
