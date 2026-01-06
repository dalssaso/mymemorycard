import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "@tanstack/react-router";
import { BackButton, PageLayout } from "@/components/layout";
import { FranchiseDetailSidebar } from "@/components/sidebar";
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
} from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { franchisesAPI, type OwnedGame, type MissingGame } from "@/lib/api";
import { useUserPlatforms } from "@/hooks/useUserPlatforms";

const STATUS_COLORS: Record<string, string> = {
  backlog: "bg-ctp-overlay0",
  playing: "bg-ctp-teal",
  finished: "bg-ctp-green",
  completed: "bg-ctp-mauve",
  dropped: "bg-ctp-red",
};

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

  const { data: platformsData } = useUserPlatforms();

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
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-ctp-subtext0">Loading...</div>
        </div>
      </PageLayout>
    );
  }

  if (!data) {
    return (
      <PageLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
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
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/franchises"
            className="mb-4 hidden text-ctp-teal transition-colors hover:text-ctp-mauve md:inline-block"
          >
            Back to Franchises
          </Link>
          <div className="mb-2 flex items-center gap-3">
            <BackButton
              iconOnly={true}
              className="rounded-lg p-2 text-ctp-subtext0 transition-all hover:bg-ctp-surface0 hover:text-ctp-text md:hidden"
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
          <h2 id="owned-games" className="mb-4 text-2xl font-bold text-ctp-teal">
            Your Games
          </h2>
          {owned_games.length === 0 ? (
            <Card>
              <p className="py-8 text-center text-ctp-subtext0">
                No games owned in this franchise.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
              {owned_games.map((game: OwnedGame) => (
                <Link key={game.id} to="/library/$id" params={{ id: game.id }} className="group">
                  <div className="relative mb-2 aspect-[3/4] overflow-hidden rounded-lg bg-ctp-surface0">
                    {game.cover_art_url ? (
                      <img
                        src={game.cover_art_url}
                        alt={game.name}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-ctp-overlay1">
                        No Cover
                      </div>
                    )}
                    <div
                      className={`absolute right-2 top-2 h-3 w-3 rounded-full ${STATUS_COLORS[game.status] || "bg-ctp-overlay0"}`}
                      title={game.status.charAt(0).toUpperCase() + game.status.slice(1)}
                    />
                  </div>
                  <p className="mb-1 truncate text-sm text-ctp-subtext1 group-hover:text-ctp-text">
                    {game.name}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-ctp-overlay1">
                    {game.release_date && <span>{new Date(game.release_date).getFullYear()}</span>}
                    {game.platforms.length > 0 && (
                      <>
                        <span className="text-ctp-overlay1">·</span>
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
            <div className="mb-4 flex items-center justify-between">
              <h2 id="missing-games" className="text-2xl font-bold text-ctp-mauve">
                Missing from Your Library
              </h2>
              <div className="flex items-center gap-2">
                {selectionMode ? (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleSelectAll}
                      className="bg-ctp-surface1 text-ctp-text hover:bg-ctp-overlay0"
                    >
                      {selectedGames.size === missing_games.length ? "Deselect All" : "Select All"}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleExitSelectionMode}
                      className="bg-ctp-surface1 text-ctp-text hover:bg-ctp-overlay0"
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline-mauve"
                    size="sm"
                    onClick={() => setSelectionMode(true)}
                  >
                    Select Games
                  </Button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
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
                      className={`relative mb-2 aspect-[3/4] overflow-hidden rounded-lg border bg-ctp-surface0 transition-colors ${
                        isSelected
                          ? "bg-ctp-mauve/20 border-ctp-mauve"
                          : "border-dashed border-ctp-surface1 hover:border-ctp-mauve"
                      }`}
                    >
                      {game.background_image ? (
                        <img
                          src={game.background_image}
                          alt={game.name}
                          className={`h-full w-full object-cover transition-all ${
                            selectionMode && isSelected
                              ? "opacity-100 grayscale-0"
                              : "opacity-60 grayscale group-hover:opacity-100 group-hover:grayscale-0"
                          }`}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-ctp-overlay1">
                          No Image
                        </div>
                      )}
                      {selectionMode ? (
                        isSelected && (
                          <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-ctp-mauve">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={3}
                              stroke="currentColor"
                              className="h-4 w-4 text-ctp-text"
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
                        <div className="bg-ctp-base/50 absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                          <span className="text-sm font-medium text-ctp-text">
                            + Add to Library
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="mb-1 truncate text-sm text-ctp-subtext0 group-hover:text-ctp-subtext1">
                      {game.name}
                    </p>
                    {game.released && (
                      <p className="text-xs text-ctp-overlay1">
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
          <div className="fixed bottom-20 left-1/2 z-40 flex -translate-x-1/2 items-center gap-4 rounded-xl border border-ctp-surface1 bg-ctp-mantle px-6 py-4 shadow-xl md:bottom-6">
            <span className="font-medium text-ctp-text">
              {selectedGames.size} game{selectedGames.size !== 1 ? "s" : ""} selected
            </span>
            <div className="h-6 w-px bg-ctp-surface1" />
            <div className="flex items-center gap-2">
              <span className="text-sm text-ctp-subtext0">Import to:</span>
              <Button
                variant="secondary"
                onClick={openBulkImportModal}
                disabled={bulkImportMutation.isPending}
                className="bg-ctp-mauve/20 hover:bg-ctp-mauve/30 border border-ctp-mauve px-3 py-1 text-sm text-ctp-mauve shadow-none focus:ring-ctp-mauve"
              >
                Choose platforms
              </Button>
            </div>
          </div>
        )}

        {/* Platform Selection Modal */}
        <Dialog
          open={Boolean(selectedGame)}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedGame(null);
            }
          }}
        >
          <DialogContent className="max-w-md border-ctp-surface1 bg-ctp-mantle">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-ctp-text">
                {isBulkImport ? "Bulk Import" : "Add to Library"}
              </DialogTitle>
              <DialogDescription className="text-ctp-subtext0">
                {isBulkImport
                  ? `Import ${selectedGames.size} selected game${selectedGames.size !== 1 ? "s" : ""}`
                  : selectedGame?.name}
              </DialogDescription>
            </DialogHeader>
            <p className="text-sm text-ctp-overlay1">Select platform(s):</p>
            <ScrollFade axis="y" className="grid max-h-64 grid-cols-1 gap-2 overflow-y-auto">
              {platforms.map((platform) => {
                const isSelected = selectedPlatformIds.has(platform.id);
                return (
                  <label
                    key={platform.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors ${
                      isSelected
                        ? "bg-ctp-mauve/20 border-ctp-mauve text-ctp-mauve"
                        : "hover:border-ctp-mauve/60 border-ctp-surface1 bg-ctp-surface0 text-ctp-subtext1"
                    }`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => togglePlatformSelection(platform.id)}
                      disabled={importMutation.isPending || bulkImportMutation.isPending}
                    />
                    <span>{platform.display_name}</span>
                  </label>
                );
              })}
            </ScrollFade>
            <DialogFooter className="mt-2 flex flex-col gap-2 sm:flex-row">
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
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  );
}
