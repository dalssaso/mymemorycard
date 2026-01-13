import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { BackButton, PageLayout } from "@/components/layout";
import { ImportSidebar } from "@/components/sidebar";
import { cn } from "@/lib/utils";
import {
  Button,
  Card,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  ScrollFade,
  Textarea,
} from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { importAPI, userPlatformsAPI } from "@/lib/api";

interface UserPlatform {
  id: string;
  platform_id: string;
  name: string;
  display_name: string;
  platform_type: string | null;
}

interface ImportedGame {
  game: {
    id: string;
    name: string;
    cover_art_url: string | null;
  };
  display?: {
    name: string;
    cover_art_url: string | null;
  } | null;
  source: "exact" | "selected";
}

interface NeedsReview {
  searchTerm: string;
  candidates: Array<{
    id: number;
    name: string;
    background_image: string | null;
    released: string | null;
  }>;
  error?: string;
}

interface ImportResult {
  imported: ImportedGame[];
  needsReview: NeedsReview[];
}

interface ConfirmationGame {
  rawgId: number;
  name: string;
  background_image: string | null;
  released: string | null;
  searchTerm: string;
}

export function Import() {
  const [gameNames, setGameNames] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("");
  const [results, setResults] = useState<ImportResult | null>(null);
  const [selectedCandidates, setSelectedCandidates] = useState<number[]>([]);
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  const [activeSelectionId, setActiveSelectionId] = useState<number | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [gamesForConfirmation, setGamesForConfirmation] = useState<ConfirmationGame[]>([]);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const refreshDashboardData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["games"] }),
      queryClient.invalidateQueries({ queryKey: ["achievementStats"] }),
      queryClient.refetchQueries({ queryKey: ["games"], type: "all" }),
      queryClient.refetchQueries({ queryKey: ["achievementStats"], type: "all" }),
    ]);
  };

  // Fetch platforms
  const { data: platformsData } = useQuery({
    queryKey: ["user-platforms"],
    queryFn: async () => {
      const response = await userPlatformsAPI.getAll();
      return response.data as { platforms: UserPlatform[] };
    },
  });

  const platforms = (platformsData?.platforms || []).map((platform) => ({
    id: platform.platform_id,
    name: platform.name,
    display_name: platform.display_name,
    platform_type: platform.platform_type,
  }));

  // Set default platform to steam (first PC platform) when platforms load
  if (platforms.length > 0 && !selectedPlatform) {
    const steamPlatform = platforms.find((p) => p.name === "steam");
    setSelectedPlatform(steamPlatform?.id || platforms[0].id);
  }

  const importMutation = useMutation({
    mutationFn: ({ names, platformId }: { names: string[]; platformId?: string }) =>
      importAPI.bulk(names, platformId),
    onSuccess: async (response) => {
      setResults(response.data);
      setSelectedCandidates([]);
      const result = response.data as ImportResult;

      // Refresh dashboard data so achievements sync without a full reload
      await refreshDashboardData();

      // Invalidate individual game caches for imported games
      // This ensures game detail pages show updated platform info
      result.imported.forEach((item) => {
        queryClient.invalidateQueries({ queryKey: ["game", item.game.id] });
      });

      // Show success toast
      if (result.imported.length > 0) {
        showToast(`Successfully imported ${result.imported.length} game(s)`, "success");
      }

      // Show warning if there are items needing review
      if (result.needsReview.length > 0) {
        showToast(`${result.needsReview.length} game(s) need review`, "warning");
        setIsSelectionModalOpen(true);
      }

      // If all games were imported successfully (no review needed), navigate to library
      if (result.needsReview.length === 0 && result.imported.length > 0) {
        setTimeout(() => {
          navigate({ to: "/library" });
        }, 2000);
      }
    },
    onError: () => {
      showToast("Failed to import games", "error");
    },
  });

  const selectMutation = useMutation({
    mutationFn: ({ rawgId, platformId }: { rawgId: number; platformId?: string }) =>
      importAPI.single(rawgId, platformId),
    onSuccess: async (response, variables) => {
      const importedGame = response.data as {
        game: ImportedGame["game"];
        source: string;
        display?: ImportedGame["display"];
      };

      // Update results to move item from needsReview to imported
      setResults((prev) => {
        if (!prev) return prev;

        // Find and remove the needsReview item that contained this candidate
        const updatedNeedsReview = prev.needsReview.filter(
          (item) => !item.candidates.some((c) => c.id === variables.rawgId)
        );

        return {
          imported: [
            ...prev.imported,
            { game: importedGame.game, display: importedGame.display, source: "selected" as const },
          ],
          needsReview: updatedNeedsReview,
        };
      });

      setSelectedCandidates((prev) => prev.filter((id) => id !== variables.rawgId));

      // Refresh dashboard data so achievements sync without a full reload
      await refreshDashboardData();
      queryClient.invalidateQueries({ queryKey: ["game", importedGame.game.id] });

      showToast(`Imported ${importedGame.game.name}`, "success");
    },
    onError: () => {
      showToast("Failed to import game", "error");
    },
    onSettled: () => {
      setActiveSelectionId(null);
    },
  });

  const bulkSelectMutation = useMutation({
    mutationFn: async ({ rawgIds, platformId }: { rawgIds: number[]; platformId?: string }) => {
      const responses = await Promise.all(
        rawgIds.map(async (rawgId) => {
          const response = await importAPI.single(rawgId, platformId);
          return response.data as {
            game: ImportedGame["game"];
            source: string;
            display?: ImportedGame["display"];
          };
        })
      );
      return responses;
    },
    onSuccess: async (importedGames, variables) => {
      setResults((prev) => {
        if (!prev) return prev;
        const selectedIds = new Set(variables.rawgIds);
        const updatedNeedsReview = prev.needsReview.filter(
          (item) => !item.candidates.some((candidate) => selectedIds.has(candidate.id))
        );

        return {
          imported: [
            ...prev.imported,
            ...importedGames.map((game) => ({
              game: game.game,
              display: game.display,
              source: "selected" as const,
            })),
          ],
          needsReview: updatedNeedsReview,
        };
      });

      setSelectedCandidates([]);
      setIsSelectionModalOpen(false);
      setIsConfirmModalOpen(false);
      await refreshDashboardData();
      importedGames.forEach((game) => {
        queryClient.invalidateQueries({ queryKey: ["game", game.game.id] });
      });

      showToast(`Imported ${importedGames.length} game(s)`, "success");
      navigate({ to: "/dashboard" });
    },
    onError: () => {
      showToast("Failed to import selected games", "error");
    },
  });

  const toggleCandidateSelection = (rawgId: number) => {
    setSelectedCandidates((prev) =>
      prev.includes(rawgId) ? prev.filter((id) => id !== rawgId) : [...prev, rawgId]
    );
  };

  const handleImport = () => {
    const names = gameNames
      .split("\n")
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    if (names.length === 0) {
      return;
    }

    if (!selectedPlatform) {
      return;
    }

    setResults(null);
    importMutation.mutate({
      names,
      platformId: selectedPlatform,
    });
  };

  const handleImportSelected = () => {
    if (selectedCandidates.length === 0 || !selectedPlatform) {
      return;
    }

    // Map selected rawgIds to full game data
    const gamesData = selectedCandidates
      .map((rawgId) => {
        for (const reviewItem of results!.needsReview) {
          const candidate = reviewItem.candidates.find((c) => c.id === rawgId);
          if (candidate) {
            return {
              rawgId: candidate.id,
              name: candidate.name,
              background_image: candidate.background_image,
              released: candidate.released,
              searchTerm: reviewItem.searchTerm,
            };
          }
        }
        return null;
      })
      .filter((game): game is ConfirmationGame => game !== null);

    setGamesForConfirmation(gamesData);
    setIsSelectionModalOpen(false);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmImport = () => {
    bulkSelectMutation.mutate({
      rawgIds: selectedCandidates,
      platformId: selectedPlatform,
    });
  };

  const handleCancelConfirmation = (): void => {
    setIsConfirmModalOpen(false);
    setIsSelectionModalOpen(true);
  };

  const getSelectionList = (needsReview: NeedsReview[]) => {
    const entries = needsReview.flatMap((item) =>
      item.candidates.map((candidate) => ({
        searchTerm: item.searchTerm,
        candidate,
      }))
    );

    return entries.sort((a, b) => {
      const aSelected = selectedCandidates.includes(a.candidate.id);
      const bSelected = selectedCandidates.includes(b.candidate.id);

      if (aSelected !== bSelected) {
        return aSelected ? -1 : 1;
      }

      return a.candidate.name.localeCompare(b.candidate.name);
    });
  };

  const getPlatformDisplayName = (): string => {
    const platform = platforms.find((p) => p.id === selectedPlatform);
    return platform?.display_name || "your platform";
  };

  const sidebarContent = (
    <ImportSidebar
      platforms={platforms}
      selectedPlatform={selectedPlatform}
      onPlatformSelect={setSelectedPlatform}
      isImporting={importMutation.isPending}
    />
  );

  return (
    <PageLayout sidebar={sidebarContent} customCollapsed={true}>
      <div className="mx-auto max-w-4xl">
        <div className="mb-2 flex items-center gap-3">
          <BackButton
            iconOnly={true}
            className="rounded-lg p-2 text-text-secondary transition-all duration-standard hover:bg-surface hover:text-text-primary md:hidden"
          />
          <h1 className="text-4xl font-bold text-text-primary">Import Games</h1>
        </div>
        <p className="mb-8 text-text-secondary">
          Paste game names (one per line) and we&apos;ll automatically enrich them with metadata
        </p>

        {platforms.length === 0 && (
          <Card className="mb-8 p-6">
            <p className="text-text-secondary">
              You have not selected any platforms yet. Choose your platforms to start importing.
            </p>
            <div className="mt-4">
              <Button asChild>
                <Link to="/platforms">Choose Platforms</Link>
              </Button>
            </div>
          </Card>
        )}

        <Card className="mb-8 p-6">
          <div className="mb-6">
            <p className="mb-3 block text-sm font-medium">Platform (Required)</p>
            <div className="flex flex-wrap gap-2">
              {platforms.map((platform) => (
                <Button
                  key={platform.id}
                  variant={selectedPlatform === platform.id ? "default" : "outline"}
                  type="button"
                  onClick={() => setSelectedPlatform(platform.id)}
                  disabled={importMutation.isPending}
                  className={cn(
                    "transition-colors duration-standard",
                    selectedPlatform === platform.id
                      ? "shadow-glow-purple hover:bg-accent/90 border-accent bg-accent text-text-primary"
                      : "border-border bg-base text-text-secondary hover:border-accent hover:text-text-primary"
                  )}
                >
                  {platform.display_name}
                </Button>
              ))}
            </div>
            {selectedPlatform && (
              <p className="mt-2 text-xs text-accent">
                Games will be imported to{" "}
                {platforms.find((p) => p.id === selectedPlatform)?.display_name}
              </p>
            )}
          </div>

          <label className="mb-2 block text-sm font-medium" htmlFor="import-game-names">
            Game Names
          </label>
          <Textarea
            id="import-game-names"
            value={gameNames}
            onChange={(e) => setGameNames(e.target.value)}
            className="min-h-[300px] font-mono text-sm"
            placeholder={"The Witcher 3\nGod of War\nHalo Infinite\nCyberpunk 2077\nElden Ring"}
            disabled={importMutation.isPending}
          />

          <div className="mt-4 flex gap-4">
            <Button
              onClick={handleImport}
              disabled={importMutation.isPending || !gameNames.trim() || !selectedPlatform}
            >
              {importMutation.isPending ? "Importing..." : "Import Games"}
            </Button>

            {results && results.imported.length > 0 && results.needsReview.length === 0 && (
              <Button asChild>
                <Link to="/library">View Library</Link>
              </Button>
            )}

            {results && (
              <Button
                onClick={() => {
                  setGameNames("");
                  setResults(null);
                  setSelectedCandidates([]);
                  setIsSelectionModalOpen(false);
                }}
                variant="secondary"
              >
                Clear
              </Button>
            )}
          </div>

          {importMutation.isError && (
            <div className="bg-status-dropped/20 mt-4 rounded border border-status-dropped px-4 py-2 text-status-dropped">
              Failed to import games. Please try again.
            </div>
          )}
        </Card>

        {importMutation.isPending && (
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              <span className="text-text-secondary">Importing and enriching games...</span>
            </div>
          </Card>
        )}

        {results && (
          <div className="space-y-6">
            {results.imported.length > 0 && (
              <Card className="p-6">
                <h2 className="mb-4 text-2xl font-bold text-status-finished">
                  Successfully Imported ({results.imported.length})
                </h2>
                <div className="space-y-3">
                  {results.imported.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-4 rounded border border-border bg-elevated p-3"
                    >
                      {item.display?.cover_art_url || item.game.cover_art_url ? (
                        <img
                          src={item.display?.cover_art_url || item.game.cover_art_url || undefined}
                          alt={item.display?.name || item.game.name}
                          className="h-16 w-16 rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded bg-surface">
                          <span className="text-xs text-text-muted">No image</span>
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-medium">{item.display?.name || item.game.name}</h3>
                        <p className="text-sm text-text-muted">
                          {item.source === "exact" ? "Exact match" : "Selected"}
                        </p>
                      </div>
                      <div className="text-status-finished">
                        <svg
                          className="h-6 w-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {results.needsReview.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-bold text-accent">
                      Select the games from the list below
                    </h2>
                    <p className="mt-2 text-sm text-text-muted">
                      Choose the correct match for each entry. You can import multiple games at
                      once.
                    </p>
                  </div>
                  <Button
                    onClick={() => setIsSelectionModalOpen(true)}
                    variant="secondary"
                    size="sm"
                  >
                    Review selections
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>

      <Dialog
        open={results !== null && results.needsReview.length > 0 && isSelectionModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsSelectionModalOpen(false);
          }
        }}
      >
        <DialogContent className="flex max-h-[85vh] max-w-3xl flex-col border-border bg-elevated">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-text-primary">
              Select games ({selectedCandidates.length} selected)
            </DialogTitle>
            <DialogDescription>Select each match and import in bulk when ready.</DialogDescription>
          </DialogHeader>

          <ScrollFade axis="y" className="flex-1 space-y-2 overflow-y-auto pr-2">
            {results?.needsReview.some((item) => item.error) && (
              <div className="bg-status-dropped/10 border-status-dropped/30 rounded border p-3 text-sm text-status-dropped">
                Some items failed to search. You can retry those imports later.
              </div>
            )}
            {results && getSelectionList(results.needsReview).length === 0 ? (
              <div className="py-6 text-center text-sm text-text-secondary">
                No matches found for the imported names.
              </div>
            ) : (
              results &&
              getSelectionList(results.needsReview).map(({ candidate, searchTerm }) => {
                const isSelected = selectedCandidates.includes(candidate.id);
                return (
                  <div
                    key={`${searchTerm}-${candidate.id}`}
                    onClick={() => toggleCandidateSelection(candidate.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        toggleCandidateSelection(candidate.id);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded border p-3 transition-colors duration-standard",
                      isSelected
                        ? "bg-accent/10 border-accent"
                        : "bg-surface/60 border-border hover:bg-surface"
                    )}
                  >
                    <Checkbox
                      id={`import-select-${candidate.id}`}
                      checked={isSelected}
                      onCheckedChange={() => toggleCandidateSelection(candidate.id)}
                      disabled={bulkSelectMutation.isPending || selectMutation.isPending}
                    />
                    {candidate.background_image ? (
                      <img
                        src={candidate.background_image}
                        alt={candidate.name}
                        className="h-12 w-12 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded bg-surface text-xs text-text-muted">
                        No image
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{candidate.name}</p>
                      <div className="flex items-center gap-2 text-xs text-text-muted">
                        {candidate.released && <span>{candidate.released}</span>}
                        <span className="text-text-secondary">From: {searchTerm}</span>
                      </div>
                    </div>
                    <Button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setActiveSelectionId(candidate.id);
                        selectMutation.mutate({
                          rawgId: candidate.id,
                          platformId: selectedPlatform,
                        });
                      }}
                      disabled={
                        bulkSelectMutation.isPending ||
                        (selectMutation.isPending && activeSelectionId !== candidate.id)
                      }
                      size="sm"
                    >
                      {selectMutation.isPending && activeSelectionId === candidate.id
                        ? "Importing..."
                        : "Select"}
                    </Button>
                  </div>
                );
              })
            )}
          </ScrollFade>

          <DialogFooter className="flex items-center justify-between gap-3 sm:justify-between">
            <div className="text-sm text-text-secondary">{selectedCandidates.length} selected</div>
            <div className="flex gap-2">
              <Button
                onClick={() => setSelectedCandidates([])}
                disabled={selectedCandidates.length === 0}
                variant="secondary"
              >
                Clear selection
              </Button>
              <Button
                onClick={handleImportSelected}
                disabled={
                  selectedCandidates.length === 0 ||
                  !selectedPlatform ||
                  bulkSelectMutation.isPending ||
                  selectMutation.isPending
                }
              >
                {bulkSelectMutation.isPending
                  ? "Importing..."
                  : `Import selected (${selectedCandidates.length})`}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal */}
      <Dialog
        open={isConfirmModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCancelConfirmation();
          }
        }}
      >
        <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col border-border bg-elevated">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-text-primary">
              Confirm Import
            </DialogTitle>
            <DialogDescription>
              You are about to import {gamesForConfirmation.length} game(s) to{" "}
              {getPlatformDisplayName()}
            </DialogDescription>
          </DialogHeader>

          <ScrollFade axis="y" className="flex-1 space-y-2 overflow-y-auto pr-2">
            {gamesForConfirmation.map((game) => (
              <div
                key={game.rawgId}
                className="bg-surface/60 flex items-center gap-3 rounded border border-border p-3"
              >
                {game.background_image ? (
                  <img
                    src={game.background_image}
                    alt={game.name}
                    className="h-16 w-16 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded bg-surface">
                    <span className="text-xs text-text-muted">No image</span>
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-medium text-text-primary">{game.name}</p>
                  <div className="flex items-center gap-2 text-sm text-text-muted">
                    {game.released && <span>{game.released}</span>}
                    <span className="text-text-secondary">From: {game.searchTerm}</span>
                  </div>
                </div>
              </div>
            ))}
          </ScrollFade>

          <DialogFooter className="flex items-center justify-between gap-3 sm:justify-between">
            <Button variant="secondary" onClick={handleCancelConfirmation}>
              Cancel
            </Button>
            <Button onClick={handleConfirmImport} disabled={bulkSelectMutation.isPending}>
              {bulkSelectMutation.isPending
                ? "Importing..."
                : `Confirm Import (${gamesForConfirmation.length})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
