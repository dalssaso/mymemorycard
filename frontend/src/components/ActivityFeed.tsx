import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { getPlatformColor } from '@/components/PlatformIcon'
import type { ActivityFeedResponse } from '@/lib/api'
import { statsAPI } from '@/lib/api'

export interface FeedItem {
  type: 'session' | 'completion' | 'achievement'
  id: string
  game_id: string
  game_name: string
  platform_name: string
  timestamp: string
  duration_minutes?: number | null
  percentage?: number
  completion_type?: 'main' | 'dlc' | 'full' | 'completionist'
  achievement_name?: string
  rarity_percent?: number | null
}

interface ActivityFeedProps {
  limit?: number
  desktopLimit?: number
  mobileLimit?: number
  maxHeightClassName?: string
  showMoreHref?: string
  mobileShowMoreThreshold?: number
  wrapperClassName?: string
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
}

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

function formatCompletionTypeLabel(type?: FeedItem['completion_type']): string {
  if (type === 'dlc') return 'DLC'
  if (type === 'full') return 'Full'
  if (type === 'completionist') return 'Completionist'
  return 'Main'
}

function withHexAlpha(color: string, alphaHex: string): string {
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) return color
  return `${color}${alphaHex}`
}

interface ActivityFeedListProps {
  feed: FeedItem[]
  className?: string
  containerRef?: RefObject<HTMLDivElement>
}

export function ActivityFeedList({ feed, className, containerRef }: ActivityFeedListProps) {
  return (
    <div ref={containerRef} className={className}>
      {feed.map((item) => (
        <Link
          key={`${item.type}-${item.id}`}
          to="/library/$id"
          params={{ id: item.game_id }}
          hash={item.type === 'session' ? 'sessions' : item.type === 'achievement' ? 'achievements' : 'stats'}
          className="flex gap-2 px-2 py-1.5 bg-ctp-surface0/50 rounded-lg hover:bg-ctp-surface0 transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ctp-teal focus-visible:ring-offset-2 focus-visible:ring-offset-ctp-base"
        >
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              item.type === 'session'
                ? 'bg-ctp-teal/20 text-ctp-teal'
                : item.type === 'achievement'
                  ? 'bg-yellow-400/20 text-yellow-400'
                  : 'bg-ctp-green/20 text-ctp-green'
            }`}
          >
            {item.type === 'session' ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
              </svg>
            ) : item.type === 'achievement' ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-2.999 0" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs text-ctp-text font-medium truncate group-hover:text-ctp-teal transition-colors leading-4">
                  {item.game_name}
                </p>
                <p className="text-[11px] text-ctp-subtext0 leading-4">
                  {item.type === 'session' ? (
                    item.duration_minutes ? (
                      <>
                        Played for{' '}
                        <span className="text-ctp-teal">
                          {formatDuration(item.duration_minutes)}
                        </span>
                      </>
                    ) : (
                      <span className="text-ctp-overlay1">Session logged</span>
                    )
                  ) : item.type === 'achievement' ? (
                    <>
                      Unlocked{' '}
                      <span className="inline-flex items-center rounded border border-ctp-yellow/40 bg-ctp-yellow/20 px-1.5 py-0.5 text-ctp-yellow font-medium">
                        {item.achievement_name}
                      </span>
                      {item.rarity_percent !== null && item.rarity_percent !== undefined && (
                        <span className={`ml-1 inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold ${
                          item.rarity_percent < 10
                            ? 'border-ctp-yellow/40 bg-ctp-yellow/20 text-ctp-yellow'
                            : item.rarity_percent < 25
                              ? 'border-ctp-mauve/40 bg-ctp-mauve/20 text-ctp-mauve'
                              : 'border-ctp-surface2 bg-ctp-surface1 text-ctp-subtext0'
                        }`}>
                          {item.rarity_percent.toFixed(1)}%
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      {formatCompletionTypeLabel(item.completion_type)} progress updated to{' '}
                      <span className="inline-flex items-center rounded border border-ctp-green/40 bg-ctp-green/20 px-1.5 py-0.5 text-ctp-green font-medium">
                        {item.percentage}%
                      </span>
                    </>
                  )}
                </p>
              </div>
              <span className="text-[10px] text-ctp-overlay1 whitespace-nowrap">
                {formatRelativeTime(new Date(item.timestamp))}
              </span>
            </div>
            <p className="mt-0.5">
              <span
                className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold text-white"
                style={{ backgroundColor: withHexAlpha(getPlatformColor(item.platform_name), 'CC') }}
              >
                {item.platform_name}
              </span>
            </p>
          </div>
        </Link>
      ))}
    </div>
  )
}

export function ActivityFeed({
  limit = 10,
  desktopLimit,
  mobileLimit,
  maxHeightClassName,
  showMoreHref,
  mobileShowMoreThreshold = 5,
  wrapperClassName,
}: ActivityFeedProps) {
  const [isDesktop, setIsDesktop] = useState(true)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isOverflowing, setIsOverflowing] = useState(false)
  const effectiveLimit = isDesktop ? (desktopLimit ?? limit) : (mobileLimit ?? limit)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      setIsDesktop(true)
      return
    }

    const mediaQuery = window.matchMedia('(min-width: 1024px)')
    const update = () => setIsDesktop(mediaQuery.matches)
    update()
    mediaQuery.addEventListener('change', update)
    return () => mediaQuery.removeEventListener('change', update)
  }, [])

  const { data, isLoading } = useQuery({
    queryKey: ['activityFeed', effectiveLimit],
    queryFn: async () => {
      const response = await statsAPI.getActivityFeed(effectiveLimit)
      return response.data as ActivityFeedResponse<FeedItem>
    },
    refetchOnMount: 'always',
  })

  const feed = data?.feed || []
  const total = data?.total ?? feed.length

  useEffect(() => {
    if (!containerRef.current || !isDesktop) {
      setIsOverflowing(false)
      return
    }

    const element = containerRef.current
    const updateOverflow = () => {
      setIsOverflowing(element.scrollHeight > element.clientHeight + 1)
    }

    updateOverflow()

    if (typeof ResizeObserver === 'undefined') {
      updateOverflow()
      return
    }

    const observer = new ResizeObserver(updateOverflow)
    observer.observe(element)
    return () => observer.disconnect()
  }, [feed, isDesktop])

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse flex gap-3">
            <div className="w-10 h-10 bg-ctp-surface1 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-ctp-surface1 rounded w-3/4" />
              <div className="h-3 bg-ctp-surface1 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (feed.length === 0) {
    return (
      <div className="text-center py-8 text-ctp-overlay1">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-12 h-12 mx-auto mb-3 opacity-50"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
        <p>No recent activity</p>
        <p className="text-sm mt-1">Start tracking your play sessions to see activity here</p>
      </div>
    )
  }

  return (
    <div className={wrapperClassName}>
      <ActivityFeedList
        feed={feed}
        containerRef={containerRef}
        className={['space-y-3', maxHeightClassName].filter(Boolean).join(' ')}
      />
      {showMoreHref && (isDesktop ? isOverflowing : total > mobileShowMoreThreshold) && (
        <div className="mt-3">
          <Link
            to={showMoreHref}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-ctp-surface0 text-ctp-text rounded-lg hover:bg-ctp-surface1 transition-colors"
          >
            Show more activity
          </Link>
        </div>
      )}
    </div>
  )
}
