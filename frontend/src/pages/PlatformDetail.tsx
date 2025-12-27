import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { PageLayout } from '@/components/layout'
import { useToast } from '@/components/ui/Toast'
import { PlatformDetailSidebar } from '@/components/sidebar'
import { userPlatformsAPI } from '@/lib/api'

interface UserPlatformDetail {
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

export function PlatformDetail() {
  const { id } = useParams({ from: '/platforms/$id' })
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [usernameValue, setUsernameValue] = useState('')
  const [profileUrlValue, setProfileUrlValue] = useState('')
  const [iconUrlValue, setIconUrlValue] = useState('')
  const [notesValue, setNotesValue] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['user-platform', id],
    queryFn: async () => {
      const response = await userPlatformsAPI.getOne(id)
      return response.data as { platform: UserPlatformDetail }
    },
  })

  const updatePlatformMutation = useMutation({
    mutationFn: (payload: {
      username?: string | null
      iconUrl?: string | null
      profileUrl?: string | null
      notes?: string | null
    }) => userPlatformsAPI.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-platform', id] })
      queryClient.invalidateQueries({ queryKey: ['user-platforms'] })
      showToast('Platform updated', 'success')
    },
    onError: () => {
      showToast('Failed to update platform', 'error')
    },
  })

  const deletePlatformMutation = useMutation({
    mutationFn: () => userPlatformsAPI.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-platforms'] })
      showToast('Platform removed', 'success')
      navigate({ to: '/platforms' })
    },
    onError: () => {
      showToast('Failed to remove platform', 'error')
    },
  })

  const platform = data?.platform

  const sidebarContent = platform ? (
    <PlatformDetailSidebar
      platformName={platform.display_name}
      platformType={platform.platform_type}
      username={platform.username}
    />
  ) : null

  if (isLoading || !platform) {
    return (
      <PageLayout sidebar={sidebarContent}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-gray-400">Loading...</div>
        </div>
      </PageLayout>
    )
  }

  const handleSaveProfile = () => {
    updatePlatformMutation.mutate({
      username: usernameValue.trim() || null,
      profileUrl: profileUrlValue.trim() || null,
      iconUrl: iconUrlValue.trim() || null,
    })
    setIsEditingProfile(false)
  }

  const handleSaveNotes = () => {
    updatePlatformMutation.mutate({
      notes: notesValue.trim() || null,
    })
    setIsEditingNotes(false)
  }

  return (
    <PageLayout sidebar={sidebarContent}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-800">
              <PlatformIcon name={platform.display_name} iconUrl={platform.icon_url} />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">{platform.display_name}</h1>
              <p className="text-gray-400 mt-1">
                {platform.platform_type || 'platform'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to="/platforms" className="btn btn-secondary">
              Back to Platforms
            </Link>
            <button
              type="button"
              onClick={() => {
                if (confirm(`Remove ${platform.display_name}?`)) {
                  deletePlatformMutation.mutate()
                }
              }}
              className="btn btn-danger"
              disabled={deletePlatformMutation.isPending}
            >
              Remove Platform
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div id="profile" className="bg-gray-800/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-semibold text-primary-purple">Profile</h2>
                {!isEditingProfile && (
                  <button
                    onClick={() => {
                      setUsernameValue(platform.username || '')
                      setProfileUrlValue(platform.profile_url || '')
                      setIconUrlValue(platform.icon_url || '')
                      setIsEditingProfile(true)
                    }}
                    className="text-sm text-primary-cyan hover:text-primary-purple"
                  >
                    Edit
                  </button>
                )}
              </div>

              {isEditingProfile ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-400">Username</label>
                    <input
                      value={usernameValue}
                      onChange={(event) => setUsernameValue(event.target.value)}
                      className="input w-full"
                      placeholder="Optional username"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-400">
                      Profile URL
                    </label>
                    <input
                      value={profileUrlValue}
                      onChange={(event) => setProfileUrlValue(event.target.value)}
                      className="input w-full"
                      placeholder="Optional profile link"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-400">Icon URL</label>
                    <input
                      value={iconUrlValue}
                      onChange={(event) => setIconUrlValue(event.target.value)}
                      className="input w-full"
                      placeholder="Optional icon image URL"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Use a direct image URL ending in .png or .svg. Square assets (256x256 or
                      larger) with transparent backgrounds look best. You can grab official icons
                      from platform press kits or a curated set like{' '}
                      <a
                        href={`https://simpleicons.org/?q=${encodeURIComponent(
                          platform.display_name
                        )}`}
                        className="text-primary-cyan hover:text-primary-purple"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Simple Icons
                      </a>
                      .
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveProfile}
                      disabled={updatePlatformMutation.isPending}
                      className="btn btn-primary"
                    >
                      {updatePlatformMutation.isPending ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => setIsEditingProfile(false)}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-gray-300">
                  <div>
                    <div>
                      <span className="text-gray-500">Username:</span>{' '}
                      {platform.username || 'Not set'}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Profile URL:</span>{' '}
                    {platform.profile_url || 'Not set'}
                  </div>
                  <div>
                    <span className="text-gray-500">Icon URL:</span>{' '}
                    {platform.icon_url || 'Not set'}
                  </div>
                  {!platform.icon_url && (
                    <div className="text-xs text-gray-500">
                      Add a direct image URL for a square platform icon. Official press kits and
                      Simple Icons are good sources.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div id="notes" className="bg-gray-800/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-semibold text-primary-purple">Notes</h2>
                {!isEditingNotes && (
                  <button
                    onClick={() => {
                      setNotesValue(platform.notes || '')
                      setIsEditingNotes(true)
                    }}
                    className="text-sm text-primary-cyan hover:text-primary-purple"
                  >
                    {platform.notes ? 'Edit' : 'Add Notes'}
                  </button>
                )}
              </div>

              {isEditingNotes ? (
                <div>
                  <textarea
                    value={notesValue}
                    onChange={(event) => setNotesValue(event.target.value)}
                    className={[
                      'w-full bg-gray-900 border border-gray-700 rounded-lg',
                      'px-3 py-2 text-white focus:outline-none focus:border-primary-purple',
                      'min-h-24',
                    ].join(' ')}
                    placeholder="Add notes about this platform"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleSaveNotes}
                      disabled={updatePlatformMutation.isPending}
                      className="btn btn-primary"
                    >
                      {updatePlatformMutation.isPending ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => setIsEditingNotes(false)}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-gray-300 bg-gray-900/50 rounded-lg p-4">
                  {platform.notes || 'No notes yet'}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-xs text-gray-400 mb-1">Platform Type</div>
              <div className="text-lg font-semibold text-white">
                {platform.platform_type || 'platform'}
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-xs text-gray-400 mb-1">Saved Since</div>
              <div className="text-sm text-white">
                {new Date(platform.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
