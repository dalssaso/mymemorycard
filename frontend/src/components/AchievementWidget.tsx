import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { gamesAPI, statsAPI } from "@/lib/api";
import type { AchievementStats } from "@/lib/api";
import { Card } from "@/components/ui";
import { useAnimatedNumber } from "@/hooks/use-animated-number";

const RARITY_CONFIG = {
  legendary: {
    label: "Legendary",
    color: "text-ctp-yellow",
    bgColor: "bg-ctp-yellow/20",
    threshold: "< 5%",
  },
  rare: { label: "Rare", color: "text-ctp-mauve", bgColor: "bg-ctp-mauve/20", threshold: "5-15%" },
  uncommon: {
    label: "Uncommon",
    color: "text-ctp-teal",
    bgColor: "bg-ctp-teal/20",
    threshold: "15-35%",
  },
  common: {
    label: "Common",
    color: "text-ctp-subtext0",
    bgColor: "bg-ctp-surface1/40",
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
      <Card className="bg-ctp-yellow/5 border-ctp-yellow/20" padded={true}>
        <h2 className="text-ctp-yellow mb-3 text-2xl font-bold">Achievements</h2>
        <div className="animate-pulse space-y-4">
          <div className="bg-ctp-surface1/50 h-24 rounded-lg" />
          <div className="bg-ctp-surface1/50 h-32 rounded-lg" />
        </div>
      </Card>
    );
  }

  if (!data || data.summary.totalAchievements === 0) {
    return (
      <Card className="bg-ctp-yellow/5 border-ctp-yellow/20" padded={true}>
        <h2 className="text-ctp-yellow mb-3 text-2xl font-bold">Achievements</h2>
        {isSyncing ? (
          <div className="text-ctp-subtext0 py-8 text-center">Syncing achievement data...</div>
        ) : (
          <div className="text-ctp-subtext0 py-8 text-center">
            No achievement data yet. Add games with achievements to see your stats.
          </div>
        )}
      </Card>
    );
  }

  return (
    <Card className="bg-ctp-yellow/5 border-ctp-yellow/20" padded={true}>
      <h2 className="text-ctp-yellow mb-3 text-2xl font-bold">Achievements</h2>

      <div className="mb-4 grid grid-cols-2 gap-2.5">
        <div className="bg-ctp-surface0/60 border-ctp-surface1/50 rounded-lg border p-3 text-center shadow-sm">
          <div className="text-ctp-text text-2xl font-bold">{animatedOverallPercentage}%</div>
          <div className="text-ctp-subtext0 text-xs">Overall Completion</div>
          <div className="bg-ctp-surface1 mt-2 h-2 w-full rounded-full">
            <div
              className="bg-ctp-yellow h-2 rounded-full transition-all"
              style={{ width: `${animatedOverallPercentage}%` }}
            />
          </div>
        </div>

        <div className="bg-ctp-surface0/60 border-ctp-surface1/50 rounded-lg border p-3 text-center shadow-sm">
          <div className="text-ctp-green text-2xl font-bold">{animatedPerfectGames}</div>
          <div className="text-ctp-subtext0 text-xs">Perfect Games</div>
          <div className="text-ctp-overlay1 mt-1 text-xs">
            of {animatedGamesWithAchievements} with achievements
          </div>
        </div>

        <div className="bg-ctp-surface0/60 border-ctp-surface1/50 rounded-lg border p-3 text-center shadow-sm">
          <div className="text-ctp-teal text-2xl font-bold">{animatedCompletedAchievements}</div>
          <div className="text-ctp-subtext0 text-xs">Unlocked</div>
        </div>

        <div className="bg-ctp-surface0/60 border-ctp-surface1/50 rounded-lg border p-3 text-center shadow-sm">
          <div className="text-ctp-subtext1 text-2xl font-bold">{animatedTotalAchievements}</div>
          <div className="text-ctp-subtext0 text-xs">Total Available</div>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-ctp-subtext1 mb-2 text-sm font-semibold">Rarity Breakdown</h3>
        <div className="space-y-1.5">
          {(Object.keys(RARITY_CONFIG) as Array<keyof typeof RARITY_CONFIG>).map((key) => {
            const config = RARITY_CONFIG[key];
            const count = rarityBreakdown[key];
            const percentage = totalRarityCount > 0 ? (count / totalRarityCount) * 100 : 0;

            return (
              <div key={key} className="flex items-center gap-2">
                <div className={`w-20 text-sm ${config.color}`}>{config.label}</div>
                <div className="bg-ctp-surface1 relative h-2.5 flex-1 overflow-hidden rounded-full">
                  <div
                    className={`${config.bgColor} h-full rounded-full transition-all`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="text-ctp-subtext0 w-12 text-right text-sm">{count}</div>
              </div>
            );
          })}
        </div>
      </div>

      {rarestUnlocked.length > 0 && (
        <div>
          <h3 className="text-ctp-subtext1 mb-2 text-sm font-semibold">Rarest Unlocked</h3>
          <div className="space-y-2">
            {rarestUnlocked.slice(0, 3).map((item, index) => (
              <div
                key={index}
                className="bg-ctp-surface0/50 flex items-center gap-3 rounded-lg p-2"
              >
                {item.coverArtUrl ? (
                  <img src={item.coverArtUrl} alt="" className="h-10 w-10 rounded object-cover" />
                ) : (
                  <div className="bg-ctp-surface1 flex h-10 w-10 items-center justify-center rounded">
                    <span className="text-ctp-overlay1 text-lg">?</span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-ctp-text truncate text-sm">{item.achievementName}</div>
                  <div className="text-ctp-overlay1 truncate text-xs">{item.gameName}</div>
                </div>
                <div
                  className={`rounded px-2 py-1 text-xs ${
                    (item.rarity ?? 100) < 5
                      ? "bg-ctp-yellow/20 text-ctp-yellow"
                      : (item.rarity ?? 100) < 15
                        ? "bg-ctp-mauve/20 text-ctp-mauve"
                        : "bg-ctp-teal/20 text-ctp-teal"
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
