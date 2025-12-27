import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { gamesAPI, statsAPI } from '@/lib/api'
import type { AchievementStats } from '@/lib/api'
import { Card } from '@/components/ui'
import { useAnimatedNumber } from '@/hooks/use-animated-number'

const RARITY_CONFIG = {
  legendary: { label: 'Legendary', color: 'text-yellow-400', bgColor: 'bg-yellow-400/20', threshold: '< 5%' },
  rare: { label: 'Rare', color: 'text-purple-400', bgColor: 'bg-purple-400/20', threshold: '5-15%' },
  uncommon: { label: 'Uncommon', color: 'text-cyan-400', bgColor: 'bg-cyan-400/20', threshold: '15-35%' },
  common: { label: 'Common', color: 'text-gray-400', bgColor: 'bg-gray-400/20', threshold: '> 35%' },
}

interface AchievementWidgetGame {
  id: string
  platform_id: string
  rawg_id?: number | null
}

interface AchievementWidgetProps {
  games: AchievementWidgetGame[]
}

export function AchievementWidget({ games }: AchievementWidgetProps) {
  const queryClient = useQueryClient()
  const syncAttemptedRef = useRef(new Set<string>())
  const gamesKeyRef = useRef<string | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const { data, isLoading } = useQuery({
    queryKey: ['achievementStats'],
    queryFn: async () => {
      const response = await statsAPI.getAchievementStats()
      return response.data as AchievementStats
    },
    refetchOnMount: 'always',
  })

  const summary = data?.summary ?? {
    totalAchievements: 0,
    completedAchievements: 0,
    overallPercentage: 0,
    gamesWithAchievements: 0,
    perfectGames: 0,
  }
  const rarityBreakdown = data?.rarityBreakdown ?? {
    legendary: 0,
    rare: 0,
    uncommon: 0,
    common: 0,
  }
  const rarestUnlocked = data?.rarestUnlocked ?? []
  const totalRarityCount = Object.values(rarityBreakdown).reduce((a, b) => a + b, 0)
  const animatedOverallPercentage = useAnimatedNumber(summary.overallPercentage)
  const animatedPerfectGames = useAnimatedNumber(summary.perfectGames)
  const animatedCompletedAchievements = useAnimatedNumber(summary.completedAchievements)
  const animatedTotalAchievements = useAnimatedNumber(summary.totalAchievements)
  const animatedGamesWithAchievements = useAnimatedNumber(summary.gamesWithAchievements)

  const gamesKey = useMemo(() => {
    return games
      .map((game) => `${game.id}:${game.platform_id}`)
      .sort()
      .join('|')
  }, [games])

  useEffect(() => {
    if (gamesKeyRef.current && gamesKeyRef.current !== gamesKey) {
      queryClient.invalidateQueries({ queryKey: ['achievementStats'] })
    }
    gamesKeyRef.current = gamesKey
  }, [gamesKey, queryClient])

  useEffect(() => {
    if (isLoading || !data) {
      return
    }

    const gamesWithRawg = games.filter((game) => Boolean(game.rawg_id))
    if (gamesWithRawg.length === 0) {
      return
    }

    const syncedGameIds = new Set(data.gameStats.map((game) => game.gameId))
    const gamesToSync = gamesWithRawg.filter(
      (game) => !syncedGameIds.has(game.id) && !syncAttemptedRef.current.has(game.id)
    )

    if (gamesToSync.length === 0) {
      return
    }

    const attemptedIds = gamesToSync.map((game) => game.id)
    attemptedIds.forEach((id) => syncAttemptedRef.current.add(id))
    let cancelled = false

    const syncAchievements = async () => {
      try {
        setIsSyncing(true)
        await Promise.all(
          gamesToSync.map((game) => gamesAPI.getAchievements(game.id, game.platform_id))
        )
        await queryClient.refetchQueries({ queryKey: ['achievementStats'] })
      } catch (error) {
        if (!cancelled) {
          attemptedIds.forEach((id) => syncAttemptedRef.current.delete(id))
        }
      } finally {
        if (!cancelled) {
          setIsSyncing(false)
        }
      }
    }

    void syncAchievements()

    return () => {
      cancelled = true
    }
  }, [data, games, isLoading, queryClient])

  if (isLoading) {
    return (
      <Card className="bg-primary-yellow/5 border-primary-yellow/20">
        <h2 className="text-2xl font-bold text-primary-yellow mb-4">Achievements</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-24 bg-gray-700/50 rounded-lg" />
          <div className="h-32 bg-gray-700/50 rounded-lg" />
        </div>
      </Card>
    )
  }

  if (!data || data.summary.totalAchievements === 0) {
    return (
      <Card className="bg-primary-yellow/5 border-primary-yellow/20">
        <h2 className="text-2xl font-bold text-primary-yellow mb-4">Achievements</h2>
        {isSyncing ? (
          <div className="text-gray-400 text-center py-8">Syncing achievement data...</div>
        ) : (
          <div className="text-gray-400 text-center py-8">
            No achievement data yet. Add games with achievements to see your stats.
          </div>
        )}
      </Card>
    )
  }

  return (
    <Card className="bg-primary-yellow/5 border-primary-yellow/20">
      <h2 className="text-2xl font-bold text-primary-yellow mb-4">Achievements</h2>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-800/50 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-white">{animatedOverallPercentage}%</div>
          <div className="text-sm text-gray-400">Overall Completion</div>
          <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
            <div
              className="bg-primary-yellow h-2 rounded-full transition-all"
              style={{ width: `${animatedOverallPercentage}%` }}
            />
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-primary-green">{animatedPerfectGames}</div>
          <div className="text-sm text-gray-400">Perfect Games</div>
          <div className="text-xs text-gray-500 mt-1">
            of {animatedGamesWithAchievements} with achievements
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-primary-cyan">{animatedCompletedAchievements}</div>
          <div className="text-sm text-gray-400">Unlocked</div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-gray-300">{animatedTotalAchievements}</div>
          <div className="text-sm text-gray-400">Total Available</div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Rarity Breakdown</h3>
        <div className="space-y-2">
          {(Object.keys(RARITY_CONFIG) as Array<keyof typeof RARITY_CONFIG>).map((key) => {
            const config = RARITY_CONFIG[key]
            const count = rarityBreakdown[key]
            const percentage = totalRarityCount > 0 ? (count / totalRarityCount) * 100 : 0

            return (
              <div key={key} className="flex items-center gap-3">
                <div className={`w-24 text-sm ${config.color}`}>{config.label}</div>
                <div className="flex-1 bg-gray-700 rounded-full h-3 relative overflow-hidden">
                  <div
                    className={`${config.bgColor} h-full rounded-full transition-all`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="w-12 text-right text-sm text-gray-400">{count}</div>
              </div>
            )
          })}
        </div>
      </div>

      {rarestUnlocked.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Rarest Unlocked</h3>
          <div className="space-y-2">
            {rarestUnlocked.slice(0, 3).map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-2"
              >
                {item.coverArtUrl ? (
                  <img
                    src={item.coverArtUrl}
                    alt=""
                    className="w-10 h-10 rounded object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded bg-gray-700 flex items-center justify-center">
                    <span className="text-gray-500 text-lg">?</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate">{item.achievementName}</div>
                  <div className="text-xs text-gray-500 truncate">{item.gameName}</div>
                </div>
                <div
                  className={`text-xs px-2 py-1 rounded ${
                    (item.rarity ?? 100) < 5
                      ? 'bg-yellow-400/20 text-yellow-400'
                      : (item.rarity ?? 100) < 15
                        ? 'bg-purple-400/20 text-purple-400'
                        : 'bg-cyan-400/20 text-cyan-400'
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
  )
}
