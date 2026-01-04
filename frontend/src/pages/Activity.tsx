import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo } from 'react'
import { ActivityFeedList } from '@/components/ActivityFeed'
import { BackButton, PageLayout } from '@/components/layout'
import { DashboardSidebar } from '@/components/sidebar'
import { Button, Card } from '@/components/ui'
import { gamesAPI, statsAPI } from '@/lib/api'
import type { FeedItem } from '@/components/ActivityFeed'
import type { ActivityFeedResponse } from '@/lib/api'
import type { ActivitySearchParams } from '@/routes/activity'

const PAGE_SIZE = 20

interface Game {
  id: string
  name: string
  cover_art_url: string | null
  last_played: string | null
  status: string
  is_favorite?: boolean
}

export function Activity() {
  const navigate = useNavigate()
  const searchParams = useSearch({ from: '/activity' }) as ActivitySearchParams
  const currentPage = searchParams.page || 1

  const { data: gamesData } = useQuery({
    queryKey: ['games'],
    queryFn: async () => {
      const response = await gamesAPI.getAll()
      return response.data as { games: Game[] }
    },
  })

  const { data, isLoading } = useQuery({
    queryKey: ['activityFeed', 'page', currentPage, PAGE_SIZE],
    queryFn: async () => {
      const response = await statsAPI.getActivityFeed({ page: currentPage, pageSize: PAGE_SIZE })
      return response.data as ActivityFeedResponse<FeedItem>
    },
  })

  const feed = data?.feed || []
  const total = data?.total || 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const pageStart = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const pageEnd = Math.min(currentPage * PAGE_SIZE, total)

  const canGoBack = currentPage > 1
  const canGoForward = currentPage < totalPages

  const games = useMemo(() => gamesData?.games || [], [gamesData?.games])

  const goToPage = useCallback(
    (page: number) => {
      navigate({ to: '/activity', search: { page } })
    },
    [navigate]
  )

  useEffect(() => {
    if (total > 0 && currentPage > totalPages) {
      goToPage(totalPages)
    }
  }, [currentPage, total, totalPages, goToPage])

  return (
    <PageLayout sidebar={<DashboardSidebar games={games} />} customCollapsed={true}>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <BackButton
            iconOnly={true}
            className="md:hidden p-2 rounded-lg text-ctp-subtext0 hover:bg-ctp-surface0 hover:text-ctp-text transition-all"
          />
          <div>
            <h1 className="text-3xl font-bold text-ctp-text">Activity</h1>
            <p className="text-sm text-ctp-subtext1">
              {total === 0 ? 'No activity yet' : `Showing ${pageStart}-${pageEnd} of ${total}`}
            </p>
          </div>
        </div>

        <Card>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse flex gap-3">
                  <div className="w-10 h-10 bg-ctp-surface1 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-ctp-surface1 rounded w-3/4" />
                    <div className="h-3 bg-ctp-surface1 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : feed.length === 0 ? (
            <div className="text-center py-10 text-ctp-overlay1">
              <p>No recent activity</p>
              <p className="text-sm mt-1">
                Start tracking sessions, achievements, or completion updates
              </p>
              <div className="mt-4">
                <Link to="/library" className="text-sm text-ctp-teal hover:text-ctp-mauve">
                  Go to library
                </Link>
              </div>
            </div>
          ) : (
            <ActivityFeedList feed={feed} className="space-y-3" />
          )}
        </Card>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => goToPage(currentPage - 1)}
              disabled={!canGoBack}
            >
              Previous
            </Button>
            <div className="text-sm text-ctp-subtext1">
              Page {currentPage} of {totalPages}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => goToPage(currentPage + 1)}
              disabled={!canGoForward}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </PageLayout>
  )
}
