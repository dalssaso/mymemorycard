import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { BackButton, PageLayout } from "@/components/layout";
import { FranchisesSidebar } from "@/components/sidebar";
import { Card, Button } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { franchisesAPI, type FranchiseSummary } from "@/lib/api";

export function Franchises() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["franchises"],
    queryFn: async () => {
      const response = await franchisesAPI.getAll();
      return response.data;
    },
  });

  const syncMutation = useMutation({
    mutationFn: () => franchisesAPI.sync(),
    onSuccess: (response) => {
      const { games_checked, games_updated } = response.data;
      queryClient.invalidateQueries({ queryKey: ["franchises"] });
      showToast(`Synced ${games_updated} of ${games_checked} games`, "success");
    },
    onError: () => {
      showToast("Failed to sync franchises", "error");
    },
  });

  const franchises = data?.franchises || [];

  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-text-secondary">Loading...</div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      sidebar={
        <FranchisesSidebar
          onSync={() => syncMutation.mutate()}
          isSyncing={syncMutation.isPending}
        />
      }
      customCollapsed={true}
    >
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <BackButton
                iconOnly={true}
                className="text-text-secondary hover:bg-surface hover:text-text-primary rounded-lg p-2 transition-all md:hidden"
              />
              <h1 className="text-text-primary text-4xl font-bold">Franchises</h1>
            </div>
            <p className="text-text-secondary mt-1">Game series in your library</p>
          </div>
          <Button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            variant="secondary"
          >
            {syncMutation.isPending ? "Syncing..." : "Sync Franchises"}
          </Button>
        </div>

        {franchises.length === 0 ? (
          <Card className="px-6 py-10" padded={true}>
            <div className="grid gap-6 text-center md:grid-cols-[2fr_1fr] md:text-left">
              <div>
                <h2 className="text-text-primary mb-3 text-2xl font-bold">No Franchises Yet</h2>
                <p className="text-text-secondary mb-6">
                  Add games from a series or sync to detect franchises automatically.
                </p>
                <Button
                  onClick={() => syncMutation.mutate()}
                  disabled={syncMutation.isPending}
                  variant="secondary"
                >
                  {syncMutation.isPending ? "Syncing..." : "Sync Franchises"}
                </Button>
              </div>
              <div className="bg-surface/40 border-border rounded-lg border p-4">
                <h3 className="text-text-primary text-sm font-semibold">Tips</h3>
                <div className="text-text-secondary mt-2 space-y-2 text-sm">
                  <p>Import more games to enrich series data.</p>
                  <p>Use search to jump to a specific series.</p>
                  <p>Add missing entries from a franchise page.</p>
                </div>
              </div>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {franchises.map((franchise: FranchiseSummary) => (
              <Link
                key={franchise.series_name}
                to="/franchises/$seriesName"
                params={{ seriesName: franchise.series_name }}
                className="group focus-visible:outline-none"
              >
                <div className="bg-surface group-focus-visible:ring-accent group-focus-visible:ring-offset-base relative mb-2 aspect-[3/4] overflow-hidden rounded-lg ring-0 ring-transparent transition-shadow group-focus-visible:ring-2 group-focus-visible:ring-offset-2">
                  {franchise.cover_art_url ? (
                    <img
                      src={franchise.cover_art_url}
                      alt={franchise.series_name}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="text-text-muted flex h-full w-full items-center justify-center">
                      <span className="text-sm">No Cover</span>
                    </div>
                  )}
                  <div className="from-base/80 via-base/30 dark:from-base/90 dark:via-base/50 absolute inset-0 bg-gradient-to-t to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <div className="bg-base/85 dark:bg-base/70 inline-flex max-w-full flex-col gap-1 rounded-md px-2 py-1 shadow-sm backdrop-blur">
                      <p className="text-text-primary truncate text-sm font-semibold sm:text-base">
                        {franchise.series_name}
                      </p>
                      <p className="text-accent text-xs sm:text-sm">
                        {franchise.game_count} {franchise.game_count === 1 ? "game" : "games"}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
