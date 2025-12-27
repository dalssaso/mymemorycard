import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { franchisesAPI, FranchiseSummary } from '@/lib/api'
import { PageLayout } from '@/components/layout'
import { Card, Button } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import { FranchisesSidebar } from '@/components/sidebar'

export function Franchises() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const { data, isLoading } = useQuery({
    queryKey: ['franchises'],
    queryFn: async () => {
      const response = await franchisesAPI.getAll()
      return response.data
    },
  })

  const syncMutation = useMutation({
    mutationFn: () => franchisesAPI.sync(),
    onSuccess: (response) => {
      const { games_checked, games_updated } = response.data
      queryClient.invalidateQueries({ queryKey: ['franchises'] })
      showToast(`Synced ${games_updated} of ${games_checked} games`, 'success')
    },
    onError: () => {
      showToast('Failed to sync franchises', 'error')
    },
  })

  const franchises = data?.franchises || []

  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-gray-400">Loading...</div>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout
      sidebar={
        <FranchisesSidebar
          onSync={() => syncMutation.mutate()}
          isSyncing={syncMutation.isPending}
        />
      }
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white">Franchises</h1>
            <p className="text-gray-400 mt-1">
              Game series in your library
            </p>
          </div>
          <Button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            variant="secondary"
          >
            {syncMutation.isPending ? 'Syncing...' : 'Sync Franchises'}
          </Button>
        </div>

        {franchises.length === 0 ? (
          <Card>
            <p className="text-gray-400 text-center py-8">
              No franchises found. Add games that belong to a series, or click "Sync Franchises" to detect series for your existing games.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {franchises.map((franchise: FranchiseSummary) => (
              <Link
                key={franchise.series_name}
                to="/franchises/$seriesName"
                params={{ seriesName: franchise.series_name }}
                className="group focus-visible:outline-none"
              >
                <div className="aspect-[3/4] rounded-lg overflow-hidden bg-gray-800 mb-2 relative ring-0 ring-transparent transition-shadow group-focus-visible:ring-2 group-focus-visible:ring-primary-purple/60 group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-gray-950">
                  {franchise.cover_art_url ? (
                    <img
                      src={franchise.cover_art_url}
                      alt={franchise.series_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      <span className="text-sm">No Cover</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white font-medium truncate">
                      {franchise.series_name}
                    </p>
                    <p className="text-sm text-primary-cyan">
                      {franchise.game_count} {franchise.game_count === 1 ? 'game' : 'games'}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  )
}
