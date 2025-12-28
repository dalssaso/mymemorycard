import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { BackButton, PageLayout } from '@/components/layout'
import { CollectionsSidebar } from '@/components/sidebar'
import { Card, Button } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import { collectionsAPI } from '@/lib/api'

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
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const { data: collectionsData } = useQuery({
    queryKey: ['collections'],
    queryFn: async () => {
      const response = await collectionsAPI.getAll()
      return response.data as { collections: Collection[] }
    },
  })

  const bulkDeleteCollectionsMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => collectionsAPI.delete(id)))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] })
      setSelectedCollectionIds([])
      setSelectionMode(false)
      showToast('Collections deleted', 'success')
    },
    onError: () => {
      showToast('Failed to delete collections', 'error')
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

  const toggleCollectionSelection = (id: string) => {
    setSelectedCollectionIds((current) =>
      current.includes(id) ? current.filter((collectionId) => collectionId !== id) : [...current, id]
    )
  }

  const allSelected = collections.length > 0 && selectedCollectionIds.length === collections.length

  const handleExitSelectionMode = () => {
    setSelectionMode(false)
    setSelectedCollectionIds([])
  }

  return (
    <PageLayout
      sidebar={<CollectionsSidebar onCreateCollection={() => setShowCreateModal(true)} />}
      customCollapsed={true}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3">
              <BackButton
                iconOnly={true}
                className="md:hidden p-2 rounded-lg text-ctp-subtext0 hover:bg-ctp-surface0 hover:text-ctp-text transition-all"
              />
              <h1 className="text-4xl font-bold text-ctp-text">Collections</h1>
            </div>
            <p className="text-ctp-subtext0 mt-1">
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
              <p className="text-ctp-subtext0 text-center py-8">
                No collections yet. Create your first collection to organize your games!
              </p>
            </Card>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between gap-4">
                <span className="text-sm text-ctp-subtext0">
                  {collections.length} {collections.length === 1 ? 'collection' : 'collections'}
                </span>
                {!selectionMode && collections.length > 0 && (
                  <button
                    onClick={() => setSelectionMode(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-ctp-subtext0 hover:text-ctp-text border border-ctp-surface1 hover:border-ctp-surface2 rounded transition-all"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                      />
                    </svg>
                    Select
                  </button>
                )}
              </div>

              {selectionMode && (
                <div className="mb-4 p-3 bg-ctp-surface0/50 border border-ctp-surface1 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-ctp-text">
                      {selectedCollectionIds.length > 0
                        ? `${selectedCollectionIds.length} collection(s) selected`
                        : 'Select collections to manage'}
                    </span>
                    {collections.length > 0 && (
                      <button
                        onClick={() =>
                          setSelectedCollectionIds(allSelected ? [] : collections.map((collection) => collection.id))
                        }
                        className="text-sm text-ctp-subtext0 hover:text-ctp-text"
                      >
                        {allSelected ? 'Deselect all' : 'Select all'}
                      </button>
                    )}
                    {selectedCollectionIds.length > 0 && (
                      <button
                        onClick={() => setSelectedCollectionIds([])}
                        className="text-sm text-ctp-subtext0 hover:text-ctp-text"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedCollectionIds.length > 0 && (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="px-3 py-1.5 bg-ctp-red/20 border border-ctp-red/30 text-ctp-red hover:bg-ctp-red/30 rounded text-sm transition-all"
                      >
                        Delete
                      </button>
                    )}
                    <button
                      onClick={handleExitSelectionMode}
                      className="px-3 py-1.5 bg-ctp-surface1 hover:bg-ctp-surface2 text-ctp-text rounded text-sm transition-all"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {collections.map((collection) => {
                  const isSelected = selectedCollectionIds.includes(collection.id)
                  const cardContent = (
                    <>
                      <div className="aspect-[3/4] rounded-lg overflow-hidden bg-ctp-surface0 mb-2 relative">
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
                          <div className="w-full h-full flex items-center justify-center text-ctp-overlay1">
                            <span className="text-sm">No Cover</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-ctp-base/70 via-ctp-base/20 to-transparent dark:from-ctp-crust/80 dark:via-transparent dark:to-transparent" />
                        {selectionMode && isSelected && (
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-ctp-mauve flex items-center justify-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={3}
                              stroke="currentColor"
                              className="w-4 h-4 text-ctp-text"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="m4.5 12.75 6 6 9-13.5"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 px-2 pb-2 sm:px-0 sm:pb-0">
                        <p className="text-ctp-text font-medium truncate group-hover:text-ctp-mauve transition-colors">
                          {collection.name}
                        </p>
                        <p className="text-sm text-ctp-mauve">
                          {collection.game_count} {collection.game_count === 1 ? 'game' : 'games'}
                        </p>
                      </div>
                    </>
                  )

                  const cardClassName = selectionMode
                    ? `card cursor-pointer transition-all group relative p-0 sm:p-3 ${isSelected ? 'bg-ctp-mauve/20 border-ctp-mauve' : 'hover:border-zinc-500'}`
                    : 'card hover:border-ctp-mauve transition-all cursor-pointer group relative p-0 sm:p-3'

                  return (
                    selectionMode ? (
                      <div
                        key={collection.id}
                        className={cardClassName}
                        onClick={() => toggleCollectionSelection(collection.id)}
                      >
                        {cardContent}
                      </div>
                    ) : (
                      <Link
                        key={collection.id}
                        to="/collections/$id"
                        params={{ id: collection.id }}
                        className={cardClassName}
                      >
                        {cardContent}
                      </Link>
                    )
                  )
                })}
              </div>
            </>
          )}
        </div>

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-ctp-base/50 flex items-center justify-center z-50">
            <div className="bg-ctp-mantle border border-ctp-surface1 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold mb-4">Delete Collections</h3>
              <p className="text-ctp-subtext0 mb-6">
                Are you sure you want to delete {selectedCollectionIds.length} collection(s)?
                This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => bulkDeleteCollectionsMutation.mutate(selectedCollectionIds)}
                  disabled={bulkDeleteCollectionsMutation.isPending}
                  className="px-4 py-2 bg-ctp-red text-ctp-base hover:bg-ctp-red/80 rounded transition-all"
                >
                  {bulkDeleteCollectionsMutation.isPending ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Collection Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-ctp-base/80 flex items-center justify-center z-50 p-4">
            <div className="bg-ctp-mantle border border-ctp-surface1 rounded-lg p-6 max-w-md w-full">
              <h2 className="text-2xl font-bold text-ctp-text mb-4">Create Collection</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-ctp-subtext0 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    placeholder="e.g., Couch Co-op Games"
                    className="w-full bg-ctp-surface0 border border-ctp-surface1 rounded-lg px-3 py-2 text-ctp-text focus:outline-none focus:border-ctp-mauve"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ctp-subtext0 mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    value={newCollectionDescription}
                    onChange={(e) => setNewCollectionDescription(e.target.value)}
                    placeholder="Describe your collection..."
                    className="w-full bg-ctp-surface0 border border-ctp-surface1 rounded-lg px-3 py-2 text-ctp-text focus:outline-none focus:border-ctp-mauve min-h-24"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ctp-subtext0 mb-2">
                    Cover Image (optional)
                  </label>
                  <p className="text-xs text-ctp-overlay1 mb-2">
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
                    className="w-full bg-ctp-surface0 border border-ctp-surface1 rounded-lg px-3 py-2 text-ctp-text focus:outline-none focus:border-ctp-mauve"
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
                        className="text-sm text-ctp-subtext0 hover:text-ctp-text mt-1"
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
