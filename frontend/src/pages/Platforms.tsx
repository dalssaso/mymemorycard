import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { PageLayout } from '@/components/layout'
import { useToast } from '@/components/ui/Toast'
import { CustomPlatformModal } from '@/components/CustomPlatformModal'
import { PlatformsSidebar } from '@/components/sidebar'
import { platformsAPI, rawgPlatformsAPI, userPlatformsAPI } from '@/lib/api'

interface Platform {
  id: string
  name: string
  display_name: string
  platform_type: string | null
}

interface UserPlatform {
  id: string
  platform_id: string
  username: string | null
  icon_url: string | null
  profile_url: string | null
  notes: string | null
  created_at: string
  name: string
  display_name: string
  platform_type: string | null
}

function PlatformIcon({ name, iconUrl }: { name: string; iconUrl?: string | null }) {
  if (iconUrl) {
    return (
      <img
        src={iconUrl}
        alt={name}
        className="w-full h-full object-cover"
      />
    )
  }

  const initial = name.trim().charAt(0).toUpperCase() || 'P'

  return (
    <div
      className={[
        'w-full h-full flex items-center justify-center',
        'bg-gradient-to-br from-primary-cyan/30 to-primary-purple/40',
        'text-white font-semibold',
      ].join(' ')}
    >
      {initial}
    </div>
  )
}

export function Platforms() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPlatformIds, setSelectedPlatformIds] = useState<string[]>([])
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const { data: rawgPlatformsData, isLoading: isLoadingPlatforms } = useQuery({
    queryKey: ['rawg-platforms'],
    queryFn: async () => {
      const response = await rawgPlatformsAPI.getAll()
      return response.data as { platforms: Platform[] }
    },
  })

  const { data: userPlatformsData } = useQuery({
    queryKey: ['user-platforms'],
    queryFn: async () => {
      const response = await userPlatformsAPI.getAll()
      return response.data as { platforms: UserPlatform[] }
    },
  })

  const userPlatforms = userPlatformsData?.platforms || []
  const existingPlatformIds = useMemo(
    () => new Set(userPlatforms.map((platform) => platform.platform_id)),
    [userPlatforms]
  )

  const addPlatformsMutation = useMutation({
    mutationFn: async (platformIds: string[]) => {
      await Promise.all(
        platformIds.map((platformId) => userPlatformsAPI.add({ platformId }))
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-platforms'] })
      setSelectedPlatformIds([])
      showToast('Platforms added', 'success')
    },
    onError: () => {
      showToast('Failed to add platforms', 'error')
    },
  })

  const customPlatformMutation = useMutation({
    mutationFn: async (data: { displayName: string; platformType?: string | null }) => {
      const response = await platformsAPI.create(data)
      const platform = response.data as { platform: Platform }
      await userPlatformsAPI.add({ platformId: platform.platform.id })
      return platform.platform
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rawg-platforms'] })
      queryClient.invalidateQueries({ queryKey: ['user-platforms'] })
      setIsCustomModalOpen(false)
      showToast('Custom platform added', 'success')
    },
    onError: () => {
      showToast('Failed to add custom platform', 'error')
    },
  })

  const rawgPlatforms = rawgPlatformsData?.platforms || []
  const filteredPlatforms = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    const filtered = rawgPlatforms.filter((platform) => {
      if (!term) return true
      return (
        platform.display_name.toLowerCase().includes(term) ||
        platform.name.toLowerCase().includes(term)
      )
    })

    return filtered.sort((a, b) => {
      const aLocked = existingPlatformIds.has(a.id)
      const bLocked = existingPlatformIds.has(b.id)
      if (aLocked !== bLocked) {
        return aLocked ? -1 : 1
      }

      const aName = a.display_name || a.name
      const bName = b.display_name || b.name
      return aName.localeCompare(bName)
    })
  }, [existingPlatformIds, rawgPlatforms, searchTerm])

  const handleToggle = (platformId: string) => {
    if (existingPlatformIds.has(platformId)) {
      return
    }
    setSelectedPlatformIds((prev) =>
      prev.includes(platformId)
        ? prev.filter((id) => id !== platformId)
        : [...prev, platformId]
    )
  }

  const handleAddSelected = () => {
    const newPlatformIds = selectedPlatformIds.filter(
      (id) => !existingPlatformIds.has(id)
    )

    if (newPlatformIds.length === 0) {
      showToast('No new platforms selected', 'warning')
      return
    }

    addPlatformsMutation.mutate(newPlatformIds)
  }

  const sidebarContent = (
    <PlatformsSidebar
      platformCount={userPlatforms.length}
      onAddCustomPlatform={() => setIsCustomModalOpen(true)}
    />
  )

  return (
    <PageLayout sidebar={sidebarContent}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white">Platforms</h1>
            <p className="text-gray-400 mt-1">
              Keep your platform list current for accurate imports.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsCustomModalOpen(true)}
              className="btn btn-secondary"
            >
              Add Custom Platform
            </button>
            <Link to="/import" className="btn btn-primary">
              Import Games
            </Link>
          </div>
        </div>

        {userPlatforms.length === 0 ? (
          <div className="card mb-8">
            <p className="text-gray-400 text-center py-8">
              No platforms saved yet. Add your first platform to get started.
            </p>
          </div>
        ) : (
          <div
            className={[
              'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
              'gap-4 mb-10',
            ].join(' ')}
          >
            {userPlatforms.map((platform) => (
              <div key={platform.id} className="group">
                <Link
                  to="/platforms/$id"
                  params={{ id: platform.id }}
                >
                  <div
                    className={[
                      'aspect-square rounded-lg overflow-hidden bg-gray-800',
                      'mb-2 relative',
                    ].join(' ')}
                  >
                    <PlatformIcon
                      name={platform.display_name}
                      iconUrl={platform.icon_url}
                    />
                    <div
                      className={[
                        'absolute inset-0 bg-gradient-to-t',
                        'from-black/80 via-transparent to-transparent',
                      ].join(' ')}
                    />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-white font-medium truncate">
                        {platform.display_name}
                      </p>
                      <p className="text-sm text-primary-cyan truncate">
                        {platform.username || 'No username set'}
                      </p>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}

        <div className="card mb-6">
          <label className="block text-sm font-medium mb-2">Search platforms</label>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="input w-full"
            placeholder="Search by name"
          />
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Add Platforms</h2>
            <span className="text-sm text-gray-400">
              {selectedPlatformIds.length} selected
            </span>
          </div>

          {isLoadingPlatforms ? (
            <div className="text-gray-400">Loading platforms...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredPlatforms.map((platform) => {
                const isSelected = selectedPlatformIds.includes(platform.id)
                const isLocked = existingPlatformIds.has(platform.id)
                return (
                  <button
                    key={platform.id}
                    type="button"
                    onClick={() => handleToggle(platform.id)}
                    disabled={isLocked}
                    className={`text-left border rounded-lg px-4 py-3 transition-colors ${
                      isSelected
                        ? 'border-primary-cyan bg-primary-cyan/10'
                        : 'border-gray-800 bg-gray-900/50 hover:border-gray-700'
                    } disabled:cursor-not-allowed`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium text-white">
                        {platform.display_name}
                      </div>
                      {isLocked && (
                        <span className="text-xs text-primary-cyan">Saved</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {platform.platform_type || 'platform'}
                    </div>
                  </button>
                )
              })}

              {!isLoadingPlatforms && filteredPlatforms.length === 0 && (
                <p className="text-gray-400">No platforms match your search.</p>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={handleAddSelected}
            disabled={addPlatformsMutation.isPending}
            className="btn btn-primary"
          >
            {addPlatformsMutation.isPending ? 'Saving...' : 'Add Selected Platforms'}
          </button>
        </div>
      </div>

      <CustomPlatformModal
        isOpen={isCustomModalOpen}
        isSubmitting={customPlatformMutation.isPending}
        onClose={() => setIsCustomModalOpen(false)}
        onSubmit={(data) => customPlatformMutation.mutate(data)}
      />
    </PageLayout>
  )
}
