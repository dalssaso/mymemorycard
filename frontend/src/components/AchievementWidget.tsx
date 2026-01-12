import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { gamesAPI, statsAPI } from "@/lib/api";
import type { AchievementStats } from "@/lib/api";
import { Card } from "@/components/ui";
import { useAnimatedNumber } from "@/hooks/use-animated-number";

const RARITY_CONFIG = {
  legendary: {
    label: "Legendary",
    color: "text-accent",
    bgColor: "bg-accent/20",
    threshold: "< 5%",
  },
  rare: { label: "Rare", color: "text-accent", bgColor: "bg-accent/20", threshold: "5-15%" },
  uncommon: {
    label: "Uncommon",
    color: "text-accent",
    bgColor: "bg-accent/20",
    threshold: "15-35%",
  },
  common: {
    label: "Common",
    color: "text-text-secondary",
    bgColor: "bg-elevated/40",
    threshold: "> 35%",
  },
};

interface AchievementWidgetGame {
  id: string;
  platform_id?: string | null;
  rawg_id?: number | null;
  platforms?: Array<{ id: string }>;
}

interface AchievementWidgetProps {
  games: AchievementWidgetGame[];
}

export function AchievementWidget({ games }: AchievementWidgetProps) {
  const queryClient = useQueryClient();
  const syncAttemptedRef = useRef(new Set<string>());
  const gamesKeyRef = useRef<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["achievementStats"],
    queryFn: async () => {
      const response = await statsAPI.getAchievementStats();
      return response.data as AchievementStats;
    },
    refetchOnMount: "always",
  });

  const summary = data?.summary ?? {
    totalAchievements: 0,
    completedAchievements: 0,
    overallPercentage: 0,
    gamesWithAchievements: 0,
    perfectGames: 0,
  };
  const rarityBreakdown = data?.rarityBreakdown ?? {
    legendary: 0,
    rare: 0,
    uncommon: 0,
    common: 0,
  };
  const rarestUnlocked = data?.rarestUnlocked ?? [];
  const totalRarityCount = Object.values(rarityBreakdown).reduce((a, b) => a + b, 0);
  const animatedOverallPercentage = useAnimatedNumber(summary.overallPercentage);
  const animatedPerfectGames = useAnimatedNumber(summary.perfectGames);
  const animatedCompletedAchievements = useAnimatedNumber(summary.completedAchievements);
  const animatedTotalAchievements = useAnimatedNumber(summary.totalAchievements);
  const animatedGamesWithAchievements = useAnimatedNumber(summary.gamesWithAchievements);

  const gamesKey = useMemo(() => {
    return games
      .map((game) => `${game.id}:${game.platform_id}`)
      .sort()
      .join("|");
  }, [games]);

  useEffect(() => {
    if (gamesKeyRef.current && gamesKeyRef.current !== gamesKey) {
      queryClient.invalidateQueries({ queryKey: ["achievementStats"] });
    }
    gamesKeyRef.current = gamesKey;
  }, [gamesKey, queryClient]);

  useEffect(() => {
    if (isLoading || !data) {
      return;
    }

    const getPlatformId = (game: AchievementWidgetGame) =>
      game.platform_id ?? game.platforms?.[0]?.id ?? null;

    const gamesWithRawg = games.filter(
      (game) => Boolean(game.rawg_id) && Boolean(getPlatformId(game))
    );
    if (gamesWithRawg.length === 0) {
      return;
    }

    const syncedGameIds = new Set(data.gameStats.map((game) => game.gameId));
    const gamesToSync = gamesWithRawg.filter(
      (game) => !syncedGameIds.has(game.id) && !syncAttemptedRef.current.has(game.id)
    );

    if (gamesToSync.length === 0) {
      return;
    }

    const attemptedIds = gamesToSync.map((game) => game.id);
    attemptedIds.forEach((id) => syncAttemptedRef.current.add(id));
    let cancelled = false;

    const syncAchievements = async () => {
      try {
        setIsSyncing(true);
        await Promise.all(
          gamesToSync.map((game) => {
            const platformId = getPlatformId(game);
            if (!platformId) {
              return Promise.resolve();
            }
            return gamesAPI.getAchievements(game.id, platformId);
          })
        );
        await queryClient.refetchQueries({ queryKey: ["achievementStats"] });
      } catch {
        if (!cancelled) {
          attemptedIds.forEach((id) => syncAttemptedRef.current.delete(id));
        }
      } finally {
        if (!cancelled) {
          setIsSyncing(false);
        }
      }
    };

    void syncAchievements();

    return () => {
      cancelled = true;
    };
  }, [data, games, isLoading, queryClient]);

  if (isLoading) {
    return (
      <Card className="bg-accent/5 border-accent/20" padded={true}>
        <h2 className="mb-3 text-2xl font-bold text-accent">Achievements</h2>
        <div className="animate-pulse space-y-4">
          <div className="bg-elevated/50 h-24 rounded-lg" />
          <div className="bg-elevated/50 h-32 rounded-lg" />
        </div>
      </Card>
    );
  }

  if (!data || data.summary.totalAchievements === 0) {
    return (
      <Card className="bg-accent/5 border-accent/20" padded={true}>
        <h2 className="mb-3 text-2xl font-bold text-accent">Achievements</h2>
        {isSyncing ? (
          <div className="py-8 text-center text-text-secondary">Syncing achievement data...</div>
        ) : (
          <div className="py-8 text-center text-text-secondary">
            No achievement data yet. Add games with achievements to see your stats.
          </div>
        )}
      </Card>
    );
  }

  return (
    <Card className="bg-accent/5 border-accent/20" padded={true}>
      <h2 className="mb-3 text-2xl font-bold text-accent">Achievements</h2>

      <div className="mb-4 grid grid-cols-2 gap-2.5">
        <div className="bg-surface/60 border-elevated/50 rounded-lg border p-3 text-center shadow-sm">
          <div className="text-2xl font-bold text-text-primary">{animatedOverallPercentage}%</div>
          <div className="text-xs text-text-secondary">Overall Completion</div>
          <div className="mt-2 h-2 w-full rounded-full bg-elevated">
            <div
              className="h-2 rounded-full bg-accent transition-all"
              style={{ width: `${animatedOverallPercentage}%` }}
            />
          </div>
        </div>

        <div className="bg-surface/60 border-elevated/50 rounded-lg border p-3 text-center shadow-sm">
          <div className="text-2xl font-bold text-status-finished">{animatedPerfectGames}</div>
          <div className="text-xs text-text-secondary">Perfect Games</div>
          <div className="mt-1 text-xs text-text-muted">
            of {animatedGamesWithAchievements} with achievements
          </div>
        </div>

        <div className="bg-surface/60 border-elevated/50 rounded-lg border p-3 text-center shadow-sm">
          <div className="text-2xl font-bold text-accent">{animatedCompletedAchievements}</div>
          <div className="text-xs text-text-secondary">Unlocked</div>
        </div>

        <div className="bg-surface/60 border-elevated/50 rounded-lg border p-3 text-center shadow-sm">
          <div className="text-2xl font-bold text-text-muted">{animatedTotalAchievements}</div>
          <div className="text-xs text-text-secondary">Total Available</div>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="mb-2 text-sm font-semibold text-text-muted">Rarity Breakdown</h3>
        <div className="space-y-1.5">
          {(Object.keys(RARITY_CONFIG) as Array<keyof typeof RARITY_CONFIG>).map((key) => {
            const config = RARITY_CONFIG[key];
            const count = rarityBreakdown[key];
            const percentage = totalRarityCount > 0 ? (count / totalRarityCount) * 100 : 0;

            return (
              <div key={key} className="flex items-center gap-2">
                <div className={`w-20 text-sm ${config.color}`}>{config.label}</div>
                <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-elevated">
                  <div
                    className={`${config.bgColor} h-full rounded-full transition-all`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="w-12 text-right text-sm text-text-secondary">{count}</div>
              </div>
            );
          })}
        </div>
      </div>

      {rarestUnlocked.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-text-muted">Rarest Unlocked</h3>
          <div className="space-y-2">
            {rarestUnlocked.slice(0, 3).map((item, index) => (
              <div key={index} className="bg-surface/50 flex items-center gap-3 rounded-lg p-2">
                {item.coverArtUrl ? (
                  <img src={item.coverArtUrl} alt="" className="h-10 w-10 rounded object-cover" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded bg-elevated">
                    <span className="text-lg text-text-muted">?</span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-text-primary">{item.achievementName}</div>
                  <div className="truncate text-xs text-text-muted">{item.gameName}</div>
                </div>
                <div
                  className={`rounded px-2 py-1 text-xs ${
                    (item.rarity ?? 100) < 5
                      ? "bg-accent/20 text-accent"
                      : (item.rarity ?? 100) < 15
                        ? "bg-accent/20 text-accent"
                        : "bg-accent/20 text-accent"
                  }`}
                >
                  {item.rarity?.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
