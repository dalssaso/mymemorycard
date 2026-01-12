import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo } from "react";
import { ActivityFeedList } from "@/components/ActivityFeed";
import { BackButton, PageLayout } from "@/components/layout";
import { DashboardSidebar } from "@/components/sidebar";
import { Button, Card } from "@/components/ui";
import { useActivityFeed } from "@/hooks/useActivityFeed";
import { useGameSummaries } from "@/hooks/useGameSummaries";
import type { FeedItem } from "@/components/ActivityFeed";
import type { ActivitySearchParams } from "@/routes/activity";

const PAGE_SIZE = 20;

export function Activity() {
  const navigate = useNavigate();
  const searchParams = useSearch({ from: "/activity" }) as ActivitySearchParams;
  const currentPage = searchParams.page || 1;

  const { data: gamesData } = useGameSummaries();

  const { data, isLoading } = useActivityFeed<FeedItem>({
    page: currentPage,
    pageSize: PAGE_SIZE,
  });

  const feed = data?.feed || [];
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageStart = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(currentPage * PAGE_SIZE, total);

  const canGoBack = currentPage > 1;
  const canGoForward = currentPage < totalPages;

  const games = useMemo(() => gamesData?.games || [], [gamesData?.games]);

  const goToPage = useCallback(
    (page: number) => {
      navigate({ to: "/activity", search: { page } });
    },
    [navigate]
  );

  useEffect(() => {
    if (total > 0 && currentPage > totalPages) {
      goToPage(totalPages);
    }
  }, [currentPage, total, totalPages, goToPage]);

  return (
    <PageLayout sidebar={<DashboardSidebar games={games} />} customCollapsed={true}>
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center gap-3">
          <BackButton
            iconOnly={true}
            className="text-text-secondary hover:bg-surface hover:text-text-primary rounded-lg p-2 transition-all md:hidden"
          />
          <div>
            <h1 className="text-text-primary text-3xl font-bold">Activity</h1>
            <p className="text-text-muted text-sm">
              {total === 0 ? "No activity yet" : `Showing ${pageStart}-${pageEnd} of ${total}`}
            </p>
          </div>
        </div>

        <Card padded={true}>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex animate-pulse gap-3">
                  <div className="bg-elevated h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="bg-elevated h-4 w-3/4 rounded" />
                    <div className="bg-elevated h-3 w-1/2 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : feed.length === 0 ? (
            <div className="text-text-muted py-10 text-center">
              <p>No recent activity</p>
              <p className="mt-1 text-sm">
                Start tracking sessions, achievements, or completion updates
              </p>
              <div className="mt-4">
                <Link to="/library" className="text-accent hover:text-accent text-sm">
                  Go to library
                </Link>
              </div>
            </div>
          ) : (
            <ActivityFeedList feed={feed} className="space-y-3" />
          )}
        </Card>

        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => goToPage(currentPage - 1)}
              disabled={!canGoBack}
            >
              Previous
            </Button>
            <div className="text-text-muted text-sm">
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
  );
}
