import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { BackButton, PageLayout } from '@/components/layout'
import { CollectionDetailSidebar } from '@/components/sidebar/CollectionDetailSidebar'
import { Button } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import { collectionsAPI } from '@/lib/api'

interface Game {
  id: string
  name: string
  cover_art_url: string | null
  platform_display_name: string
  status: string
  user_rating: number | null
  is_favorite: boolean
}

interface Collection {
  id: string
  name: string
  description: string | null
  cover_filename: string | null
  cover_art_url: string | null
}

export function CollectionDetail() {
  const { id } = useParams({ from: '/collections/$id' })
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [isEditingName, setIsEditingName] = useState(false)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [nameValue, setNameValue] = useState('')
  const [descriptionValue, setDescriptionValue] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['collection', id],
    queryFn: async () => {
      const response = await collectionsAPI.getOne(id)
      return response.data as { collection: Collection; games: Game[] }
    },
  })

  const updateCollectionMutation = useMutation({
    mutationFn: ({ name, description }: { name: string; description: string }) =>
      collectionsAPI.update(id, name, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collection', id] })
      queryClient.invalidateQueries({ queryKey: ['collections'] })
      showToast('Collection updated successfully', 'success')
      setIsEditingName(false)
      setIsEditingDescription(false)
    },
    onError: () => {
      showToast('Failed to update collection', 'error')
    },
  })

  const removeGameMutation = useMutation({
    mutationFn: (gameId: string) => collectionsAPI.removeGame(id, gameId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collection', id] })
      queryClient.invalidateQueries({ queryKey: ['collections'] })
      showToast('Game removed from collection', 'success')
    },
    onError: () => {
      showToast('Failed to remove game', 'error')
    },
  })

  const deleteCollectionMutation = useMutation({
    mutationFn: () => collectionsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] })
      showToast('Collection deleted', 'success')
      navigate({ to: '/collections' })
    },
    onError: () => {
      showToast('Failed to delete collection', 'error')
    },
  })

  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-gray-400">Loading...</div>
        </div>
      </PageLayout>
    )
  }

  if (!data) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-red-400">Collection not found</div>
        </div>
      </PageLayout>
    )
  }

  const { collection, games } = data

  const handleDeleteCollection = () => {
    if (confirm(`Are you sure you want to delete "${collection.name}"?`)) {
      deleteCollectionMutation.mutate()
    }
  }

  const handleSaveName = () => {
    if (!nameValue.trim()) {
      showToast('Collection name cannot be empty', 'error')
      return
    }
    updateCollectionMutation.mutate({ name: nameValue, description: collection.description || '' })
  }

  const handleSaveDescription = () => {
    updateCollectionMutation.mutate({ name: collection.name, description: descriptionValue })
  }

  const handleUploadCover = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be under 5MB', 'error')
      return
    }

    try {
      await collectionsAPI.uploadCover(id, file)
      queryClient.invalidateQueries({ queryKey: ['collection', id] })
      queryClient.invalidateQueries({ queryKey: ['collections'] })
      showToast('Cover updated', 'success')
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to upload cover'
      showToast(errorMessage, 'error')
    }
  }

  const handleDeleteCover = async () => {
    if (!confirm('Remove custom cover? Will revert to auto-selected game cover.')) {
      return
    }
    try {
      await collectionsAPI.deleteCover(id)
      queryClient.invalidateQueries({ queryKey: ['collection', id] })
      queryClient.invalidateQueries({ queryKey: ['collections'] })
      showToast('Cover removed', 'success')
    } catch {
      showToast('Failed to remove cover', 'error')
    }
  }

  const handleUploadCoverClick = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/jpeg,image/jpg,image/png,image/webp,image/gif'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) handleUploadCover(file)
    }
    input.click()
  }

  return (
    <PageLayout
      customCollapsed={true}
      showBackButton={false}
      sidebar={
        <CollectionDetailSidebar
          collectionId={id}
          collectionName={collection.name}
          gameCount={games.length}
          isUpdating={updateCollectionMutation.isPending || deleteCollectionMutation.isPending}
        />
      }
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar - Cover and Controls */}
          <div className="lg:col-span-1">
            {/* Cover Art */}
            <div className="aspect-[3/4] rounded-lg overflow-hidden bg-gray-800 mb-4">
              {collection.cover_filename ? (
                <img
                  src={`/collection-covers/${collection.cover_filename}`}
                  alt={collection.name}
                  className="w-full h-full object-contain"
                />
              ) : collection.cover_art_url ? (
                <img
                  src={collection.cover_art_url}
                  alt={collection.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  <span className="text-sm">No Cover</span>
                </div>
              )}
            </div>

            {/* Cover Upload/Delete Buttons */}
            <div className="flex gap-2 mb-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleUploadCoverClick}
                className="flex-1"
              >
                {collection.cover_filename ? 'Change Cover' : 'Add Cover'}
              </Button>

              {collection.cover_filename && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleDeleteCover}
                  className="flex-1"
                >
                  Remove Cover
                </Button>
              )}
            </div>

            {/* Game Count */}
            <div className="bg-primary-cyan/10 border border-primary-cyan/30 rounded-lg p-3 mb-4">
              <div className="text-xs text-primary-cyan">Games</div>
              <div className="text-lg font-semibold text-white">
                {games.length} {games.length === 1 ? 'game' : 'games'}
              </div>
            </div>

            {/* Delete Collection Button */}
            <Button
              variant="danger"
              onClick={handleDeleteCollection}
              className="w-full"
            >
              Delete Collection
            </Button>
          </div>

          {/* Main Content - Collection Details and Games */}
          <div className="lg:col-span-2">
            {/* Collection Name */}
            <div className="mb-4">
              {isEditingName ? (
                <div>
                  <input
                    type="text"
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    className="w-full text-4xl font-bold bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-purple mb-2"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveName}
                      disabled={updateCollectionMutation.isPending}
                      size="sm"
                    >
                      {updateCollectionMutation.isPending ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setIsEditingName(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BackButton
                      iconOnly={true}
                      className="md:hidden p-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-all"
                    />
                    <h1 className="text-4xl font-bold text-white">{collection.name}</h1>
                  </div>
                  <button
                    onClick={() => {
                      setNameValue(collection.name)
                      setIsEditingName(true)
                    }}
                    className="text-sm text-primary-cyan hover:text-primary-purple"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>

            {/* Collection Description */}
            <div id="description" className="mb-6 bg-gray-800/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-semibold text-primary-purple">Description</h2>
                {!isEditingDescription && (
                  <button
                    onClick={() => {
                      setDescriptionValue(collection.description || '')
                      setIsEditingDescription(true)
                    }}
                    className="text-sm text-primary-cyan hover:text-primary-purple"
                  >
                    {collection.description ? 'Edit' : 'Add Description'}
                  </button>
                )}
              </div>

              {isEditingDescription ? (
                <div>
                  <textarea
                    value={descriptionValue}
                    onChange={(e) => setDescriptionValue(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-purple min-h-24"
                    placeholder="Describe your collection..."
                  />
                  <div className="flex gap-2 mt-2">
                    <Button
                      onClick={handleSaveDescription}
                      disabled={updateCollectionMutation.isPending}
                      size="sm"
                    >
                      {updateCollectionMutation.isPending ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setIsEditingDescription(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-gray-300 bg-gray-900/50 rounded-lg p-4">
                  {collection.description || 'No description yet'}
                </div>
              )}
            </div>

            {/* Games Section */}
            <div id="games" className="mb-6 bg-gray-800/30 rounded-lg p-4">
              <h2 className="text-xl font-semibold text-primary-purple mb-4">Games in Collection</h2>
              {games.length === 0 ? (
                <p className="text-gray-400 text-center py-8">
                  No games in this collection yet. Add games from your library!
                </p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {games.map((game) => (
                    <div key={game.id} className="group relative">
                      <Link to="/library/$id" params={{ id: game.id }}>
                        <div className="aspect-[3/4] rounded-lg overflow-hidden bg-gray-800 mb-2">
                          {game.cover_art_url ? (
                            <img
                              src={game.cover_art_url}
                              alt={game.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                              No Cover
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-300 truncate group-hover:text-white">
                          {game.name}
                        </p>
                      </Link>
                      <button
                        onClick={() => removeGameMutation.mutate(game.id)}
                        className="absolute top-2 right-2 bg-red-600/80 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove from collection"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
