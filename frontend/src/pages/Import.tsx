import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { BackButton, PageLayout } from "@/components/layout";
import { ImportSidebar } from "@/components/sidebar";
import { Checkbox } from "@/components/ui/Checkbox";
import { ScrollFade } from "@/components/ui/ScrollFade";
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

export function Import() {
  const [gameNames, setGameNames] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("");
  const [results, setResults] = useState<ImportResult | null>(null);
  const [selectedCandidates, setSelectedCandidates] = useState<number[]>([]);
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  const [activeSelectionId, setActiveSelectionId] = useState<number | null>(null);
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

    bulkSelectMutation.mutate({
      rawgIds: selectedCandidates,
      platformId: selectedPlatform,
    });
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
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <BackButton
            iconOnly={true}
            className="md:hidden p-2 rounded-lg text-ctp-subtext0 hover:bg-ctp-surface0 hover:text-ctp-text transition-all"
          />
          <h1 className="text-4xl font-bold text-ctp-text">Import Games</h1>
        </div>
        <p className="text-ctp-subtext0 mb-8">
          Paste game names (one per line) and we&apos;ll automatically enrich them with metadata
        </p>

        {platforms.length === 0 && (
          <div className="card mb-8">
            <p className="text-ctp-subtext0">
              You have not selected any platforms yet. Choose your platforms to start importing.
            </p>
            <div className="mt-4">
              <Link to="/platforms" className="btn btn-primary">
                Choose Platforms
              </Link>
            </div>
          </div>
        )}

        <div className="card mb-8">
          <div className="mb-6">
            <p className="block text-sm font-medium mb-3">Platform (Required)</p>
            <div className="flex gap-2 flex-wrap">
              {platforms.map((platform) => (
                <button
                  key={platform.id}
                  type="button"
                  onClick={() => setSelectedPlatform(platform.id)}
                  disabled={importMutation.isPending}
                  className={`px-4 py-2 rounded border transition-all ${
                    selectedPlatform === platform.id
                      ? "bg-ctp-mauve border-ctp-mauve text-ctp-base shadow-glow-purple"
                      : "bg-ctp-mantle border-ctp-surface1 text-ctp-subtext0 hover:border-ctp-surface2 hover:text-ctp-text"
                  }`}
                >
                  {platform.display_name}
                </button>
              ))}
            </div>
            {selectedPlatform && (
              <p className="text-xs text-ctp-teal mt-2">
                Games will be imported to{" "}
                {platforms.find((p) => p.id === selectedPlatform)?.display_name}
              </p>
            )}
          </div>

          <label className="block text-sm font-medium mb-2" htmlFor="import-game-names">
            Game Names
          </label>
          <textarea
            id="import-game-names"
            value={gameNames}
            onChange={(e) => setGameNames(e.target.value)}
            className="input w-full min-h-[300px] font-mono text-sm"
            placeholder={"The Witcher 3\nGod of War\nHalo Infinite\nCyberpunk 2077\nElden Ring"}
            disabled={importMutation.isPending}
          />

          <div className="mt-4 flex gap-4">
            <button
              onClick={handleImport}
              disabled={importMutation.isPending || !gameNames.trim() || !selectedPlatform}
              className="btn btn-primary"
            >
              {importMutation.isPending ? "Importing..." : "Import Games"}
            </button>

            {results && results.imported.length > 0 && results.needsReview.length === 0 && (
              <Link to="/library" className="btn btn-primary">
                View Library
              </Link>
            )}

            {results && (
              <button
                onClick={() => {
                  setGameNames("");
                  setResults(null);
                  setSelectedCandidates([]);
                  setIsSelectionModalOpen(false);
                }}
                className="btn btn-secondary"
              >
                Clear
              </button>
            )}
          </div>

          {importMutation.isError && (
            <div className="mt-4 bg-ctp-red/20 border border-ctp-red text-ctp-red px-4 py-2 rounded">
              Failed to import games. Please try again.
            </div>
          )}
        </div>

        {importMutation.isPending && (
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-ctp-mauve border-t-transparent rounded-full animate-spin" />
              <span className="text-ctp-subtext0">Importing and enriching games...</span>
            </div>
          </div>
        )}

        {results && (
          <div className="space-y-6">
            {results.imported.length > 0 && (
              <div className="card">
                <h2 className="text-2xl font-bold mb-4 text-ctp-green">
                  Successfully Imported ({results.imported.length})
                </h2>
                <div className="space-y-3">
                  {results.imported.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-4 p-3 bg-ctp-mantle rounded border border-ctp-surface1"
                    >
                      {item.display?.cover_art_url || item.game.cover_art_url ? (
                        <img
                          src={item.display?.cover_art_url || item.game.cover_art_url || undefined}
                          alt={item.display?.name || item.game.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-ctp-surface0 rounded flex items-center justify-center">
                          <span className="text-ctp-overlay1 text-xs">No image</span>
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-medium">{item.display?.name || item.game.name}</h3>
                        <p className="text-sm text-ctp-overlay1">
                          {item.source === "exact" ? "Exact match" : "Selected"}
                        </p>
                      </div>
                      <div className="text-ctp-green">
                        <svg
                          className="w-6 h-6"
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
              </div>
            )}

            {results.needsReview.length > 0 && (
              <div className="card">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-bold text-ctp-yellow">
                      Select the games from the list below
                    </h2>
                    <p className="text-sm text-ctp-overlay1 mt-2">
                      Choose the correct match for each entry. You can import multiple games at
                      once.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsSelectionModalOpen(true)}
                    className="btn btn-secondary text-sm px-3 py-1"
                  >
                    Review selections
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {results && results.needsReview.length > 0 && isSelectionModalOpen && (
        <div className="fixed inset-0 bg-ctp-base/80 flex items-center justify-center z-50 p-4">
          <div className="bg-ctp-mantle border border-ctp-surface1 rounded-lg p-6 max-w-3xl w-full max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-ctp-text">
                  Select games ({selectedCandidates.length} selected)
                </h2>
                <p className="text-sm text-ctp-subtext0 mt-2">
                  Select each match and import in bulk when ready.
                </p>
              </div>
              <button
                onClick={() => setIsSelectionModalOpen(false)}
                className="text-ctp-subtext0 hover:text-ctp-text"
              >
                Close
              </button>
            </div>

            <ScrollFade axis="y" className="flex-1 overflow-y-auto space-y-2 pr-2">
              {results.needsReview.some((item) => item.error) && (
                <div className="p-3 bg-ctp-red/10 border border-ctp-red/30 rounded text-sm text-ctp-red">
                  Some items failed to search. You can retry those imports later.
                </div>
              )}
              {getSelectionList(results.needsReview).length === 0 ? (
                <div className="text-sm text-ctp-subtext0 text-center py-6">
                  No matches found for the imported names.
                </div>
              ) : (
                getSelectionList(results.needsReview).map(({ candidate, searchTerm }) => {
                  const isSelected = selectedCandidates.includes(candidate.id);
                  return (
                    <div
                      key={`${searchTerm}-${candidate.id}`}
                      className={`flex items-center gap-3 p-3 rounded border transition-colors ${
                        isSelected
                          ? "border-ctp-mauve bg-ctp-mauve/10"
                          : "border-ctp-surface1 bg-ctp-surface0/60 hover:bg-ctp-surface1"
                      }`}
                    >
                      <Checkbox
                        id={`import-select-${candidate.id}`}
                        checked={isSelected}
                        onChange={() => toggleCandidateSelection(candidate.id)}
                        disabled={bulkSelectMutation.isPending || selectMutation.isPending}
                      />
                      {candidate.background_image ? (
                        <img
                          src={candidate.background_image}
                          alt={candidate.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-ctp-surface0 rounded flex items-center justify-center text-ctp-overlay1 text-xs">
                          No image
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{candidate.name}</p>
                        <div className="text-xs text-ctp-overlay1 flex items-center gap-2">
                          {candidate.released && <span>{candidate.released}</span>}
                          <span className="text-ctp-subtext0">From: {searchTerm}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
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
                        className="btn btn-primary text-sm px-3 py-1"
                      >
                        {selectMutation.isPending && activeSelectionId === candidate.id
                          ? "Importing..."
                          : "Select"}
                      </button>
                    </div>
                  );
                })
              )}
            </ScrollFade>

            <div className="flex items-center justify-between gap-3 mt-6">
              <div className="text-sm text-ctp-subtext0">{selectedCandidates.length} selected</div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedCandidates([])}
                  disabled={selectedCandidates.length === 0}
                  className="btn btn-secondary"
                >
                  Clear selection
                </button>
                <button
                  onClick={handleImportSelected}
                  disabled={
                    selectedCandidates.length === 0 ||
                    !selectedPlatform ||
                    bulkSelectMutation.isPending ||
                    selectMutation.isPending
                  }
                  className="btn btn-primary"
                >
                  {bulkSelectMutation.isPending
                    ? "Importing..."
                    : `Import selected (${selectedCandidates.length})`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
