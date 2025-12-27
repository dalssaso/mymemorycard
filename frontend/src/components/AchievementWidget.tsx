import { useQuery } from '@tanstack/react-query'
import { statsAPI, AchievementStats } from '@/lib/api'
import { Card } from '@/components/ui'

const RARITY_CONFIG = {
  legendary: { label: 'Legendary', color: 'text-yellow-400', bgColor: 'bg-yellow-400/20', threshold: '< 5%' },
  rare: { label: 'Rare', color: 'text-purple-400', bgColor: 'bg-purple-400/20', threshold: '5-15%' },
  uncommon: { label: 'Uncommon', color: 'text-cyan-400', bgColor: 'bg-cyan-400/20', threshold: '15-35%' },
  common: { label: 'Common', color: 'text-gray-400', bgColor: 'bg-gray-400/20', threshold: '> 35%' },
}

export function AchievementWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['achievementStats'],
    queryFn: async () => {
      const response = await statsAPI.getAchievementStats()
      return response.data as AchievementStats
    },
  })

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
        <div className="text-gray-400 text-center py-8">
          No achievement data yet. Add games with achievements to see your stats.
        </div>
      </Card>
    )
  }

  const { summary, rarityBreakdown, rarestUnlocked } = data
  const totalRarityCount = Object.values(rarityBreakdown).reduce((a, b) => a + b, 0)

  return (
    <Card className="bg-primary-yellow/5 border-primary-yellow/20">
      <h2 className="text-2xl font-bold text-primary-yellow mb-4">Achievements</h2>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-800/50 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-white">{summary.overallPercentage}%</div>
          <div className="text-sm text-gray-400">Overall Completion</div>
          <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
            <div
              className="bg-primary-yellow h-2 rounded-full transition-all"
              style={{ width: `${summary.overallPercentage}%` }}
            />
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-primary-green">{summary.perfectGames}</div>
          <div className="text-sm text-gray-400">Perfect Games</div>
          <div className="text-xs text-gray-500 mt-1">
            of {summary.gamesWithAchievements} with achievements
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-primary-cyan">{summary.completedAchievements}</div>
          <div className="text-sm text-gray-400">Unlocked</div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-gray-300">{summary.totalAchievements}</div>
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
