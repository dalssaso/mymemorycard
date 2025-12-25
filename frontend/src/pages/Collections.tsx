import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { collectionsAPI } from '@/lib/api'
import { PageLayout } from '@/components/layout'
import { Card, Button } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'

interface Collection {
  id: string
  name: string
  description: string | null
  game_count: number
  created_at: string
}

interface Series {
  series_name: string
  count: number
}

export function Collections() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')
  const [newCollectionDescription, setNewCollectionDescription] = useState('')

  const { data: collectionsData } = useQuery({
    queryKey: ['collections'],
    queryFn: async () => {
      const response = await collectionsAPI.getAll()
      return response.data as { collections: Collection[] }
    },
  })

  const { data: seriesData } = useQuery({
    queryKey: ['series'],
    queryFn: async () => {
      const response = await collectionsAPI.getSeries()
      return response.data as { series: Series[] }
    },
  })

  const createCollectionMutation = useMutation({
    mutationFn: () => collectionsAPI.create(newCollectionName, newCollectionDescription),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] })
      showToast('Collection created successfully', 'success')
      setShowCreateModal(false)
      setNewCollectionName('')
      setNewCollectionDescription('')
    },
    onError: () => {
      showToast('Failed to create collection', 'error')
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
  const series = seriesData?.series || []

  const handleCreateCollection = () => {
    if (!newCollectionName.trim()) {
      showToast('Collection name is required', 'error')
      return
    }
    createCollectionMutation.mutate()
  }

  const handleDeleteCollection = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteCollectionMutation.mutate(id)
    }
  }

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-white">Collections</h1>
          <Button onClick={() => setShowCreateModal(true)}>
            Create Collection
          </Button>
        </div>

        {/* Game Series (Auto-Detected) */}
        {series.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-primary-cyan mb-4">Game Series</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {series.map((s) => (
                <Link
                  key={s.series_name}
                  to="/collections/series/$seriesName"
                  params={{ seriesName: s.series_name }}
                  className="card hover:border-primary-cyan transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {s.series_name}
                      </h3>
                      <p className="text-sm text-gray-400">{s.count} games</p>
                    </div>
                    <div className="text-3xl">🎮</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* User Collections */}
        <div>
          <h2 className="text-2xl font-bold text-primary-purple mb-4">My Collections</h2>
          {collections.length === 0 ? (
            <Card>
              <p className="text-gray-400 text-center py-8">
                No collections yet. Create your first collection to organize your games!
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {collections.map((collection) => (
                <Card key={collection.id} className="hover:border-primary-purple transition-all">
                  <div className="flex flex-col h-full">
                    <Link
                      to="/collections/$id"
                      params={{ id: collection.id }}
                      className="flex-1"
                    >
                      <h3 className="text-lg font-semibold text-white mb-2 hover:text-primary-purple transition-colors">
                        {collection.name}
                      </h3>
                      {collection.description && (
                        <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                          {collection.description}
                        </p>
                      )}
                      <p className="text-sm text-primary-cyan">
                        {collection.game_count} {collection.game_count === 1 ? 'game' : 'games'}
                      </p>
                    </Link>
                    <div className="flex gap-2 mt-4 pt-4 border-t border-gray-700">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCollection(collection.id, collection.name)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
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
              </div>
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={handleCreateCollection}
                  disabled={createCollectionMutation.isPending}
                  className="flex-1"
                >
                  {createCollectionMutation.isPending ? 'Creating...' : 'Create'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowCreateModal(false)
                    setNewCollectionName('')
                    setNewCollectionDescription('')
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
