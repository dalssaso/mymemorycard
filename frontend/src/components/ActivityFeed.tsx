import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { statsAPI } from '@/lib/api'

interface FeedItem {
  type: 'session' | 'completion'
  id: string
  game_id: string
  game_name: string
  platform_name: string
  timestamp: string
  duration_minutes?: number | null
  percentage?: number
}

interface ActivityFeedProps {
  limit?: number
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

export function ActivityFeed({ limit = 10 }: ActivityFeedProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['activityFeed', limit],
    queryFn: async () => {
      const response = await statsAPI.getActivityFeed(limit)
      return response.data as { feed: FeedItem[] }
    },
  })

  const feed = data?.feed || []

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse flex gap-3">
            <div className="w-10 h-10 bg-gray-700 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-700 rounded w-3/4" />
              <div className="h-3 bg-gray-700 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (feed.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
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
    <div className="space-y-3">
      {feed.map((item) => (
        <Link
          key={`${item.type}-${item.id}`}
          to="/library/$id"
          params={{ id: item.game_id }}
          className="flex gap-3 p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors group"
        >
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              item.type === 'session'
                ? 'bg-primary-cyan/20 text-primary-cyan'
                : 'bg-primary-green/20 text-primary-green'
            }`}
          >
            {item.type === 'session' ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-white font-medium truncate group-hover:text-primary-cyan transition-colors">
                  {item.game_name}
                </p>
                <p className="text-sm text-gray-400">
                  {item.type === 'session' ? (
                    item.duration_minutes ? (
                      <>
                        Played for{' '}
                        <span className="text-primary-cyan">
                          {formatDuration(item.duration_minutes)}
                        </span>
                      </>
                    ) : (
                      <span className="text-gray-500">Session logged</span>
                    )
                  ) : (
                    <>
                      Progress updated to{' '}
                      <span className="text-primary-green">{item.percentage}%</span>
                    </>
                  )}
                </p>
              </div>
              <span className="text-xs text-gray-500 whitespace-nowrap">
                {formatRelativeTime(new Date(item.timestamp))}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">{item.platform_name}</p>
          </div>
        </Link>
      ))}
    </div>
  )
}
