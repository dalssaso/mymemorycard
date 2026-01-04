import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "@tanstack/react-router";
import { BackButton, PageLayout } from "@/components/layout";
import { FranchiseDetailSidebar } from "@/components/sidebar";
import { Button, Card, Checkbox, ScrollFade, useToast } from "@/components/ui";
import { franchisesAPI, userPlatformsAPI, type OwnedGame, type MissingGame } from "@/lib/api";

const STATUS_COLORS: Record<string, string> = {
  backlog: "bg-gray-600",
  playing: "bg-ctp-teal",
  finished: "bg-ctp-green",
  completed: "bg-ctp-mauve",
  dropped: "bg-ctp-red",
};

interface UserPlatform {
  id: string;
  platform_id: string;
  name: string;
  display_name: string;
  platform_type: string | null;
}

export function FranchiseDetail() {
  const { seriesName } = useParams({ from: "/franchises/$seriesName" });
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [selectedGame, setSelectedGame] = useState<MissingGame | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedGames, setSelectedGames] = useState<Set<number>>(new Set());
  const [selectedPlatformIds, setSelectedPlatformIds] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ["franchise", seriesName],
    queryFn: async () => {
      const response = await franchisesAPI.getOne(seriesName);
      return response.data;
    },
  });

  const { data: platformsData } = useQuery({
    queryKey: ["user-platforms"],
    queryFn: async () => {
      const response = await userPlatformsAPI.getAll();
      return response.data as { platforms: UserPlatform[] };
    },
  });

  const importMutation = useMutation({
    mutationFn: async ({
      rawgId,
      platformIds,
      franchiseSeriesName,
    }: {
      rawgId: number;
      platformIds: string[];
      gameName: string;
      franchiseSeriesName: string;
    }) => {
      const results = await Promise.allSettled(
        platformIds.map((platformId) =>
          franchisesAPI.importGame(rawgId, platformId, franchiseSeriesName)
        )
      );
      const succeeded = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;
      return { succeeded, failed };
    },
    onSuccess: async (result, variables) => {
      if (result.failed > 0) {
        showToast(`Imported ${result.succeeded} item(s), ${result.failed} failed`, "warning");
      } else {
        showToast(`Added ${variables.gameName} to ${result.succeeded} platform(s)`, "success");
      }
      await queryClient.refetchQueries({ queryKey: ["franchise", seriesName] });
      queryClient.invalidateQueries({ queryKey: ["games"] });
    },
    onError: () => {
      showToast("Failed to import game", "error");
    },
  });

  const bulkImportMutation = useMutation({
    mutationFn: async ({
      rawgIds,
      platformIds,
      franchiseSeriesName,
    }: {
      rawgIds: number[];
      platformIds: string[];
      franchiseSeriesName: string;
    }) => {
      const results = await Promise.allSettled(
        rawgIds.flatMap((rawgId) =>
          platformIds.map((platformId) =>
            franchisesAPI.importGame(rawgId, platformId, franchiseSeriesName)
          )
        )
      );
      const succeeded = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;
      return { succeeded, failed };
    },
    onSuccess: async (result) => {
      if (result.failed > 0) {
        showToast(`Imported ${result.succeeded} game(s), ${result.failed} failed`, "warning");
      } else {
        showToast(`Imported ${result.succeeded} game(s) to your library`, "success");
      }
      setSelectionMode(false);
      setSelectedGames(new Set());
      await queryClient.refetchQueries({ queryKey: ["franchise", seriesName] });
      queryClient.invalidateQueries({ queryKey: ["games"] });
    },
    onError: () => {
      showToast("Failed to import games", "error");
    },
  });

  const handleImportClick = (game: MissingGame) => {
    setSelectedGame(game);
    setSelectedPlatformIds(new Set());
  };

  const openBulkImportModal = () => {
    setSelectedGame({
      rawgId: -1,
      id: -1,
      name: "Bulk Import",
      slug: "",
      released: null,
      background_image: null,
    });
    setSelectedPlatformIds(new Set());
  };

  const toggleGameSelection = (rawgId: number) => {
    setSelectedGames((prev) => {
      const next = new Set(prev);
      if (next.has(rawgId)) {
        next.delete(rawgId);
      } else {
        next.add(rawgId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (!data) return;
    if (selectedGames.size === data.missing_games.length) {
      setSelectedGames(new Set());
    } else {
      setSelectedGames(new Set(data.missing_games.map((g) => g.rawgId)));
    }
  };

  const handleExitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedGames(new Set());
    setSelectedPlatformIds(new Set());
  };

  const togglePlatformSelection = (platformId: string) => {
    setSelectedPlatformIds((prev) => {
      const next = new Set(prev);
      if (next.has(platformId)) {
        next.delete(platformId);
      } else {
        next.add(platformId);
      }
      return next;
    });
  };

  const handleConfirmImport = async () => {
    if (!data || selectedPlatformIds.size === 0 || !selectedGame) return;
    const platformIds = Array.from(selectedPlatformIds);
    if (selectedGame.rawgId === -1) {
      if (selectedGames.size === 0) return;
      try {
        await bulkImportMutation.mutateAsync({
          rawgIds: Array.from(selectedGames),
          platformIds,
          franchiseSeriesName: data.series_name,
        });
        setSelectedGame(null);
        setSelectedPlatformIds(new Set());
      } catch {
        return;
      }
      return;
    }
    try {
      await importMutation.mutateAsync({
        rawgId: selectedGame.rawgId,
        platformIds,
        gameName: selectedGame.name,
        franchiseSeriesName: data.series_name,
      });
      setSelectedGame(null);
      setSelectedPlatformIds(new Set());
    } catch {
      return;
    }
  };

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
          <div className="text-ctp-red">Franchise not found</div>
        </div>
      </PageLayout>
    );
  }

  const { series_name, owned_games, missing_games } = data;
  const platforms = (platformsData?.platforms || []).map((platform) => ({
    id: platform.platform_id,
    name: platform.name,
    display_name: platform.display_name,
    platform_type: platform.platform_type,
  }));
  const isBulkImport = selectedGame?.rawgId === -1;

  return (
    <PageLayout
      sidebar={
        <FranchiseDetailSidebar
          seriesName={series_name}
          ownedCount={owned_games.length}
          missingCount={missing_games.length}
        />
      }
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/franchises"
            className="hidden md:inline-block text-ctp-teal hover:text-ctp-mauve transition-colors mb-4"
          >
            Back to Franchises
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <BackButton
              iconOnly={true}
              className="md:hidden p-2 rounded-lg text-ctp-subtext0 hover:bg-ctp-surface0 hover:text-ctp-text transition-all"
            />
            <h1 className="text-4xl font-bold text-ctp-text">{series_name}</h1>
          </div>
          <p className="text-ctp-subtext0">
            {owned_games.length} owned
            {missing_games.length > 0 && ` · ${missing_games.length} missing`}
          </p>
        </div>

        {/* Owned Games */}
        <div className="mb-10">
          <h2 id="owned-games" className="text-2xl font-bold text-ctp-teal mb-4">
            Your Games
          </h2>
          {owned_games.length === 0 ? (
            <Card>
              <p className="text-ctp-subtext0 text-center py-8">
                No games owned in this franchise.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {owned_games.map((game: OwnedGame) => (
                <Link key={game.id} to="/library/$id" params={{ id: game.id }} className="group">
                  <div className="aspect-[3/4] rounded-lg overflow-hidden bg-ctp-surface0 mb-2 relative">
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
                    <div
                      className={`absolute top-2 right-2 w-3 h-3 rounded-full ${STATUS_COLORS[game.status] || "bg-gray-600"}`}
                      title={game.status.charAt(0).toUpperCase() + game.status.slice(1)}
                    />
                  </div>
                  <p className="text-sm text-ctp-subtext1 truncate group-hover:text-ctp-text mb-1">
                    {game.name}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-ctp-overlay1">
                    {game.release_date && <span>{new Date(game.release_date).getFullYear()}</span>}
                    {game.platforms.length > 0 && (
                      <>
                        <span className="text-gray-600">·</span>
                        <span>{game.platforms.join(", ")}</span>
                      </>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Missing Games */}
        {missing_games.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 id="missing-games" className="text-2xl font-bold text-ctp-mauve">
                Missing from Your Library
              </h2>
              <div className="flex items-center gap-2">
                {selectionMode ? (
                  <>
                    <button
                      onClick={handleSelectAll}
                      className="px-3 py-1.5 bg-ctp-surface1 hover:bg-gray-600 text-ctp-text rounded text-sm transition-all"
                    >
                      {selectedGames.size === missing_games.length ? "Deselect All" : "Select All"}
                    </button>
                    <button
                      onClick={handleExitSelectionMode}
                      className="px-3 py-1.5 bg-ctp-surface1 hover:bg-gray-600 text-ctp-text rounded text-sm transition-all"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setSelectionMode(true)}
                    className="px-3 py-1.5 bg-ctp-mauve/20 border border-ctp-mauve/30 text-ctp-mauve hover:bg-ctp-mauve/30 rounded text-sm transition-all"
                  >
                    Select Games
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {missing_games.map((game: MissingGame) => {
                const isSelected = selectedGames.has(game.rawgId);
                return (
                  <div
                    key={game.rawgId}
                    className="group cursor-pointer"
                    onClick={() =>
                      selectionMode ? toggleGameSelection(game.rawgId) : handleImportClick(game)
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        if (selectionMode) {
                          toggleGameSelection(game.rawgId);
                        } else {
                          handleImportClick(game);
                        }
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
                      {game.background_image ? (
                        <img
                          src={game.background_image}
                          alt={game.name}
                          className={`w-full h-full object-cover transition-all ${
                            selectionMode && isSelected
                              ? "opacity-100 grayscale-0"
                              : "opacity-60 group-hover:opacity-100 grayscale group-hover:grayscale-0"
                          }`}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600">
                          No Image
                        </div>
                      )}
                      {selectionMode ? (
                        isSelected && (
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
                        )
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-ctp-base/50">
                          <span className="text-ctp-text text-sm font-medium">
                            + Add to Library
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-ctp-subtext0 truncate group-hover:text-ctp-subtext1 mb-1">
                      {game.name}
                    </p>
                    {game.released && (
                      <p className="text-xs text-gray-600">
                        {new Date(game.released).getFullYear()}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Bulk Import Floating Action Bar */}
        {selectionMode && selectedGames.size > 0 && (
          <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 bg-ctp-mantle border border-ctp-surface1 rounded-xl px-6 py-4 shadow-xl z-40 flex items-center gap-4">
            <span className="text-ctp-text font-medium">
              {selectedGames.size} game{selectedGames.size !== 1 ? "s" : ""} selected
            </span>
            <div className="h-6 w-px bg-ctp-surface1" />
            <div className="flex items-center gap-2">
              <span className="text-ctp-subtext0 text-sm">Import to:</span>
              <Button
                variant="secondary"
                onClick={openBulkImportModal}
                disabled={bulkImportMutation.isPending}
                className="text-sm py-1 px-3 border border-ctp-mauve bg-ctp-mauve/20 text-ctp-mauve hover:bg-ctp-mauve/30 focus:ring-ctp-mauve shadow-none"
              >
                Choose platforms
              </Button>
            </div>
          </div>
        )}

        {/* Platform Selection Modal */}
        {selectedGame && (
          <div className="fixed inset-0 bg-ctp-base/70 flex items-start md:items-center justify-center z-[60] overflow-y-auto px-4 py-6 pb-24 md:pb-6 scroll-container scrollbar-custom">
            <button
              type="button"
              aria-label="Close platform selection"
              className="absolute inset-0"
              onClick={() => setSelectedGame(null)}
            />
            <div className="relative bg-ctp-mantle rounded-xl p-6 max-w-md w-full border border-ctp-surface1">
              <h3 className="text-xl font-bold text-ctp-text mb-2">
                {isBulkImport ? "Bulk Import" : "Add to Library"}
              </h3>
              <p className="text-ctp-subtext0 mb-4">
                {isBulkImport
                  ? `Import ${selectedGames.size} selected game${selectedGames.size !== 1 ? "s" : ""}`
                  : selectedGame.name}
              </p>
              <p className="text-sm text-ctp-overlay1 mb-4">Select platform(s):</p>
              <ScrollFade axis="y" className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                {platforms.map((platform) => {
                  const isSelected = selectedPlatformIds.has(platform.id);
                  return (
                    <label
                      key={platform.id}
                      className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm cursor-pointer transition-colors ${
                        isSelected
                          ? "border-ctp-mauve bg-ctp-mauve/20 text-ctp-mauve"
                          : "border-ctp-surface1 bg-ctp-surface0 text-ctp-subtext1 hover:border-ctp-mauve/60"
                      }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onChange={() => togglePlatformSelection(platform.id)}
                        disabled={importMutation.isPending || bulkImportMutation.isPending}
                      />
                      <span>{platform.display_name}</span>
                    </label>
                  );
                })}
              </ScrollFade>
              <div className="flex items-center gap-2 mt-4">
                <Button
                  onClick={handleConfirmImport}
                  disabled={
                    selectedPlatformIds.size === 0 ||
                    importMutation.isPending ||
                    bulkImportMutation.isPending
                  }
                  className="flex-1"
                >
                  Import
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSelectedGame(null);
                    setSelectedPlatformIds(new Set());
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
