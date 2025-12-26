import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { gamesAPI } from '@/lib/api'
import { useToast } from '@/components/ui/Toast'
import { PlaySessionTracker } from '@/components/PlaySessionTracker'
import { CompletionProgressTracker } from '@/components/CompletionProgressTracker'

interface CustomFieldsEditorProps {
  gameId: string
  platformId: string
}

interface CustomFields {
  completion_percentage?: number | null
  difficulty_rating?: number | null
}

export function CustomFieldsEditor({ gameId, platformId }: CustomFieldsEditorProps) {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const [fields, setFields] = useState<CustomFields>({})

  const { data } = useQuery({
    queryKey: ['customFields', gameId, platformId],
    queryFn: async () => {
      const response = await gamesAPI.getCustomFields(gameId, platformId)
      return response.data as { customFields: CustomFields }
    },
  })

  useEffect(() => {
    if (data?.customFields) {
      setFields(data.customFields)
    }
  }, [data])

  const updateMutation = useMutation({
    mutationFn: (updatedFields: CustomFields) =>
      gamesAPI.updateCustomFields(gameId, platformId, updatedFields),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customFields', gameId, platformId] })
      showToast('Custom fields updated successfully', 'success')
    },
    onError: () => {
      showToast('Failed to update custom fields', 'error')
    },
  })

  const handleFieldChange = (field: keyof CustomFields, value: number | null) => {
    const updatedFields = { ...fields, [field]: value }
    setFields(updatedFields)
    updateMutation.mutate({ [field]: value })
  }

  return (
    <div className="space-y-8">
      <PlaySessionTracker gameId={gameId} platformId={platformId} />

      <div className="border-t border-gray-700" />

      <CompletionProgressTracker gameId={gameId} platformId={platformId} />

      <div className="border-t border-gray-700" />

      <div>
        <span className="block text-sm font-medium text-gray-400 mb-2" id="difficulty-rating-label">
          Difficulty Rating (1-10)
        </span>
        <div className="flex gap-1" role="group" aria-labelledby="difficulty-rating-label">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
            <button
              key={rating}
              onClick={() => handleFieldChange('difficulty_rating', rating)}
              aria-pressed={fields.difficulty_rating === rating}
              className={`flex-1 py-2 rounded transition-all text-sm ${
                fields.difficulty_rating === rating
                  ? 'bg-primary-red text-white shadow-lg shadow-primary-red/50'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {rating}
            </button>
          ))}
        </div>
        {fields.difficulty_rating && (
          <button
            onClick={() => handleFieldChange('difficulty_rating', null)}
            className="mt-2 text-sm text-gray-500 hover:text-gray-300"
          >
            Clear rating
          </button>
        )}
      </div>
    </div>
  )
}
