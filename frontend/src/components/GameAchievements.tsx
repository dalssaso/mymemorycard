import { useRef, useState } from "react";
import type { PointerEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Checkbox, Input, Label, ScrollFade, Textarea } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { completionLogsAPI, gamesAPI } from "@/lib/api";

interface Achievement {
  achievement_id: string;
  source: "rawg" | "manual";
  name: string;
  description: string | null;
  image_url: string | null;
  rarity_percent: number | null;
  completed: boolean;
  completed_at: string | null;
  can_delete: boolean;
}

interface GameAchievementsProps {
  gameId: string;
  platformId: string;
}

export function GameAchievements({ gameId, platformId }: GameAchievementsProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const manualSwipeStartXRef = useRef(0);
  const manualSwipeStartYRef = useRef(0);
  const manualSwipeStartOffsetRef = useRef(0);
  const manualSwipeInProgressRef = useRef(false);
  const [filter, setFilter] = useState<"all" | "completed" | "incomplete">("all");
  const [manualName, setManualName] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [selectedManualIds, setSelectedManualIds] = useState<string[]>([]);
  const [activeManualSwipeId, setActiveManualSwipeId] = useState<string | null>(null);
  const [activeManualSwipeOffset, setActiveManualSwipeOffset] = useState(0);
  const [swipedManualId, setSwipedManualId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["achievements", gameId, platformId],
    queryFn: async () => {
      const response = await gamesAPI.getAchievements(gameId, platformId);
      return response.data as { achievements: Achievement[]; message?: string };
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ achievementId, completed }: { achievementId: string; completed: boolean }) =>
      gamesAPI.updateAchievement(gameId, platformId, achievementId, completed),
    onMutate: async ({ achievementId, completed }) => {
      await queryClient.cancelQueries({ queryKey: ["achievements", gameId, platformId] });
      const previousData = queryClient.getQueryData(["achievements", gameId, platformId]);

      queryClient.setQueryData(
        ["achievements", gameId, platformId],
        (old: { achievements: Achievement[] } | undefined) => {
          if (!old) return old;
          return {
            ...old,
            achievements: old.achievements.map((ach) =>
              ach.achievement_id === achievementId
                ? {
                    ...ach,
                    completed,
                    completed_at: completed ? new Date().toISOString() : null,
                  }
                : ach
            ),
          };
        }
      );

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["achievements", gameId, platformId], context.previousData);
      }
      showToast("Failed to update achievement", "error");
    },
    onSuccess: async () => {
      try {
        await completionLogsAPI.recalculate(gameId, platformId);
        queryClient.invalidateQueries({ queryKey: ["completionLogs", gameId] });
        queryClient.invalidateQueries({ queryKey: ["game", gameId] });
        queryClient.invalidateQueries({ queryKey: ["games"] });
        queryClient.invalidateQueries({ queryKey: ["activityFeed"] });
        queryClient.invalidateQueries({ queryKey: ["achievementStats"] });
      } catch (error) {
        console.error("Failed to recalculate progress after achievement update:", error);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["achievements", gameId, platformId] });
    },
  });

  const createManualAchievementMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      gamesAPI.createManualAchievement(gameId, platformId, data),
    onSuccess: async () => {
      setManualName("");
      setManualDescription("");
      setSelectedManualIds([]);
      try {
        await completionLogsAPI.recalculate(gameId, platformId);
        queryClient.invalidateQueries({ queryKey: ["completionLogs", gameId] });
        queryClient.invalidateQueries({ queryKey: ["achievementStats"] });
      } catch (error) {
        console.error("Failed to recalculate progress after achievement creation:", error);
      }
      queryClient.invalidateQueries({ queryKey: ["achievements", gameId, platformId] });
      showToast("Achievement added", "success");
    },
    onError: () => {
      showToast("Failed to add achievement", "error");
    },
  });

  const bulkDeleteManualMutation = useMutation({
    mutationFn: (achievementIds: string[]) =>
      gamesAPI.deleteManualAchievements(gameId, platformId, achievementIds),
    onSuccess: async () => {
      setSelectedManualIds([]);
      try {
        await completionLogsAPI.recalculate(gameId, platformId);
        queryClient.invalidateQueries({ queryKey: ["completionLogs", gameId] });
        queryClient.invalidateQueries({ queryKey: ["achievementStats"] });
      } catch (error) {
        console.error("Failed to recalculate progress after achievement delete:", error);
      }
      queryClient.invalidateQueries({ queryKey: ["achievements", gameId, platformId] });
      showToast("Manual achievements deleted", "success");
    },
    onError: () => {
      showToast("Failed to delete achievements", "error");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-text-muted">Loading achievements...</div>
      </div>
    );
  }

  if (error) {
    return <div className="text-status-dropped py-4">Failed to load achievements</div>;
  }

  const achievements = data?.achievements || [];
  const manualAchievements = achievements.filter((ach) => ach.source === "manual");
  const rawgAchievements = achievements.filter((ach) => ach.source === "rawg");
  const maxSwipeOffset = 72;

  const completedCount = achievements.filter((a) => a.completed).length;
  const totalCount = achievements.length;
  const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const filteredAchievements = achievements.filter((ach) => {
    if (filter === "completed") return ach.completed;
    if (filter === "incomplete") return !ach.completed;
    return true;
  });
  const filteredManualAchievements = filteredAchievements.filter((ach) => ach.source === "manual");
  const filteredRawgAchievements = filteredAchievements.filter((ach) => ach.source === "rawg");

  const manualEmptyMessage =
    manualAchievements.length === 0
      ? "No user added achievements yet"
      : "No user added achievements match this filter";
  const rawgEmptyMessage =
    rawgAchievements.length === 0
      ? data?.message || "No game achievements available for this game"
      : "No game achievements match this filter";

  const toggleManualSelection = (achievementId: string) => {
    setSelectedManualIds((prev) =>
      prev.includes(achievementId)
        ? prev.filter((id) => id !== achievementId)
        : [...prev, achievementId]
    );
  };

  const canCreateManual =
    manualName.trim().length > 0 && !createManualAchievementMutation.isPending;
  const canBulkDelete = selectedManualIds.length > 0 && !bulkDeleteManualMutation.isPending;

  const handleManualPointerDown =
    (achievementId: string) => (event: PointerEvent<HTMLDivElement>) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      manualSwipeStartXRef.current = event.clientX;
      manualSwipeStartYRef.current = event.clientY;
      manualSwipeStartOffsetRef.current = swipedManualId === achievementId ? -maxSwipeOffset : 0;
      manualSwipeInProgressRef.current = false;
      setActiveManualSwipeId(achievementId);
      setActiveManualSwipeOffset(manualSwipeStartOffsetRef.current);
      if (swipedManualId && swipedManualId !== achievementId) {
        setSwipedManualId(null);
      }
      event.currentTarget.setPointerCapture(event.pointerId);
    };

  const handleManualPointerMove =
    (achievementId: string) => (event: PointerEvent<HTMLDivElement>) => {
      if (activeManualSwipeId !== achievementId) return;
      const currentX = event.clientX;
      const currentY = event.clientY;
      const deltaX = currentX - manualSwipeStartXRef.current;
      const deltaY = currentY - manualSwipeStartYRef.current;
      if (Math.abs(deltaX) < 4 && Math.abs(deltaY) < 4) return;
      if (Math.abs(deltaX) < Math.abs(deltaY)) return;

      const nextOffset = Math.max(
        -maxSwipeOffset,
        Math.min(0, manualSwipeStartOffsetRef.current + deltaX)
      );
      setActiveManualSwipeOffset(nextOffset);
      manualSwipeInProgressRef.current = true;
    };

  const handleManualPointerEnd =
    (achievementId: string) => (event: PointerEvent<HTMLDivElement>) => {
      if (activeManualSwipeId !== achievementId) return;
      const shouldOpen = activeManualSwipeOffset <= -maxSwipeOffset / 2;
      setSwipedManualId(shouldOpen ? achievementId : null);
      setActiveManualSwipeId(null);
      setActiveManualSwipeOffset(0);
      manualSwipeInProgressRef.current = false;
      event.currentTarget.releasePointerCapture(event.pointerId);
    };

  const handleManualAchievementClick = (achievement: Achievement) => {
    if (manualSwipeInProgressRef.current) {
      manualSwipeInProgressRef.current = false;
      return;
    }
    if (swipedManualId === achievement.achievement_id) {
      setSwipedManualId(null);
      return;
    }
    toggleMutation.mutate({
      achievementId: achievement.achievement_id,
      completed: !achievement.completed,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-text-secondary text-sm">Progress</div>
          <div className="text-text-primary text-2xl font-bold">
            {completedCount} / {totalCount}
          </div>
        </div>
        <div className="w-32">
          <div className="bg-elevated h-3 w-full rounded-full">
            <div
              className="bg-status-finished h-3 rounded-full transition-all"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
          <div className="text-text-secondary mt-1 text-right text-sm">{completionPercent}%</div>
        </div>
      </div>

      <div className="flex gap-2">
        {(["all", "incomplete", "completed"] as const).map((f) => (
          <Button
            key={f}
            onClick={() => setFilter(f)}
            variant="ghost"
            className={`h-auto rounded-lg px-3 py-1 text-sm transition-all ${
              filter === f
                ? "bg-accent text-base"
                : "bg-surface text-text-secondary hover:bg-elevated"
            }`}
          >
            {f === "all"
              ? `All (${totalCount})`
              : f === "completed"
                ? `Completed (${completedCount})`
                : `Incomplete (${totalCount - completedCount})`}
          </Button>
        ))}
      </div>

      <div className="bg-surface/60 border-elevated/60 rounded-lg border p-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-text-primary text-sm font-semibold">User Added Achievements</div>
            <div className="text-text-muted text-xs">
              Add custom achievements for this platform and manage them in bulk.
            </div>
          </div>
          {manualAchievements.length > 0 && (
            <div className="text-text-secondary text-xs">
              {manualAchievements.length} user added achievement
              {manualAchievements.length === 1 ? "" : "s"}
            </div>
          )}
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <div className="w-full">
            <Label
              className="text-text-secondary mb-2 block text-sm font-medium"
              htmlFor="manual-achievement-name"
            >
              Achievement name
            </Label>
            <Input
              id="manual-achievement-name"
              placeholder="Enter a name"
              value={manualName}
              onChange={(event) => setManualName(event.target.value)}
            />
          </div>
          <div className="w-full">
            <label
              className="text-text-secondary mb-2 block text-sm font-medium"
              htmlFor="manual-achievement-description"
            >
              Description (optional)
            </label>
            <Textarea
              id="manual-achievement-description"
              className="bg-base text-text-primary placeholder:text-text-muted focus-visible:ring-accent min-h-[42px]"
              placeholder="Add a short description"
              value={manualDescription}
              onChange={(event) => setManualDescription(event.target.value)}
              rows={1}
            />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() =>
              createManualAchievementMutation.mutate({
                name: manualName.trim(),
                description: manualDescription.trim() || undefined,
              })
            }
            disabled={!canCreateManual}
          >
            Add achievement
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => bulkDeleteManualMutation.mutate(selectedManualIds)}
            disabled={!canBulkDelete}
          >
            Delete selected
          </Button>
          {selectedManualIds.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedManualIds([])}
              disabled={bulkDeleteManualMutation.isPending}
            >
              Clear selection
            </Button>
          )}
        </div>
        {filteredManualAchievements.length === 0 ? (
          <div className="text-text-secondary py-4">{manualEmptyMessage}</div>
        ) : (
          <div className="mt-3 space-y-2">
            {filteredManualAchievements.map((ach) => {
              const isSwiped = swipedManualId === ach.achievement_id;
              const isDragging = activeManualSwipeId === ach.achievement_id;
              const translateX = isDragging
                ? activeManualSwipeOffset
                : isSwiped
                  ? -maxSwipeOffset
                  : 0;

              const showSwipeAction = isSwiped || isDragging;

              return (
                <div
                  key={`manual-${ach.achievement_id}`}
                  className="relative overflow-hidden rounded-lg"
                >
                  <div
                    className={`bg-status-dropped absolute inset-y-0 right-0 flex w-[72px] items-center justify-center transition-opacity md:hidden ${
                      showSwipeAction ? "opacity-100" : "pointer-events-none opacity-0"
                    }`}
                  >
                    <Button
                      onClick={(event) => {
                        event.stopPropagation();
                        bulkDeleteManualMutation.mutate([ach.achievement_id]);
                        setSwipedManualId(null);
                      }}
                      disabled={bulkDeleteManualMutation.isPending}
                      variant="ghost"
                      className="text-base h-auto p-0 text-sm font-semibold disabled:opacity-60"
                      aria-label="Delete achievement"
                    >
                      Delete
                    </Button>
                  </div>
                  <div
                    className={`flex w-full cursor-pointer touch-pan-y items-center gap-3 rounded-lg p-3 transition-transform ${
                      ach.completed
                        ? "bg-status-finished/10 border-status-finished/30 border"
                        : "bg-surface/50 border-elevated hover:border-elevated border"
                    } ${isDragging ? "" : "duration-200 ease-out"}`}
                    style={{ transform: `translateX(${translateX}px)` }}
                    onClick={() => handleManualAchievementClick(ach)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleManualAchievementClick(ach);
                      }
                    }}
                    onPointerDown={handleManualPointerDown(ach.achievement_id)}
                    onPointerMove={handleManualPointerMove(ach.achievement_id)}
                    onPointerUp={handleManualPointerEnd(ach.achievement_id)}
                    onPointerCancel={handleManualPointerEnd(ach.achievement_id)}
                    role="button"
                    tabIndex={0}
                  >
                    <Checkbox
                      checked={selectedManualIds.includes(ach.achievement_id)}
                      onChange={() => toggleManualSelection(ach.achievement_id)}
                      onClick={(event) => event.stopPropagation()}
                      aria-label="Select manual achievement for deletion"
                    />

                    <div
                      className={`bg-accent/20 text-accent flex h-12 w-12 items-center justify-center rounded ${
                        ach.completed ? "" : "opacity-60"
                      }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="h-6 w-6"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-2.999 0"
                        />
                      </svg>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div
                        className={`truncate font-medium ${
                          ach.completed ? "text-status-finished" : "text-text-primary"
                        }`}
                      >
                        {ach.name}
                      </div>
                      {ach.description && (
                        <div className="text-text-secondary truncate text-sm">{ach.description}</div>
                      )}
                      {ach.completed_at && (
                        <div className="text-text-muted mt-1 text-xs">
                          Completed {new Date(ach.completed_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${
                        ach.completed
                          ? "border-status-finished bg-status-finished text-base"
                          : "border-elevated hover:border-text-muted text-transparent"
                      }`}
                    >
                      <svg
                        className="h-4 w-4"
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
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-surface/60 border-elevated/60 rounded-lg border p-3">
        <div className="flex items-center justify-between">
          <div className="text-text-primary text-sm font-semibold">Game Achievements</div>
          {rawgAchievements.length > 0 && (
            <div className="text-text-secondary text-xs">
              {rawgAchievements.length} game achievement{rawgAchievements.length === 1 ? "" : "s"}
            </div>
          )}
        </div>
        {filteredRawgAchievements.length === 0 ? (
          <div className="text-text-secondary py-4">{rawgEmptyMessage}</div>
        ) : (
          <ScrollFade axis="y" className="mt-3 max-h-96 space-y-2 overflow-y-auto">
            {filteredRawgAchievements.map((ach) => (
              <Button
                key={`rawg-${ach.achievement_id}`}
                type="button"
                variant="ghost"
                className={`flex h-auto w-full cursor-pointer items-center gap-3 rounded-lg p-3 transition-all ${
                  ach.completed
                    ? "bg-status-finished/10 border-status-finished/30 border"
                    : "bg-surface/50 border-elevated hover:border-elevated border"
                }`}
                onClick={() =>
                  toggleMutation.mutate({
                    achievementId: ach.achievement_id,
                    completed: !ach.completed,
                  })
                }
              >
                {ach.image_url ? (
                  <img
                    src={ach.image_url}
                    alt=""
                    className={`h-12 w-12 rounded ${ach.completed ? "" : "opacity-50 grayscale"}`}
                  />
                ) : (
                  <div
                    className={`bg-elevated flex h-12 w-12 items-center justify-center rounded ${
                      ach.completed ? "" : "opacity-50"
                    }`}
                  >
                    <span className="text-text-muted text-xl">?</span>
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div
                    className={`truncate font-medium ${ach.completed ? "text-status-finished" : "text-text-primary"}`}
                  >
                    {ach.name}
                  </div>
                  {ach.description && (
                    <div className="text-text-secondary truncate text-sm">{ach.description}</div>
                  )}
                  <div className="mt-1 flex items-center gap-2">
                    {ach.rarity_percent !== null && (
                      <span
                        className={`rounded px-2 py-0.5 text-xs ${
                          ach.rarity_percent < 10
                            ? "bg-accent/20 text-accent"
                            : ach.rarity_percent < 25
                              ? "bg-accent/20 text-accent"
                              : "bg-elevated text-text-secondary"
                        }`}
                      >
                        {ach.rarity_percent.toFixed(1)}% of players
                      </span>
                    )}
                    {ach.completed_at && (
                      <span className="text-text-muted text-xs">
                        Completed {new Date(ach.completed_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${
                    ach.completed
                      ? "border-status-finished bg-status-finished text-base"
                      : "border-elevated hover:border-text-muted text-transparent"
                  }`}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </Button>
            ))}
          </ScrollFade>
        )}
      </div>
    </div>
  );
}
