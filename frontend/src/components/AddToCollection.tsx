import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { collectionsAPI } from '@/lib/api'
import { useToast } from '@/components/ui/Toast'

interface AddToCollectionProps {
  gameId: string
  onClose?: () => void
}

interface Collection {
  id: string
  name: string
  game_count: number
}

export function AddToCollection({ gameId, onClose }: AddToCollectionProps) {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [showDropdown, setShowDropdown] = useState(false)

  const { data } = useQuery({
    queryKey: ['collections'],
    queryFn: async () => {
      const response = await collectionsAPI.getAll()
      return response.data as { collections: Collection[] }
    },
  })

  const addToCollectionMutation = useMutation({
    mutationFn: (collectionId: string) => 
      collectionsAPI.addGame(collectionId, gameId),
    onSuccess: (_, collectionId) => {
      queryClient.invalidateQueries({ queryKey: ['collection', collectionId] })
      queryClient.invalidateQueries({ queryKey: ['collections'] })
      const collection = collections.find(c => c.id === collectionId)
      showToast(`Added to ${collection?.name || 'collection'}`, 'success')
      setShowDropdown(false)
      onClose?.()
    },
    onError: () => {
      showToast('Failed to add to collection', 'error')
    },
  })

  const collections = data?.collections || []

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setShowDropdown(!showDropdown)
        }}
        className="px-3 py-1 bg-primary-purple/20 border border-primary-purple/30 text-primary-purple hover:bg-primary-purple/30 rounded-lg text-sm transition-all"
      >
        Add to Collection
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
            <div className="py-1">
              {collections.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-400 text-center">
                  No collections yet. Create one first!
                </div>
              ) : (
                collections.map((collection) => (
                  <button
                    key={collection.id}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      addToCollectionMutation.mutate(collection.id)
                    }}
                    disabled={addToCollectionMutation.isPending}
                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white disabled:opacity-50"
                  >
                    <div className="font-medium">{collection.name}</div>
                    <div className="text-xs text-gray-500">{collection.game_count} games</div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
