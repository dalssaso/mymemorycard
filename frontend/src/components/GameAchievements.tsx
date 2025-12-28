import { useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Checkbox, Input, ScrollFade } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import { completionLogsAPI, gamesAPI } from '@/lib/api'

interface Achievement {
  achievement_id: string
  source: 'rawg' | 'manual'
  name: string
  description: string | null
  image_url: string | null
  rarity_percent: number | null
  completed: boolean
  completed_at: string | null
  can_delete: boolean
}

interface GameAchievementsProps {
  gameId: string
  platformId: string
}

export function GameAchievements({ gameId, platformId }: GameAchievementsProps) {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const manualSwipeStartXRef = useRef(0)
  const manualSwipeStartYRef = useRef(0)
  const manualSwipeStartOffsetRef = useRef(0)
  const manualSwipeInProgressRef = useRef(false)
  const [filter, setFilter] = useState<'all' | 'completed' | 'incomplete'>('all')
  const [manualName, setManualName] = useState('')
  const [manualDescription, setManualDescription] = useState('')
  const [selectedManualIds, setSelectedManualIds] = useState<string[]>([])
  const [activeManualSwipeId, setActiveManualSwipeId] = useState<string | null>(null)
  const [activeManualSwipeOffset, setActiveManualSwipeOffset] = useState(0)
  const [swipedManualId, setSwipedManualId] = useState<string | null>(null)

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
      achievementId: string
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
              ach.achievement_id === achievementId
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
    onSuccess: async () => {
      try {
        await completionLogsAPI.recalculate(gameId, platformId)
        queryClient.invalidateQueries({ queryKey: ['completionLogs', gameId] })
        queryClient.invalidateQueries({ queryKey: ['game', gameId] })
        queryClient.invalidateQueries({ queryKey: ['games'] })
        queryClient.invalidateQueries({ queryKey: ['activityFeed'] })
        queryClient.invalidateQueries({ queryKey: ['achievementStats'] })
      } catch (error) {
        console.error('Failed to recalculate progress after achievement update:', error)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['achievements', gameId, platformId] })
    },
  })

  const createManualAchievementMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      gamesAPI.createManualAchievement(gameId, platformId, data),
    onSuccess: async () => {
      setManualName('')
      setManualDescription('')
      setSelectedManualIds([])
      try {
        await completionLogsAPI.recalculate(gameId, platformId)
        queryClient.invalidateQueries({ queryKey: ['completionLogs', gameId] })
        queryClient.invalidateQueries({ queryKey: ['achievementStats'] })
      } catch (error) {
        console.error('Failed to recalculate progress after achievement creation:', error)
      }
      queryClient.invalidateQueries({ queryKey: ['achievements', gameId, platformId] })
      showToast('Achievement added', 'success')
    },
    onError: () => {
      showToast('Failed to add achievement', 'error')
    },
  })

  const bulkDeleteManualMutation = useMutation({
    mutationFn: (achievementIds: string[]) =>
      gamesAPI.deleteManualAchievements(gameId, platformId, achievementIds),
    onSuccess: async () => {
      setSelectedManualIds([])
      try {
        await completionLogsAPI.recalculate(gameId, platformId)
        queryClient.invalidateQueries({ queryKey: ['completionLogs', gameId] })
        queryClient.invalidateQueries({ queryKey: ['achievementStats'] })
      } catch (error) {
        console.error('Failed to recalculate progress after achievement delete:', error)
      }
      queryClient.invalidateQueries({ queryKey: ['achievements', gameId, platformId] })
      showToast('Manual achievements deleted', 'success')
    },
    onError: () => {
      showToast('Failed to delete achievements', 'error')
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-ctp-subtext0">Loading achievements...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-ctp-red py-4">Failed to load achievements</div>
    )
  }

  const achievements = data?.achievements || []
  const manualAchievements = achievements.filter((ach) => ach.source === 'manual')
  const rawgAchievements = achievements.filter((ach) => ach.source === 'rawg')
  const maxSwipeOffset = 72

  const completedCount = achievements.filter((a) => a.completed).length
  const totalCount = achievements.length
  const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const filteredAchievements = achievements.filter((ach) => {
    if (filter === 'completed') return ach.completed
    if (filter === 'incomplete') return !ach.completed
    return true
  })
  const filteredManualAchievements = filteredAchievements.filter((ach) => ach.source === 'manual')
  const filteredRawgAchievements = filteredAchievements.filter((ach) => ach.source === 'rawg')

  const manualEmptyMessage =
    manualAchievements.length === 0
      ? 'No user added achievements yet'
      : 'No user added achievements match this filter'
  const rawgEmptyMessage =
    rawgAchievements.length === 0
      ? data?.message || 'No game achievements available for this game'
      : 'No game achievements match this filter'

  const toggleManualSelection = (achievementId: string) => {
    setSelectedManualIds((prev) =>
      prev.includes(achievementId)
        ? prev.filter((id) => id !== achievementId)
        : [...prev, achievementId]
    )
  }

  const canCreateManual = manualName.trim().length > 0 && !createManualAchievementMutation.isPending
  const canBulkDelete = selectedManualIds.length > 0 && !bulkDeleteManualMutation.isPending

  const handleManualPointerDown =
    (achievementId: string) => (event: PointerEvent<HTMLDivElement>) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return
      manualSwipeStartXRef.current = event.clientX
      manualSwipeStartYRef.current = event.clientY
      manualSwipeStartOffsetRef.current = swipedManualId === achievementId ? -maxSwipeOffset : 0
      manualSwipeInProgressRef.current = false
      setActiveManualSwipeId(achievementId)
      setActiveManualSwipeOffset(manualSwipeStartOffsetRef.current)
      if (swipedManualId && swipedManualId !== achievementId) {
        setSwipedManualId(null)
      }
      event.currentTarget.setPointerCapture(event.pointerId)
    }

  const handleManualPointerMove =
    (achievementId: string) => (event: PointerEvent<HTMLDivElement>) => {
      if (activeManualSwipeId !== achievementId) return
      const currentX = event.clientX
      const currentY = event.clientY
      const deltaX = currentX - manualSwipeStartXRef.current
      const deltaY = currentY - manualSwipeStartYRef.current
      if (Math.abs(deltaX) < 4 && Math.abs(deltaY) < 4) return
      if (Math.abs(deltaX) < Math.abs(deltaY)) return

      const nextOffset = Math.max(
        -maxSwipeOffset,
        Math.min(0, manualSwipeStartOffsetRef.current + deltaX)
      )
      setActiveManualSwipeOffset(nextOffset)
      manualSwipeInProgressRef.current = true
    }

  const handleManualPointerEnd =
    (achievementId: string) => (event: PointerEvent<HTMLDivElement>) => {
      if (activeManualSwipeId !== achievementId) return
      const shouldOpen = activeManualSwipeOffset <= -maxSwipeOffset / 2
      setSwipedManualId(shouldOpen ? achievementId : null)
      setActiveManualSwipeId(null)
      setActiveManualSwipeOffset(0)
      manualSwipeInProgressRef.current = false
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

  const handleManualAchievementClick = (achievement: Achievement) => {
    if (manualSwipeInProgressRef.current) {
      manualSwipeInProgressRef.current = false
      return
    }
    if (swipedManualId === achievement.achievement_id) {
      setSwipedManualId(null)
      return
    }
    toggleMutation.mutate({
      achievementId: achievement.achievement_id,
      completed: !achievement.completed,
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-ctp-subtext0">Progress</div>
          <div className="text-2xl font-bold text-ctp-text">
            {completedCount} / {totalCount}
          </div>
        </div>
        <div className="w-32">
          <div className="w-full bg-ctp-surface1 rounded-full h-3">
            <div
              className="bg-ctp-green h-3 rounded-full transition-all"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
          <div className="text-sm text-ctp-subtext0 mt-1 text-right">
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
                ? 'bg-ctp-mauve text-ctp-base'
                : 'bg-ctp-surface0 text-ctp-subtext0 hover:bg-ctp-surface1'
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

      <div className="bg-ctp-surface0/60 border border-ctp-surface1/60 rounded-lg p-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-semibold text-ctp-text">User Added Achievements</div>
            <div className="text-xs text-ctp-overlay1">
              Add custom achievements for this platform and manage them in bulk.
            </div>
          </div>
          {manualAchievements.length > 0 && (
            <div className="text-xs text-ctp-subtext0">
              {manualAchievements.length} user added achievement{manualAchievements.length === 1 ? '' : 's'}
            </div>
          )}
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <Input
            label="Achievement name"
            placeholder="Enter a name"
            value={manualName}
            onChange={(event) => setManualName(event.target.value)}
          />
          <div className="w-full">
            <label className="block text-sm font-medium text-ctp-subtext0 mb-2">
              Description (optional)
            </label>
            <textarea
              className="w-full bg-ctp-mantle border border-ctp-surface1 rounded-lg px-3 py-2 text-ctp-text placeholder-ctp-overlay1 focus:outline-none focus:border-ctp-mauve transition-colors min-h-[42px]"
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
            variant="danger"
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
          <div className="text-ctp-subtext0 py-4">{manualEmptyMessage}</div>
        ) : (
          <div className="mt-3 space-y-2">
            {filteredManualAchievements.map((ach) => {
              const isSwiped = swipedManualId === ach.achievement_id
              const isDragging = activeManualSwipeId === ach.achievement_id
              const translateX = isDragging
                ? activeManualSwipeOffset
                : isSwiped
                  ? -maxSwipeOffset
                  : 0

              const showSwipeAction = isSwiped || isDragging

              return (
                <div key={`manual-${ach.achievement_id}`} className="relative overflow-hidden rounded-lg">
                  <div
                    className={`absolute inset-y-0 right-0 w-[72px] bg-ctp-red md:hidden flex items-center justify-center transition-opacity ${
                      showSwipeAction ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                  >
                    <button
                      onClick={(event) => {
                        event.stopPropagation()
                        bulkDeleteManualMutation.mutate([ach.achievement_id])
                        setSwipedManualId(null)
                      }}
                      disabled={bulkDeleteManualMutation.isPending}
                      className="text-ctp-base text-sm font-semibold disabled:opacity-60"
                      aria-label="Delete achievement"
                    >
                      Delete
                    </button>
                  </div>
                  <div
                    className={`flex items-center gap-3 w-full p-3 rounded-lg transition-transform cursor-pointer touch-pan-y ${
                      ach.completed
                        ? 'bg-ctp-green/10 border border-ctp-green/30'
                        : 'bg-ctp-surface0/50 border border-ctp-surface1 hover:border-ctp-surface2'
                    } ${isDragging ? '' : 'duration-200 ease-out'}`}
                    style={{ transform: `translateX(${translateX}px)` }}
                    onClick={() => handleManualAchievementClick(ach)}
                    onPointerDown={handleManualPointerDown(ach.achievement_id)}
                    onPointerMove={handleManualPointerMove(ach.achievement_id)}
                    onPointerUp={handleManualPointerEnd(ach.achievement_id)}
                    onPointerCancel={handleManualPointerEnd(ach.achievement_id)}
                  >
                    <Checkbox
                      checked={selectedManualIds.includes(ach.achievement_id)}
                      onChange={() => toggleManualSelection(ach.achievement_id)}
                      onClick={(event) => event.stopPropagation()}
                      aria-label="Select manual achievement for deletion"
                    />

                    <div
                      className={`w-12 h-12 rounded bg-ctp-yellow/20 text-ctp-yellow flex items-center justify-center ${
                        ach.completed ? '' : 'opacity-60'
                      }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-6 h-6"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-2.999 0"
                        />
                      </svg>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div
                        className={`font-medium truncate ${
                          ach.completed ? 'text-ctp-green' : 'text-ctp-text'
                        }`}
                      >
                        {ach.name}
                      </div>
                      {ach.description && (
                        <div className="text-sm text-ctp-subtext0 truncate">
                          {ach.description}
                        </div>
                      )}
                      {ach.completed_at && (
                        <div className="text-xs text-ctp-overlay1 mt-1">
                          Completed {new Date(ach.completed_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        ach.completed
                          ? 'bg-ctp-green border-ctp-green text-ctp-base'
                          : 'border-ctp-surface2 text-transparent hover:border-ctp-overlay1'
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
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="bg-ctp-surface0/60 border border-ctp-surface1/60 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-ctp-text">Game Achievements</div>
          {rawgAchievements.length > 0 && (
            <div className="text-xs text-ctp-subtext0">
              {rawgAchievements.length} game achievement{rawgAchievements.length === 1 ? '' : 's'}
            </div>
          )}
        </div>
        {filteredRawgAchievements.length === 0 ? (
          <div className="text-ctp-subtext0 py-4">{rawgEmptyMessage}</div>
        ) : (
          <ScrollFade axis="y" className="space-y-2 max-h-96 overflow-y-auto mt-3">
            {filteredRawgAchievements.map((ach) => (
              <div
                key={`rawg-${ach.achievement_id}`}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer ${
                  ach.completed
                    ? 'bg-ctp-green/10 border border-ctp-green/30'
                    : 'bg-ctp-surface0/50 border border-ctp-surface1 hover:border-ctp-surface2'
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
                    className={`w-12 h-12 rounded ${ach.completed ? '' : 'opacity-50 grayscale'}`}
                  />
                ) : (
                  <div
                    className={`w-12 h-12 rounded bg-ctp-surface1 flex items-center justify-center ${
                      ach.completed ? '' : 'opacity-50'
                    }`}
                  >
                    <span className="text-ctp-overlay1 text-xl">?</span>
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div
                    className={`font-medium truncate ${ach.completed ? 'text-ctp-green' : 'text-ctp-text'}`}
                  >
                    {ach.name}
                  </div>
                  {ach.description && (
                    <div className="text-sm text-ctp-subtext0 truncate">
                      {ach.description}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    {ach.rarity_percent !== null && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          ach.rarity_percent < 10
                            ? 'bg-ctp-yellow/20 text-ctp-yellow'
                            : ach.rarity_percent < 25
                              ? 'bg-ctp-mauve/20 text-ctp-mauve'
                              : 'bg-ctp-surface1 text-ctp-subtext0'
                        }`}
                      >
                        {ach.rarity_percent.toFixed(1)}% of players
                      </span>
                    )}
                    {ach.completed_at && (
                      <span className="text-xs text-ctp-overlay1">
                        Completed {new Date(ach.completed_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    ach.completed
                      ? 'bg-ctp-green border-ctp-green text-ctp-base'
                      : 'border-ctp-surface2 text-transparent hover:border-ctp-overlay1'
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
          </ScrollFade>
        )}
      </div>
    </div>
  )
}
