import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { gamesAPI } from '@/lib/api'
import { useToast } from '@/components/ui/Toast'

interface Achievement {
  rawg_achievement_id: number
  name: string
  description: string | null
  image_url: string | null
  rarity_percent: number | null
  completed: boolean
  completed_at: string | null
}

interface GameAchievementsProps {
  gameId: string
  platformId: string
}

export function GameAchievements({ gameId, platformId }: GameAchievementsProps) {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [filter, setFilter] = useState<'all' | 'completed' | 'incomplete'>('all')

  const { data, isLoading, error } = useQuery({
    queryKey: ['achievements', gameId, platformId],
    queryFn: async () => {
      const response = await gamesAPI.getAchievements(gameId, platformId)
      return response.data as { achievements: Achievement[]; message?: string }
    },
  })

  const toggleMutation = useMutation({
    mutationFn: ({
      achievementId,
      completed,
    }: {
      achievementId: number
      completed: boolean
    }) => gamesAPI.updateAchievement(gameId, platformId, achievementId, completed),
    onMutate: async ({ achievementId, completed }) => {
      await queryClient.cancelQueries({ queryKey: ['achievements', gameId, platformId] })
      const previousData = queryClient.getQueryData(['achievements', gameId, platformId])

      queryClient.setQueryData(
        ['achievements', gameId, platformId],
        (old: { achievements: Achievement[] } | undefined) => {
          if (!old) return old
          return {
            ...old,
            achievements: old.achievements.map((ach) =>
              ach.rawg_achievement_id === achievementId
                ? {
                    ...ach,
                    completed,
                    completed_at: completed ? new Date().toISOString() : null,
                  }
                : ach
            ),
          }
        }
      )

      return { previousData }
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['achievements', gameId, platformId], context.previousData)
      }
      showToast('Failed to update achievement', 'error')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['achievements', gameId, platformId] })
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-400">Loading achievements...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-400 py-4">Failed to load achievements</div>
    )
  }

  const achievements = data?.achievements || []

  if (achievements.length === 0) {
    return (
      <div className="text-gray-400 py-4">
        {data?.message || 'No achievements available for this game'}
      </div>
    )
  }

  const completedCount = achievements.filter((a) => a.completed).length
  const totalCount = achievements.length
  const completionPercent = Math.round((completedCount / totalCount) * 100)

  const filteredAchievements = achievements.filter((ach) => {
    if (filter === 'completed') return ach.completed
    if (filter === 'incomplete') return !ach.completed
    return true
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-400">Progress</div>
          <div className="text-2xl font-bold text-white">
            {completedCount} / {totalCount}
          </div>
        </div>
        <div className="w-32">
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div
              className="bg-primary-green h-3 rounded-full transition-all"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
          <div className="text-sm text-gray-400 mt-1 text-right">
            {completionPercent}%
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {(['all', 'incomplete', 'completed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-lg text-sm transition-all ${
              filter === f
                ? 'bg-primary-purple text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {f === 'all'
              ? `All (${totalCount})`
              : f === 'completed'
                ? `Completed (${completedCount})`
                : `Incomplete (${totalCount - completedCount})`}
          </button>
        ))}
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredAchievements.map((ach) => (
          <div
            key={ach.rawg_achievement_id}
            className={`flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer ${
              ach.completed
                ? 'bg-primary-green/10 border border-primary-green/30'
                : 'bg-gray-800/50 border border-gray-700 hover:border-gray-600'
            }`}
            onClick={() =>
              toggleMutation.mutate({
                achievementId: ach.rawg_achievement_id,
                completed: !ach.completed,
              })
            }
          >
            {ach.image_url ? (
              <img
                src={ach.image_url}
                alt=""
                className={`w-12 h-12 rounded ${ach.completed ? '' : 'opacity-50 grayscale'}`}
              />
            ) : (
              <div
                className={`w-12 h-12 rounded bg-gray-700 flex items-center justify-center ${
                  ach.completed ? '' : 'opacity-50'
                }`}
              >
                <span className="text-gray-500 text-xl">?</span>
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div
                className={`font-medium truncate ${ach.completed ? 'text-primary-green' : 'text-white'}`}
              >
                {ach.name}
              </div>
              {ach.description && (
                <div className="text-sm text-gray-400 truncate">
                  {ach.description}
                </div>
              )}
              <div className="flex items-center gap-2 mt-1">
                {ach.rarity_percent !== null && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      ach.rarity_percent < 10
                        ? 'bg-primary-yellow/20 text-primary-yellow'
                        : ach.rarity_percent < 25
                          ? 'bg-primary-purple/20 text-primary-purple'
                          : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {ach.rarity_percent.toFixed(1)}% of players
                  </span>
                )}
                {ach.completed_at && (
                  <span className="text-xs text-gray-500">
                    Completed {new Date(ach.completed_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            <div
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                ach.completed
                  ? 'bg-primary-green border-primary-green text-white'
                  : 'border-gray-600 text-transparent hover:border-gray-400'
              }`}
            >
              <svg
                className="w-4 h-4"
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
  )
}
