import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { collectionsAPI } from '@/lib/api'
import { PageLayout } from '@/components/layout'
import { Card, Button } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import { CollectionsSidebar } from '@/components/sidebar'

interface Collection {
  id: string
  name: string
  description: string | null
  game_count: number
  cover_art_url: string | null
  cover_filename: string | null
  created_at: string
}

export function Collections() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')
  const [newCollectionDescription, setNewCollectionDescription] = useState('')
  const [newCollectionCoverFile, setNewCollectionCoverFile] = useState<File | null>(null)
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null)
  const [isUploadingCover, setIsUploadingCover] = useState(false)

  const { data: collectionsData } = useQuery({
    queryKey: ['collections'],
    queryFn: async () => {
      const response = await collectionsAPI.getAll()
      return response.data as { collections: Collection[] }
    },
  })

  const deleteCollectionMutation = useMutation({
    mutationFn: (id: string) => collectionsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] })
      showToast('Collection deleted', 'success')
    },
    onError: () => {
      showToast('Failed to delete collection', 'error')
    },
  })

  const collections = collectionsData?.collections || []

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) {
      showToast('Collection name is required', 'error')
      return
    }

    setIsUploadingCover(true)

    try {
      const result = await collectionsAPI.create(newCollectionName, newCollectionDescription)
      const newCollectionId = result.data.collection.id

      // Upload cover if provided
      if (newCollectionCoverFile && newCollectionId) {
        await collectionsAPI.uploadCover(newCollectionId, newCollectionCoverFile)
      }

      queryClient.invalidateQueries({ queryKey: ['collections'] })
      showToast('Collection created successfully', 'success')

      // Reset state
      setShowCreateModal(false)
      setNewCollectionName('')
      setNewCollectionDescription('')
      setNewCollectionCoverFile(null)
      setCoverPreviewUrl(null)
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to create collection'
      showToast(errorMessage, 'error')
    } finally {
      setIsUploadingCover(false)
    }
  }

  const handleDeleteCollection = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteCollectionMutation.mutate(id)
    }
  }

  return (
    <PageLayout sidebar={<CollectionsSidebar onCreateCollection={() => setShowCreateModal(true)} />}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white">Collections</h1>
            <p className="text-gray-400 mt-1">
              Organize your games into custom collections
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            Create Collection
          </Button>
        </div>

        <div>
          {collections.length === 0 ? (
            <Card>
              <p className="text-gray-400 text-center py-8">
                No collections yet. Create your first collection to organize your games!
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {collections.map((collection) => (
                <div key={collection.id} className="group">
                  <Link
                    to="/collections/$id"
                    params={{ id: collection.id }}
                  >
                    <div className="aspect-[3/4] rounded-lg overflow-hidden bg-gray-800 mb-2 relative">
                      {collection.cover_filename ? (
                        <img
                          src={`/collection-covers/${collection.cover_filename}`}
                          alt={collection.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                        />
                      ) : collection.cover_art_url ? (
                        <img
                          src={collection.cover_art_url}
                          alt={collection.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                          <span className="text-sm">No Cover</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-white font-medium truncate">
                          {collection.name}
                        </p>
                        <p className="text-sm text-primary-purple">
                          {collection.game_count} {collection.game_count === 1 ? 'game' : 'games'}
                        </p>
                      </div>
                    </div>
                  </Link>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const input = document.createElement('input')
                        input.type = 'file'
                        input.accept = 'image/jpeg,image/jpg,image/png,image/webp,image/gif'
                        input.onchange = async (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0]
                          if (!file) return

                          if (file.size > 5 * 1024 * 1024) {
                            showToast('Image must be under 5MB', 'error')
                            return
                          }

                          try {
                            await collectionsAPI.uploadCover(collection.id, file)
                            queryClient.invalidateQueries({ queryKey: ['collections'] })
                            showToast('Cover updated', 'success')
                          } catch (error: any) {
                            const errorMessage = error.response?.data?.error || 'Failed to upload cover'
                            showToast(errorMessage, 'error')
                          }
                        }
                        input.click()
                      }}
                      className="flex-1"
                    >
                      {collection.cover_filename ? 'Change Cover' : 'Add Cover'}
                    </Button>

                    {collection.cover_filename && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          if (!confirm('Remove custom cover? Will revert to auto-selected game cover.')) {
                            return
                          }
                          try {
                            await collectionsAPI.deleteCover(collection.id)
                            queryClient.invalidateQueries({ queryKey: ['collections'] })
                            showToast('Cover removed', 'success')
                          } catch {
                            showToast('Failed to remove cover', 'error')
                          }
                        }}
                        className="flex-1"
                      >
                        Remove
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCollection(collection.id, collection.name)}
                      className="flex-1"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Collection Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-md w-full">
              <h2 className="text-2xl font-bold text-white mb-4">Create Collection</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    placeholder="e.g., Couch Co-op Games"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-purple"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    value={newCollectionDescription}
                    onChange={(e) => setNewCollectionDescription(e.target.value)}
                    placeholder="Describe your collection..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-purple min-h-24"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Cover Image (optional)
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Recommended: 600x900px or similar aspect ratio (3:4). Max 5MB.
                  </p>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          showToast('Image must be under 5MB', 'error')
                          e.target.value = ''
                          return
                        }
                        setNewCollectionCoverFile(file)
                        setCoverPreviewUrl(URL.createObjectURL(file))
                      }
                    }}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-purple"
                  />
                  {coverPreviewUrl && (
                    <div className="mt-2">
                      <img
                        src={coverPreviewUrl}
                        alt="Preview"
                        className="max-h-48 rounded-lg mx-auto"
                      />
                      <button
                        onClick={() => {
                          setNewCollectionCoverFile(null)
                          setCoverPreviewUrl(null)
                        }}
                        className="text-sm text-gray-400 hover:text-white mt-1"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={handleCreateCollection}
                  disabled={isUploadingCover}
                  className="flex-1"
                >
                  {isUploadingCover ? 'Creating...' : 'Create'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowCreateModal(false)
                    setNewCollectionName('')
                    setNewCollectionDescription('')
                    setNewCollectionCoverFile(null)
                    setCoverPreviewUrl(null)
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  )
}
