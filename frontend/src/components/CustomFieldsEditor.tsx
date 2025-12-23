import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { gamesAPI } from '@/lib/api'
import { useToast } from '@/components/ui/Toast'

interface CustomFieldsEditorProps {
  gameId: string
  platformId: string
}

interface CustomFields {
  estimated_completion_hours?: number | null
  actual_playtime_hours?: number | null
  completion_percentage?: number | null
  difficulty_rating?: number | null
  achievements_total?: number | null
  achievements_earned?: number | null
  replay_value?: number | null
}

export function CustomFieldsEditor({ gameId, platformId }: CustomFieldsEditorProps) {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const [fields, setFields] = useState<CustomFields>({})

  const { data } = useQuery({
    queryKey: ['customFields', gameId],
    queryFn: async () => {
      const response = await gamesAPI.getCustomFields(gameId)
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
      queryClient.invalidateQueries({ queryKey: ['customFields', gameId] })
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
    <div className="space-y-6">
      {/* Time Tracking */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Time Tracking</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Estimated Completion (hours)
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={fields.estimated_completion_hours || ''}
              onChange={(e) =>
                handleFieldChange(
                  'estimated_completion_hours',
                  e.target.value ? parseFloat(e.target.value) : null
                )
              }
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-purple"
              placeholder="20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Actual Playtime (hours)
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={fields.actual_playtime_hours || ''}
              onChange={(e) =>
                handleFieldChange(
                  'actual_playtime_hours',
                  e.target.value ? parseFloat(e.target.value) : null
                )
              }
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-purple"
              placeholder="15"
            />
          </div>
        </div>
      </div>

      {/* Completion Percentage */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Completion Percentage: {fields.completion_percentage || 0}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={fields.completion_percentage || 0}
          onChange={(e) =>
            handleFieldChange('completion_percentage', parseInt(e.target.value))
          }
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-purple"
        />
      </div>

      {/* Difficulty Rating */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Difficulty Rating (1-10)
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
            <button
              key={rating}
              onClick={() => handleFieldChange('difficulty_rating', rating)}
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
      </div>

      {/* Achievements */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Achievements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Total Achievements
            </label>
            <input
              type="number"
              min="0"
              value={fields.achievements_total || ''}
              onChange={(e) =>
                handleFieldChange(
                  'achievements_total',
                  e.target.value ? parseInt(e.target.value) : null
                )
              }
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-purple"
              placeholder="50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Achievements Earned
            </label>
            <input
              type="number"
              min="0"
              value={fields.achievements_earned || ''}
              onChange={(e) =>
                handleFieldChange(
                  'achievements_earned',
                  e.target.value ? parseInt(e.target.value) : null
                )
              }
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-purple"
              placeholder="35"
            />
          </div>
        </div>
        {fields.achievements_total && fields.achievements_earned && (
          <div className="mt-3">
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-primary-green h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    (fields.achievements_earned / fields.achievements_total) * 100
                  )}%`,
                }}
              />
            </div>
            <p className="text-sm text-gray-400 mt-1">
              {fields.achievements_earned} / {fields.achievements_total} (
              {Math.round(
                (fields.achievements_earned / fields.achievements_total) * 100
              )}
              %)
            </p>
          </div>
        )}
      </div>

      {/* Replay Value */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Replay Value (1-5 stars)
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              onClick={() => handleFieldChange('replay_value', value)}
              className={`flex-1 py-3 rounded-lg transition-all ${
                fields.replay_value && fields.replay_value >= value
                  ? 'bg-primary-yellow/20 border-2 border-primary-yellow text-primary-yellow'
                  : 'bg-gray-800 border-2 border-gray-700 text-gray-400 hover:border-primary-yellow hover:text-primary-yellow'
              }`}
            >
              <span className="text-2xl">★</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
