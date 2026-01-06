import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { completionLogsAPI, gamesAPI, sessionsAPI } from "@/lib/api";
import { BackButton, PageLayout } from "@/components/layout";
import { GameDetailSidebar } from "@/components/sidebar";
import { useToast } from "@/components/ui/Toast";
import { Button, Input, Textarea } from "@/components/ui";
import { GameAchievements } from "@/components/GameAchievements";
import { PlatformIconBadge } from "@/components/PlatformIcon";
import { StartSessionButton } from "@/components/StartSessionButton";
import { ProgressDisplay } from "@/components/ProgressDisplay";
import { SessionsHistory } from "@/components/SessionsHistory";
import { ProgressHistory } from "@/components/ProgressHistory";
import { EditionOwnership } from "@/components/EditionOwnership";
import { EditionSwitcher } from "@/components/EditionSwitcher";
import { FranchisePreview } from "@/components/FranchisePreview";
import { RawgIdCorrection } from "@/components/RawgIdCorrection";
import { useUserPlatforms } from "@/hooks/useUserPlatforms";
import { STATUS_CONFIGS } from "@/lib/constants/status";

interface GameDetails {
  id: string;
  rawg_id: number | null;
  name: string;
  slug: string | null;
  release_date: string | null;
  description: string | null;
  cover_art_url: string | null;
  background_image_url: string | null;
  metacritic_score: number | null;
  esrb_rating: string | null;
  platform_id: string;
  platform_name: string;
  platform_display_name: string;
  platform_color_primary: string;
  platform_icon_url: string | null;
  status: string | null;
  user_rating: number | null;
  notes: string | null;
  total_minutes: number;
  last_played: string | null;
  is_favorite: boolean;
  series_name: string | null;
  expected_playtime: number | null;
}

interface GamesQueryItem {
  id: string;
  status?: string;
  is_favorite?: boolean;
  is_favorite_any?: boolean;
  platforms?: Array<{ id?: string; platform_id?: string }>;
}

interface GamesQueryData {
  games: GamesQueryItem[];
}

function normalizeGameName(name: string): string {
  const editionPatterns = [
    /\s*[-–—:]\s*(game of the year|goty|deluxe|ultimate|complete|definitive|enhanced|remastered|remake|hd|4k|anniversary|collector'?s?|gold|platinum|standard|special|limited|legacy|royal|premium)\s*(edition|version)?$/i,
    /\s*\((game of the year|goty|deluxe|ultimate|complete|definitive|enhanced|remastered|remake|hd|4k|anniversary|collector'?s?|gold|platinum|standard|special|limited|legacy|royal|premium)\s*(edition|version)?\)$/i,
    /\s*(remastered|remake|hd collection|collection)$/i,
    /\s*[-–—]\s*\d{4}\s*(edition|remaster)?$/i,
  ];

  let normalized = name;
  for (const pattern of editionPatterns) {
    normalized = normalized.replace(pattern, "");
  }
  return normalized.trim();
}

export function GameDetail() {
  const { id } = useParams({ from: "/library/$id" });
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState("");
  const [selectedPlatformId, setSelectedPlatformId] = useState<string | null>(null);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPlaytimeInput, setShowPlaytimeInput] = useState(false);
  const [playtimeHours, setPlaytimeHours] = useState("");
  const [playtimeMinutes, setPlaytimeMinutes] = useState("");
  const statusMenuRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ["game", id],
    queryFn: async () => {
      const response = await gamesAPI.getOne(id);
      return response.data as {
        game: GameDetails;
        platforms: GameDetails[];
        genres: string[];
      };
    },
  });

  const { data: userPlatformsData } = useUserPlatforms();

  const mutationPlatformId = selectedPlatformId || data?.game?.platform_id || "";

  useEffect(() => {
    if (!location.hash) return;
    const targetId = location.hash.replace("#", "");

    const scrollToTarget = () => {
      const element = document.getElementById(targetId);
      if (!element) return false;
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      element.focus({ preventScroll: true });
      return true;
    };

    if (scrollToTarget()) return;

    let attempts = 0;
    const maxAttempts = 15;
    const interval = window.setInterval(() => {
      attempts += 1;
      if (scrollToTarget() || attempts >= maxAttempts) {
        window.clearInterval(interval);
      }
    }, 100);

    return () => window.clearInterval(interval);
  }, [location.hash, data?.game?.id, data?.game?.platform_id, selectedPlatformId]);

  useEffect(() => {
    if (!isStatusOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (!statusMenuRef.current) return;
      if (!statusMenuRef.current.contains(event.target as Node)) {
        setIsStatusOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsStatusOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isStatusOpen]);

  const updateStatusMutation = useMutation({
    mutationFn: ({ platformId, status }: { platformId: string; status: string }) =>
      gamesAPI.updateStatus(id, platformId, status),
    onMutate: async ({ platformId, status }) => {
      await queryClient.cancelQueries({ queryKey: ["game", id] });
      await queryClient.cancelQueries({ queryKey: ["games"] });

      const previousGame = queryClient.getQueryData<{
        game: GameDetails;
        platforms: GameDetails[];
        genres: string[];
      }>(["game", id]);
      const previousGames = queryClient.getQueriesData<GamesQueryData>({
        queryKey: ["games"],
      });

      if (previousGame) {
        queryClient.setQueryData(["game", id], {
          ...previousGame,
          game:
            previousGame.game.platform_id === platformId
              ? { ...previousGame.game, status }
              : previousGame.game,
          platforms: previousGame.platforms.map((platform) =>
            platform.platform_id === platformId ? { ...platform, status } : platform
          ),
        });
      }

      queryClient.setQueriesData<GamesQueryData>({ queryKey: ["games"] }, (oldData) => {
        if (!oldData?.games) return oldData;
        return {
          ...oldData,
          games: oldData.games.map((game) => (game.id === id ? { ...game, status } : game)),
        };
      });

      return { previousGame, previousGames };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game", id] });
      queryClient.invalidateQueries({ queryKey: ["games"] });
      showToast("Status updated successfully", "success");
    },
    onError: (_error, _variables, context) => {
      if (context?.previousGame) {
        queryClient.setQueryData(["game", id], context.previousGame);
      }
      context?.previousGames?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      showToast("Failed to update status", "error");
    },
  });

  const updateRatingMutation = useMutation({
    mutationFn: ({ platformId, rating }: { platformId: string; rating: number }) =>
      gamesAPI.updateRating(id, platformId, rating),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game", id] });
      queryClient.invalidateQueries({ queryKey: ["games"] });
      showToast("Rating updated successfully", "success");
    },
    onError: () => {
      showToast("Failed to update rating", "error");
    },
  });

  const updateNotesMutation = useMutation({
    mutationFn: ({ platformId, notes }: { platformId: string; notes: string }) =>
      gamesAPI.updateNotes(id, platformId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game", id] });
      setIsEditingNotes(false);
      showToast("Notes saved successfully", "success");
    },
    onError: () => {
      showToast("Failed to save notes", "error");
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: ({ platformId, isFavorite }: { platformId: string; isFavorite: boolean }) =>
      gamesAPI.toggleFavorite(id, platformId, isFavorite),
    onMutate: async ({ platformId, isFavorite }) => {
      await queryClient.cancelQueries({ queryKey: ["game", id] });
      await queryClient.cancelQueries({ queryKey: ["games"] });

      const previousGame = queryClient.getQueryData<{
        game: GameDetails;
        platforms: GameDetails[];
        genres: string[];
      }>(["game", id]);
      const previousGames = queryClient.getQueriesData<GamesQueryData>({
        queryKey: ["games"],
      });

      if (previousGame) {
        queryClient.setQueryData(["game", id], {
          ...previousGame,
          game:
            previousGame.game.platform_id === platformId
              ? { ...previousGame.game, is_favorite: isFavorite }
              : previousGame.game,
          platforms: previousGame.platforms.map((platform) =>
            platform.platform_id === platformId
              ? { ...platform, is_favorite: isFavorite }
              : platform
          ),
        });
      }

      queryClient.setQueriesData<GamesQueryData>({ queryKey: ["games"] }, (oldData) => {
        if (!oldData?.games) return oldData;
        return {
          ...oldData,
          games: oldData.games.map((game) =>
            game.id === id
              ? {
                  ...game,
                  is_favorite_any:
                    typeof game.is_favorite_any === "boolean" ? isFavorite : game.is_favorite_any,
                  is_favorite:
                    typeof game.is_favorite === "boolean" ? isFavorite : game.is_favorite,
                }
              : game
          ),
        };
      });

      return { previousGame, previousGames };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["game", id] });
      queryClient.invalidateQueries({ queryKey: ["games"] });
      showToast(variables.isFavorite ? "Added to favorites" : "Removed from favorites", "success");
    },
    onError: (_error, _variables, context) => {
      if (context?.previousGame) {
        queryClient.setQueryData(["game", id], context.previousGame);
      }
      context?.previousGames?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      showToast("Failed to update favorite status", "error");
    },
  });

  const deleteGameMutation = useMutation({
    mutationFn: ({ platformId }: { platformId: string }) => gamesAPI.delete(id, platformId),
    onMutate: async ({ platformId }) => {
      await queryClient.cancelQueries({ queryKey: ["game", id] });
      await queryClient.cancelQueries({ queryKey: ["games"] });

      const previousGame = queryClient.getQueryData<{
        game: GameDetails;
        platforms: GameDetails[];
        genres: string[];
      }>(["game", id]);
      const previousGames = queryClient.getQueriesData<GamesQueryData>({
        queryKey: ["games"],
      });

      if (previousGame) {
        const remainingPlatforms = previousGame.platforms.filter(
          (platform) => platform.platform_id !== platformId
        );
        queryClient.setQueryData(["game", id], {
          ...previousGame,
          platforms: remainingPlatforms,
          game:
            previousGame.game.platform_id === platformId && remainingPlatforms.length > 0
              ? remainingPlatforms[0]
              : previousGame.game,
        });
      }

      queryClient.setQueriesData<GamesQueryData>({ queryKey: ["games"] }, (oldData) => {
        if (!oldData?.games) return oldData;
        return {
          ...oldData,
          games: oldData.games
            .map((game) => {
              if (game.id !== id) return game;
              if (Array.isArray(game.platforms)) {
                const remaining = game.platforms.filter(
                  (platform) => platform.id !== platformId && platform.platform_id !== platformId
                );
                if (remaining.length === 0) {
                  return null;
                }
                return { ...game, platforms: remaining };
              }
              return game;
            })
            .filter((game): game is GamesQueryItem => Boolean(game)),
        };
      });

      return { previousGame, previousGames };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["games"] });
      queryClient.invalidateQueries({ queryKey: ["game", id] });
      showToast("Game removed from library", "success");

      const remainingPlatforms = platforms.filter((p) => p.platform_id !== variables.platformId);
      if (remainingPlatforms.length === 0) {
        navigate({ to: "/library" });
      } else {
        setSelectedPlatformId(remainingPlatforms[0].platform_id);
      }
    },
    onError: (_error, _variables, context) => {
      if (context?.previousGame) {
        queryClient.setQueryData(["game", id], context.previousGame);
      }
      context?.previousGames?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      showToast("Failed to remove game", "error");
    },
  });

  const addToPlatformMutation = useMutation({
    mutationFn: ({ platformId }: { platformId: string }) => gamesAPI.addToPlatform(id, platformId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["game", id] });
      queryClient.invalidateQueries({ queryKey: ["games"] });
      // Auto-switch to the newly added platform
      setSelectedPlatformId(variables.platformId);
      const userPlatforms = userPlatformsData?.platforms || [];
      const platform = userPlatforms.find((p) => p.platform_id === variables.platformId);
      showToast(platform ? `Added to ${platform.display_name}` : "Added to platform", "success");
    },
    onError: () => {
      showToast("Failed to add game to platform", "error");
    },
  });

  const addPlaytimeMutation = useMutation({
    mutationFn: async () => {
      if (!mutationPlatformId) {
        throw new Error("Platform is required");
      }

      const parsedHours = playtimeHours.trim() ? Number(playtimeHours) : 0;
      const parsedMinutes = playtimeMinutes.trim() ? Number(playtimeMinutes) : 0;

      if (Number.isNaN(parsedHours) || Number.isNaN(parsedMinutes)) {
        throw new Error("Invalid playtime input");
      }

      if (parsedHours < 0 || parsedMinutes < 0 || parsedMinutes > 59) {
        throw new Error("Invalid playtime input");
      }

      const durationMinutes = parsedHours * 60 + parsedMinutes;
      if (durationMinutes <= 0) {
        throw new Error("Playtime must be greater than zero");
      }

      const startedAt = new Date();
      const endedAt = new Date(startedAt.getTime() + durationMinutes * 60000);

      await sessionsAPI.create(id, {
        platformId: mutationPlatformId,
        startedAt: startedAt.toISOString(),
        endedAt: endedAt.toISOString(),
        durationMinutes,
      });

      const cachedProgress = queryClient.getQueryData([
        "completionLogs",
        id,
        mutationPlatformId,
      ]) as
        | {
            summary?: { main?: number };
            currentPercentage?: number;
          }
        | undefined;

      let currentMainPercentage = cachedProgress?.summary?.main;
      if (currentMainPercentage === undefined) {
        const response = await completionLogsAPI.getAll(id, {
          limit: 1,
          platform_id: mutationPlatformId,
        });
        const data = response.data as {
          currentPercentage: number;
          summary?: { main?: number };
        };
        currentMainPercentage = data.summary?.main ?? data.currentPercentage;
      }

      await completionLogsAPI.create(id, {
        platformId: mutationPlatformId,
        percentage: currentMainPercentage ?? 0,
        completionType: "main",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions", id] });
      queryClient.invalidateQueries({ queryKey: ["game", id] });
      queryClient.invalidateQueries({ queryKey: ["completionLogs", id] });
      if (mutationPlatformId) {
        queryClient.invalidateQueries({ queryKey: ["completionLogs", id, mutationPlatformId] });
      }
      queryClient.invalidateQueries({ queryKey: ["games"] });
      setPlaytimeHours("");
      setPlaytimeMinutes("");
      setShowPlaytimeInput(false);
      showToast("Playtime added", "success");
    },
    onError: () => {
      showToast("Failed to add playtime", "error");
    },
  });

  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-ctp-subtext0">Loading...</div>
        </div>
      </PageLayout>
    );
  }

  if (error || !data?.game) {
    return (
      <PageLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-ctp-red">Game not found</div>
        </div>
      </PageLayout>
    );
  }

  const game = data.game;
  const genres = data?.genres || [];
  const platforms = data?.platforms || [];
  const hasMultiplePlatforms = platforms.length > 1;

  const activePlatformId = selectedPlatformId || game.platform_id;
  const activePlatform = platforms.find((p) => p.platform_id === activePlatformId) || game;
  const activeStatus = activePlatform.status || "backlog";
  const activeStatusConfig = STATUS_CONFIGS[activeStatus] || STATUS_CONFIGS["backlog"];

  // Compute platforms user has in profile but doesn't own the game on
  const ownedPlatformIds = new Set(platforms.map((p) => p.platform_id));
  const availablePlatforms = (userPlatformsData?.platforms || []).filter(
    (p) => !ownedPlatformIds.has(p.platform_id)
  );

  const parsedPlaytimeHours = playtimeHours.trim() ? Number(playtimeHours) : 0;
  const parsedPlaytimeMinutes = playtimeMinutes.trim() ? Number(playtimeMinutes) : 0;
  const hasValidPlaytimeInput =
    !Number.isNaN(parsedPlaytimeHours) &&
    !Number.isNaN(parsedPlaytimeMinutes) &&
    parsedPlaytimeHours >= 0 &&
    parsedPlaytimeMinutes >= 0 &&
    parsedPlaytimeMinutes <= 59 &&
    (parsedPlaytimeHours > 0 || parsedPlaytimeMinutes > 0);

  const handleStatusChange = (status: string) => {
    updateStatusMutation.mutate({ platformId: activePlatformId, status });
  };

  const handleRatingChange = (rating: number) => {
    updateRatingMutation.mutate({ platformId: activePlatformId, rating });
  };

  const handleSaveNotes = () => {
    updateNotesMutation.mutate({ platformId: activePlatformId, notes: notesValue });
  };

  const handlePlatformChange = (platformId: string) => {
    if (platformId === activePlatformId) return;
    setSelectedPlatformId(platformId);
    const platform = platforms.find((item) => item.platform_id === platformId);
    showToast(
      platform ? `Now tracking on ${platform.platform_display_name}` : "Tracking platform updated",
      "success"
    );
  };

  const startEditingNotes = () => {
    setNotesValue(activePlatform.notes || "");
    setIsEditingNotes(true);
  };

  const sidebarContent = (
    <GameDetailSidebar
      gameId={game.id}
      platformId={activePlatformId}
      status={activePlatform.status}
      onStatusChange={handleStatusChange}
      isUpdating={updateStatusMutation.isPending}
    />
  );

  return (
    <PageLayout sidebar={sidebarContent} customCollapsed={true} showBackButton={false}>
      {/* Background Image Header - hidden on mobile to avoid overlap with cover */}
      {activePlatform.background_image_url && (
        <div className="relative -mx-4 -mt-4 mb-4 hidden h-48 w-full sm:-mx-6 sm:-mt-6 sm:mb-6 lg:mx-0 lg:block lg:h-72 xl:h-80">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${activePlatform.background_image_url})` }}
          />
          <div className="via-ctp-crust/50 absolute inset-0 bg-gradient-to-b from-transparent to-ctp-crust" />
        </div>
      )}

      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex items-center gap-3 md:hidden">
          <BackButton
            iconOnly={true}
            className="rounded-lg p-2 text-ctp-subtext0 transition-all hover:bg-ctp-surface0 hover:text-ctp-text"
          />
          <h1 className="text-3xl font-bold">{activePlatform.name}</h1>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {/* Cover Art */}
          <div className="lg:col-span-1">
            {activePlatform.cover_art_url ? (
              <img
                src={activePlatform.cover_art_url}
                alt={activePlatform.name}
                className="w-full rounded-lg shadow-lg"
              />
            ) : (
              <div className="flex aspect-[3/4] w-full items-center justify-center rounded-lg bg-ctp-surface0">
                <span className="text-ctp-overlay1">No cover art</span>
              </div>
            )}

            {/* Start Session Button */}
            <div className="mt-4">
              <StartSessionButton gameId={game.id} platformId={activePlatformId} />
            </div>

            {/* Platform Selector (for multi-platform games) */}
            {platforms.length > 0 && (
              <div className="mt-4">
                <span className="mb-2 block text-sm font-medium text-ctp-subtext0">
                  {platforms.length === 1 ? "Platform" : "Platforms"}
                </span>
                <div className="flex flex-wrap gap-2">
                  {platforms.map((platform) => {
                    const isActivePlatform = platform.platform_id === activePlatformId;
                    return (
                      <Button
                        key={platform.platform_id}
                        type="button"
                        onClick={() => handlePlatformChange(platform.platform_id)}
                        variant="ghost"
                        className={`flex h-auto items-center gap-2 rounded-lg border px-2 py-1.5 transition-all ${
                          isActivePlatform
                            ? "bg-ctp-teal/15 border-ctp-teal/50"
                            : "bg-ctp-mauve/10 border-ctp-mauve/30 hover:bg-ctp-mauve/20"
                        }`}
                      >
                        <PlatformIconBadge
                          platform={{
                            displayName: platform.platform_display_name,
                            iconUrl: platform.platform_icon_url,
                            colorPrimary: platform.platform_color_primary,
                          }}
                          size="md"
                        />
                        <span className="text-sm text-ctp-subtext1">
                          {platform.platform_display_name}
                        </span>
                        {isActivePlatform && (
                          <span
                            className="inline-flex items-center gap-1 text-xs text-ctp-teal"
                            title="Tracking progress on this platform"
                          >
                            <svg
                              className="h-3.5 w-3.5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              aria-hidden="true"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.704 5.29a1 1 0 0 1 0 1.42l-7.18 7.18a1 1 0 0 1-1.414 0l-3.594-3.594a1 1 0 0 1 1.414-1.414l2.887 2.887 6.473-6.473a1 1 0 0 1 1.414 0Z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span className="sr-only">Tracking progress on this platform</span>
                          </span>
                        )}
                      </Button>
                    );
                  })}
                </div>
                {hasMultiplePlatforms && (
                  <p className="mt-1 text-xs text-ctp-overlay1">
                    Stats and progress are tracked per platform
                  </p>
                )}

                {/* Add to Platform section */}
                {availablePlatforms.length > 0 && (
                  <div className="mt-3">
                    <span className="mb-2 block text-xs font-medium text-ctp-overlay1">
                      Add to Platform
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {availablePlatforms.map((platform) => (
                        <Button
                          key={platform.platform_id}
                          type="button"
                          onClick={() =>
                            addToPlatformMutation.mutate({ platformId: platform.platform_id })
                          }
                          disabled={addToPlatformMutation.isPending}
                          variant="ghost"
                          className="bg-ctp-surface0/50 hover:border-ctp-mauve/50 hover:bg-ctp-mauve/10 flex h-auto items-center gap-2 rounded-lg border border-dashed border-ctp-surface1 px-2 py-1.5 transition-all disabled:opacity-50"
                        >
                          <PlatformIconBadge
                            platform={{
                              displayName: platform.display_name,
                              iconUrl: platform.default_icon_url,
                              colorPrimary: platform.color_primary,
                            }}
                            size="md"
                          />
                          <span className="text-sm text-ctp-overlay1">{platform.display_name}</span>
                          <svg
                            className="h-3.5 w-3.5 text-ctp-overlay1"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 4.5v15m7.5-7.5h-15"
                            />
                          </svg>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Status Selector */}
            <div className="mt-4">
              <label
                htmlFor="game-status"
                className="mb-2 block text-sm font-medium text-ctp-subtext0"
              >
                Status
              </label>
              <div className="relative" ref={statusMenuRef}>
                <Button
                  id="game-status"
                  type="button"
                  aria-haspopup="listbox"
                  aria-expanded={isStatusOpen}
                  aria-describedby="status-description"
                  onClick={() => setIsStatusOpen((open) => !open)}
                  disabled={updateStatusMutation.isPending}
                  variant="ghost"
                  className="flex h-auto w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-ctp-text transition focus:border-ctp-mauve focus:outline-none disabled:opacity-60"
                  style={activeStatusConfig.activeStyle}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: `var(--${activeStatusConfig.color})` }}
                    />
                    <span className={`text-${activeStatusConfig.color}`}>
                      {activeStatusConfig.label}
                    </span>
                  </span>
                  <svg
                    className={`h-4 w-4 text-ctp-subtext0 transition-transform ${isStatusOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </Button>

                {isStatusOpen && (
                  <>
                    <Button
                      type="button"
                      aria-label="Close status menu"
                      variant="ghost"
                      className="fixed inset-0 z-40 h-auto w-auto bg-transparent p-0 hover:bg-transparent"
                      onClick={() => setIsStatusOpen(false)}
                    />
                    <div
                      className="absolute z-50 mt-2 w-full rounded-lg border border-ctp-surface1 bg-ctp-mantle p-2 shadow-lg"
                      role="listbox"
                      aria-labelledby="game-status"
                    >
                      <div className="grid gap-2">
                        {Object.values(STATUS_CONFIGS)
                          .filter((config) => config.id !== "total" && config.id !== "favorites")
                          .map((config) => (
                            <Button
                              key={config.id}
                              type="button"
                              role="option"
                              aria-selected={config.id === activeStatus}
                              onClick={() => {
                                setIsStatusOpen(false);
                                if (config.id !== activeStatus) {
                                  handleStatusChange(config.id);
                                }
                              }}
                              variant="ghost"
                              className={`flex h-auto w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left transition hover:brightness-110 ${
                                config.id === activeStatus ? "ring-1 ring-ctp-mauve" : ""
                              }`}
                              style={config.activeStyle}
                            >
                              <span className="flex items-center gap-2">
                                <span
                                  className="h-2.5 w-2.5 rounded-full"
                                  style={{ backgroundColor: `var(--${config.color})` }}
                                />
                                <span className={`text-${config.color}`}>{config.label}</span>
                              </span>
                              {config.id === activeStatus && (
                                <svg
                                  className="h-4 w-4 text-ctp-mauve"
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
                              )}
                            </Button>
                          ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
              <span id="status-description" className="sr-only">
                Track your progress with this game
              </span>
            </div>

            {/* Play Stats */}
            <div className="mt-4 grid grid-cols-1 gap-3">
              <div className="bg-ctp-teal/10 border-ctp-teal/30 rounded-lg border p-3">
                <div className="text-xs text-ctp-teal">Playtime</div>
                <div className="text-lg font-semibold text-ctp-text">
                  {Math.floor(activePlatform.total_minutes / 60)}h{" "}
                  {activePlatform.total_minutes % 60}m
                </div>
                <div className="mt-2">
                  {showPlaytimeInput ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <Input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          step={1}
                          placeholder="Hours"
                          value={playtimeHours}
                          onChange={(event) => setPlaytimeHours(event.target.value)}
                          className="border-ctp-surface1 bg-ctp-mantle text-sm focus:border-ctp-teal"
                          aria-label="Playtime hours"
                        />
                        <Input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          max={59}
                          step={1}
                          placeholder="Minutes"
                          value={playtimeMinutes}
                          onChange={(event) => setPlaytimeMinutes(event.target.value)}
                          className="border-ctp-surface1 bg-ctp-mantle text-sm focus:border-ctp-teal"
                          aria-label="Playtime minutes"
                        />
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                          type="button"
                          onClick={() => addPlaytimeMutation.mutate()}
                          disabled={addPlaytimeMutation.isPending || !hasValidPlaytimeInput}
                          className="hover:bg-ctp-teal/80 flex-1 bg-ctp-teal text-ctp-base"
                        >
                          {addPlaytimeMutation.isPending ? "Saving..." : "Add Playtime"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowPlaytimeInput(false);
                            setPlaytimeHours("");
                            setPlaytimeMinutes("");
                          }}
                          className="flex-1 border-ctp-surface1 text-ctp-subtext0 hover:bg-ctp-surface1 hover:text-ctp-text"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="link"
                      type="button"
                      onClick={() => setShowPlaytimeInput(true)}
                      className="h-auto p-0 text-xs text-ctp-teal hover:text-ctp-mauve"
                    >
                      Add playtime
                    </Button>
                  )}
                </div>
              </div>
              {activePlatform.last_played && (
                <div className="bg-ctp-mauve/10 border-ctp-mauve/30 rounded-lg border p-3">
                  <div className="text-xs text-ctp-mauve">Last Played</div>
                  <div className="text-sm font-semibold text-ctp-text">
                    {new Date(activePlatform.last_played).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>

            {/* Remove from Library */}
            <div className="mt-4">
              {showDeleteConfirm ? (
                <div className="bg-ctp-red/20 border-ctp-red/50 rounded-lg border p-4">
                  <p className="mb-3 text-sm text-ctp-subtext1">
                    Remove <strong>{activePlatform.platform_display_name}</strong> version from your
                    library? This will delete all progress, sessions, and notes for this platform.
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      variant="destructive"
                      onClick={() => {
                        deleteGameMutation.mutate({ platformId: activePlatformId });
                        setShowDeleteConfirm(false);
                      }}
                      disabled={deleteGameMutation.isPending}
                      className="flex-1"
                    >
                      {deleteGameMutation.isPending ? "Removing..." : "Confirm Remove"}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline-red"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="h-auto w-full border-2 py-3 font-semibold"
                >
                  Remove from Library
                </Button>
              )}
            </div>

            {/* Metadata */}
            <div className="mt-4 flex flex-wrap gap-2">
              {game.release_date && (
                <span className="rounded-lg bg-ctp-surface0 px-3 py-1 text-sm text-ctp-subtext0">
                  {new Date(game.release_date).getFullYear()}
                </span>
              )}
              {game.metacritic_score && (
                <span className="bg-ctp-green/20 rounded-lg border border-ctp-green px-3 py-1 text-sm text-ctp-green">
                  Metacritic: {game.metacritic_score}
                </span>
              )}
              {game.expected_playtime && game.expected_playtime > 0 && (
                <span className="bg-ctp-teal/20 group relative inline-flex items-center gap-1.5 rounded-lg border border-ctp-teal px-3 py-1 text-sm text-ctp-teal">
                  ~{game.expected_playtime}h to beat
                  <span className="cursor-help" title="Average playtime based on Steam player data">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-3.5 w-3.5 opacity-70"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0ZM8.94 6.94a.75.75 0 1 1-1.061-1.061 3 3 0 1 1 2.871 5.026v.345a.75.75 0 0 1-1.5 0v-.5c0-.72.57-1.172 1.081-1.287A1.5 1.5 0 1 0 8.94 6.94ZM10 15a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                </span>
              )}
              {game.esrb_rating && (
                <span className="rounded-lg bg-ctp-surface0 px-3 py-1 text-sm text-ctp-subtext0">
                  {game.esrb_rating.toUpperCase()}
                </span>
              )}
            </div>

            {/* Genres */}
            {genres.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {genres.map((genre) => (
                  <span
                    key={genre}
                    className="bg-ctp-teal/10 border-ctp-teal/30 rounded border px-2 py-1 text-xs text-ctp-teal"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {/* Franchise */}
            {game.series_name && (
              <div className="mt-4">
                <span className="mb-2 block text-sm font-medium text-ctp-subtext0">Franchise</span>
                <FranchisePreview seriesName={game.series_name} currentGameId={game.id} />
              </div>
            )}

            {/* External Resources */}
            <div className="mt-4">
              <span className="mb-2 block text-sm font-medium text-ctp-subtext0">
                External Resources
              </span>
              <div className="flex flex-col gap-2">
                <a
                  href={`https://howlongtobeat.com/?q=${encodeURIComponent(normalizeGameName(activePlatform.name))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full rounded-lg border border-ctp-surface1 bg-ctp-surface0 px-3 py-2 text-center text-sm text-ctp-subtext1 transition-all hover:border-ctp-teal hover:bg-ctp-surface1 hover:text-ctp-teal"
                >
                  HowLongToBeat
                </a>
                <a
                  href={`https://www.ign.com/wikis/${normalizeGameName(activePlatform.name)
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full rounded-lg border border-ctp-surface1 bg-ctp-surface0 px-3 py-2 text-center text-sm text-ctp-subtext1 transition-all hover:border-ctp-teal hover:bg-ctp-surface1 hover:text-ctp-teal"
                >
                  IGN Guide
                </a>
                <a
                  href={`https://www.powerpyx.com/?s=${encodeURIComponent(normalizeGameName(activePlatform.name))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full rounded-lg border border-ctp-surface1 bg-ctp-surface0 px-3 py-2 text-center text-sm text-ctp-subtext1 transition-all hover:border-ctp-teal hover:bg-ctp-surface1 hover:text-ctp-teal"
                >
                  PowerPyx Guide
                </a>
              </div>
            </div>

            {/* Game Version */}
            <div className="bg-ctp-surface0/30 mt-4 rounded-lg border border-ctp-surface1 p-4">
              <span className="mb-2 block text-sm font-medium text-ctp-subtext0">Game Version</span>
              <EditionSwitcher gameId={game.id} platformId={activePlatformId} />
            </div>
          </div>

          {/* Game Details */}
          <div className="lg:col-span-1 xl:col-span-2">
            <div className="mb-4 hidden items-center gap-3 md:flex">
              <BackButton
                iconOnly={true}
                className="rounded-lg p-2 text-ctp-subtext0 transition-all hover:bg-ctp-surface0 hover:text-ctp-text"
              />
              <h1 className="text-4xl font-bold">{activePlatform.name}</h1>
            </div>

            <div>
              <div className="bg-ctp-surface0/30 mb-6 rounded-lg border border-ctp-surface1 p-4">
                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <ProgressDisplay gameId={game.id} platformId={activePlatformId} />
                  </div>
                  <div className="flex flex-col gap-4">
                    <div>
                      <span
                        className="mb-2 block text-sm font-medium text-ctp-subtext0"
                        id="user-rating-label"
                      >
                        Your Rating
                      </span>
                      <div
                        className="grid grid-cols-5 gap-1 sm:grid-cols-10"
                        role="group"
                        aria-labelledby="user-rating-label"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                          <Button
                            key={rating}
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRatingChange(rating)}
                            aria-label={`Rate ${rating} out of 10`}
                            aria-pressed={activePlatform.user_rating === rating}
                            className={
                              activePlatform.user_rating === rating
                                ? "shadow-ctp-mauve/50 hover:bg-ctp-mauve/90 bg-ctp-mauve text-ctp-base shadow-lg hover:text-ctp-base"
                                : "bg-ctp-surface0 text-ctp-subtext0 hover:bg-ctp-surface1 hover:text-ctp-text"
                            }
                          >
                            {rating}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() =>
                        toggleFavoriteMutation.mutate({
                          platformId: activePlatformId,
                          isFavorite: !activePlatform.is_favorite,
                        })
                      }
                      disabled={toggleFavoriteMutation.isPending}
                      className={`h-auto w-full py-3 font-semibold ${
                        activePlatform.is_favorite
                          ? "bg-ctp-red/20 hover:bg-ctp-red/30 border-2 border-ctp-red text-ctp-red hover:text-ctp-red"
                          : "border-2 border-ctp-surface1 bg-ctp-surface0 text-ctp-subtext0 hover:border-ctp-red hover:bg-ctp-surface1 hover:text-ctp-red"
                      }`}
                    >
                      <span className="inline-flex items-center justify-center gap-2">
                        <svg
                          className="h-5 w-5"
                          viewBox="0 0 24 24"
                          fill={activePlatform.is_favorite ? "currentColor" : "none"}
                          stroke="currentColor"
                          strokeWidth={2}
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                          />
                        </svg>
                        {activePlatform.is_favorite ? "Remove from Favorites" : "Add to Favorites"}
                      </span>
                    </Button>
                  </div>
                </div>
              </div>
              {activePlatform.description && (
                <div
                  id="about"
                  className="bg-ctp-surface0/30 mb-6 rounded-lg border border-ctp-surface1 p-4"
                >
                  <h2 className="mb-3 text-xl font-semibold text-ctp-mauve">About</h2>
                  <p className="leading-relaxed text-ctp-subtext1">{activePlatform.description}</p>
                </div>
              )}

              {/* Notes Section */}
              <div
                id="notes"
                className="bg-ctp-surface0/30 mb-6 rounded-lg border border-ctp-surface1 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-ctp-mauve">Notes</h2>
                  {!isEditingNotes && (
                    <Button
                      variant="link"
                      onClick={startEditingNotes}
                      className="h-auto p-0 text-sm text-ctp-teal hover:text-ctp-mauve"
                    >
                      {activePlatform.notes ? "Edit" : "Add Notes"}
                    </Button>
                  )}
                </div>

                {isEditingNotes ? (
                  <div>
                    <Textarea
                      value={notesValue}
                      onChange={(e) => setNotesValue(e.target.value)}
                      className="min-h-32 w-full border-ctp-surface1 bg-ctp-mantle focus:border-ctp-mauve"
                      placeholder="Add your notes about this game..."
                    />
                    <div className="mt-2 flex gap-2">
                      <Button onClick={handleSaveNotes} disabled={updateNotesMutation.isPending}>
                        {updateNotesMutation.isPending ? "Saving..." : "Save"}
                      </Button>
                      <Button variant="secondary" onClick={() => setIsEditingNotes(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-ctp-mantle/50 rounded-lg p-4 text-ctp-subtext1">
                    {activePlatform.notes || "No notes yet"}
                  </div>
                )}
              </div>

              {/* Edition & DLC Ownership Section */}
              <div
                id="ownership"
                className="bg-ctp-surface0/30 mb-6 rounded-lg border border-ctp-surface1 p-4"
              >
                <h2 className="mb-4 text-xl font-semibold text-ctp-mauve">
                  Edition & DLC Ownership
                </h2>
                <EditionOwnership gameId={game.id} platformId={activePlatformId} />
              </div>

              {/* Achievements Section */}
              <div
                id="achievements"
                tabIndex={-1}
                className="bg-ctp-surface0/30 mb-6 rounded-lg border border-ctp-surface1 p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-ctp-teal focus-visible:ring-offset-2 focus-visible:ring-offset-ctp-base"
              >
                <h2 className="mb-4 text-xl font-semibold text-ctp-mauve">Achievements</h2>
                <GameAchievements gameId={game.id} platformId={activePlatformId} />
              </div>

              {/* Sessions History Section */}
              <div
                id="sessions"
                tabIndex={-1}
                className="bg-ctp-surface0/30 mb-6 rounded-lg border border-ctp-surface1 p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-ctp-teal focus-visible:ring-offset-2 focus-visible:ring-offset-ctp-base"
              >
                <SessionsHistory gameId={game.id} platformId={activePlatformId} />
              </div>

              {/* Progress History Section */}
              <div
                id="stats"
                tabIndex={-1}
                className="bg-ctp-surface0/30 mb-6 rounded-lg border border-ctp-surface1 p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-ctp-teal focus-visible:ring-offset-2 focus-visible:ring-offset-ctp-base"
              >
                <ProgressHistory gameId={game.id} platformId={activePlatformId} />
              </div>
            </div>
          </div>
        </div>

        {/* RAWG ID Correction */}
        <div className="mt-4 lg:col-span-1">
          <RawgIdCorrection gameId={game.id} currentRawgId={game.rawg_id} gameName={game.name} />
        </div>
      </div>
    </PageLayout>
  );
}
