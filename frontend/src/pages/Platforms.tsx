import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { CustomPlatformModal } from '@/components/CustomPlatformModal'
import { BackButton, PageLayout } from '@/components/layout'
import { PlatformsSidebar } from '@/components/sidebar'
import { useToast } from '@/components/ui/Toast'
import { PlatformTypeIcon } from '@/components/PlatformTypeIcon'
import { platformsAPI, userPlatformsAPI } from '@/lib/api'

interface Platform {
  id: string
  name: string
  display_name: string
  platform_type: 'pc' | 'console' | 'mobile' | 'physical'
  is_system: boolean
  is_physical: boolean
  website_url: string | null
  color_primary: string
  default_icon_url: string | null
  sort_order: number
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
  platform_type: 'pc' | 'console' | 'mobile' | 'physical'
  color_primary: string
  default_icon_url: string | null
}

function PlatformIcon({
  name,
  iconUrl,
  color,
}: {
  name: string
  iconUrl?: string | null
  color?: string
}) {
  if (iconUrl) {
    return <img src={iconUrl} alt={name} className="w-full h-full object-cover" />
  }

  const initial = name.trim().charAt(0).toUpperCase() || 'P'
  const colorValue = color || 'var(--ctp-surface2)'
  const hex = colorValue.startsWith('#') ? colorValue.replace('#', '') : null
  const isLightBackground = hex
    ? (parseInt(hex.slice(0, 2), 16) * 299 +
        parseInt(hex.slice(2, 4), 16) * 587 +
        parseInt(hex.slice(4, 6), 16) * 114) /
        1000 >
      155
    : false

  return (
    <div
      className={`w-full h-full flex items-center justify-center font-semibold text-6xl ${
        isLightBackground ? 'text-gray-900' : 'text-ctp-base dark:text-ctp-text'
      }`}
      style={{ backgroundColor: colorValue }}
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
    queryKey: ['platforms'],
    queryFn: async () => {
      const response = await platformsAPI.getAll()
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

  const userPlatforms = useMemo(
    () => userPlatformsData?.platforms ?? [],
    [userPlatformsData?.platforms]
  )
  const existingPlatformIds = useMemo(
    () => new Set(userPlatforms.map((platform) => platform.platform_id)),
    [userPlatforms]
  )

  const addPlatformsMutation = useMutation({
    mutationFn: async (platformIds: string[]) => {
      await Promise.all(platformIds.map((platformId) => userPlatformsAPI.add({ platformId })))
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
      queryClient.invalidateQueries({ queryKey: ['platforms'] })
      queryClient.invalidateQueries({ queryKey: ['user-platforms'] })
      setIsCustomModalOpen(false)
      showToast('Custom platform added', 'success')
    },
    onError: () => {
      showToast('Failed to add custom platform', 'error')
    },
  })

  const rawgPlatforms = useMemo(
    () => rawgPlatformsData?.platforms ?? [],
    [rawgPlatformsData?.platforms]
  )
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
      prev.includes(platformId) ? prev.filter((id) => id !== platformId) : [...prev, platformId]
    )
  }

  const handleAddSelected = () => {
    const newPlatformIds = selectedPlatformIds.filter((id) => !existingPlatformIds.has(id))

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
    <PageLayout sidebar={sidebarContent} customCollapsed={true}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <BackButton
                iconOnly={true}
                className="md:hidden p-2 rounded-lg text-ctp-subtext0 hover:bg-ctp-surface0 hover:text-ctp-text transition-all"
              />
              <h1 className="text-4xl font-bold text-ctp-text">Platforms</h1>
            </div>
            <p className="text-ctp-subtext0 mt-1">
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
            <p className="text-ctp-subtext0 text-center py-8">
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
                <Link to="/platforms/$id" params={{ id: platform.id }}>
                  <div
                    className={[
                      'aspect-square rounded-lg overflow-hidden bg-ctp-surface0',
                      'mb-2 relative',
                    ].join(' ')}
                  >
                    <PlatformIcon
                      name={platform.display_name}
                      iconUrl={platform.icon_url}
                      color={platform.color_primary}
                    />
                    <div
                      className={[
                        'absolute inset-0 bg-gradient-to-t',
                        'from-ctp-base/70 via-ctp-base/20 to-transparent',
                        'dark:from-ctp-crust/80 dark:via-transparent dark:to-transparent',
                      ].join(' ')}
                    />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-ctp-text font-medium truncate">{platform.display_name}</p>
                      <p className="text-sm text-ctp-teal truncate">
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
          <label className="block text-sm font-medium mb-2" htmlFor="platforms-search">
            Search platforms
          </label>
          <input
            id="platforms-search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="input w-full"
            placeholder="Search by name"
          />
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-ctp-text">Add Platforms</h2>
            <span className="text-sm text-ctp-subtext0">{selectedPlatformIds.length} selected</span>
          </div>

          {isLoadingPlatforms ? (
            <div className="text-ctp-subtext0">Loading platforms...</div>
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
                        ? 'border-ctp-teal bg-ctp-teal/10'
                        : 'border-ctp-surface0 bg-ctp-mantle/50 hover:border-ctp-surface1'
                    } disabled:cursor-not-allowed`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium text-ctp-text">{platform.display_name}</div>
                      {isLocked && <span className="text-xs text-ctp-teal">Saved</span>}
                    </div>
                    <PlatformTypeIcon
                      type={platform.platform_type}
                      size="sm"
                      showLabel={true}
                      color={platform.color_primary}
                    />
                  </button>
                )
              })}

              {!isLoadingPlatforms && filteredPlatforms.length === 0 && (
                <p className="text-ctp-subtext0">No platforms match your search.</p>
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
