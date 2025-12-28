import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { CustomPlatformModal } from '@/components/CustomPlatformModal'
import { BackButton, PageLayout } from '@/components/layout'
import { PlatformOnboardingSidebar } from '@/components/sidebar'
import { useToast } from '@/components/ui/Toast'
import { PlatformTypeIcon } from '@/components/PlatformTypeIcon'
import { platformsAPI, userPlatformsAPI } from '@/lib/api'

interface Platform {
  id: string
  name: string
  display_name: string
  platform_type: 'pc' | 'console' | 'mobile' | 'physical'
  is_system: boolean
  color_primary: string
  default_icon_url: string | null
}

interface UserPlatform {
  id: string
  platform_id: string
}

export function PlatformOnboarding() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPlatformIds, setSelectedPlatformIds] = useState<string[]>([])
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const { data: rawgPlatformsData, isLoading: isLoadingPlatforms } = useQuery({
    queryKey: ['platforms'],
    queryFn: async () => {
      const response = await platformsAPI.getAll()
      return response.data as { platforms: Platform[] }
    },
  })

  const { data: userPlatformsData, isLoading: isLoadingUserPlatforms } = useQuery({
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

  useEffect(() => {
    if (!isLoadingUserPlatforms && userPlatforms.length > 0) {
      navigate({ to: '/platforms' })
    }
  }, [isLoadingUserPlatforms, navigate, userPlatforms.length])

  const addPlatformsMutation = useMutation({
    mutationFn: async (platformIds: string[]) => {
      await Promise.all(
        platformIds.map((platformId) => userPlatformsAPI.add({ platformId }))
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-platforms'] })
      showToast('Platforms saved', 'success')
    },
    onError: () => {
      showToast('Failed to save platforms', 'error')
    },
  })

  const customPlatformMutation = useMutation({
    mutationFn: async (data: { displayName: string; platformType: string; websiteUrl?: string; defaultIconUrl?: string; colorPrimary?: string }) => {
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

  const rawgPlatforms = rawgPlatformsData?.platforms || []
  const filteredPlatforms = rawgPlatforms.filter((platform) => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return true
    return (
      platform.display_name.toLowerCase().includes(term) ||
      platform.name.toLowerCase().includes(term)
    )
  })

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

  const handleSave = () => {
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
    <PlatformOnboardingSidebar
      selectedCount={selectedPlatformIds.length}
      onAddCustomPlatform={() => setIsCustomModalOpen(true)}
    />
  )

  return (
    <PageLayout sidebar={sidebarContent} customCollapsed={true}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <BackButton
              iconOnly={true}
              className="md:hidden p-2 rounded-lg text-ctp-subtext0 hover:bg-ctp-surface0 hover:text-ctp-text transition-all"
            />
            <h1 className="text-4xl font-bold text-ctp-text">Choose Your Platforms</h1>
          </div>
          <p className="text-ctp-subtext0 mt-2">
            Select the platforms you use. This keeps your imports focused and relevant.
          </p>
        </div>

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
            <h2 className="text-lg font-semibold text-ctp-text">Platforms</h2>
            <span className="text-sm text-ctp-subtext0">
              {selectedPlatformIds.length} selected
            </span>
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
                        ? 'border-ctp-mauve bg-ctp-mauve/20'
                        : 'border-ctp-surface0 bg-ctp-mantle/50 hover:border-ctp-surface1'
                    } disabled:cursor-not-allowed`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium text-ctp-text">
                        {platform.display_name}
                      </div>
                      {isLocked && (
                        <span className="text-xs text-ctp-mauve">Saved</span>
                      )}
                    </div>
                    <PlatformTypeIcon type={platform.platform_type} size="sm" showLabel={true} color={platform.color_primary} />
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
            onClick={handleSave}
            disabled={addPlatformsMutation.isPending}
            className="btn btn-primary"
          >
            {addPlatformsMutation.isPending ? 'Saving...' : 'Save platforms'}
          </button>
          <button
            onClick={() => setIsCustomModalOpen(true)}
            className="btn btn-secondary"
          >
            Add Custom Platform
          </button>
          <button
            onClick={() => navigate({ to: '/import' })}
            className="btn btn-secondary"
          >
            Continue to Import
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
