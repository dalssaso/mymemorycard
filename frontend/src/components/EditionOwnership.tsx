import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ownershipAPI, OwnershipData, completionLogsAPI } from '@/lib/api'
import { Checkbox } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'

interface EditionOwnershipProps {
  gameId: string
  platformId: string
}

export function EditionOwnership({ gameId, platformId }: EditionOwnershipProps) {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [selectedEditionId, setSelectedEditionId] = useState<string | null>(null)
  const [selectedDlcIds, setSelectedDlcIds] = useState<Set<string>>(new Set())
  const [isInitialized, setIsInitialized] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['ownership', gameId, platformId],
    queryFn: async () => {
      const response = await ownershipAPI.get(gameId, platformId)
      return response.data as OwnershipData
    },
    enabled: !!platformId,
  })

  useEffect(() => {
    if (data && !isInitialized) {
      setSelectedEditionId(data.editionId)
      setSelectedDlcIds(new Set(data.ownedDlcIds))
      setIsInitialized(true)
    }
  }, [data, isInitialized])

  const updateEditionMutation = useMutation({
    mutationFn: (editionId: string | null) => ownershipAPI.setEdition(gameId, platformId, editionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ownership', gameId] })
      queryClient.invalidateQueries({ queryKey: ['completionLogs', gameId] })
      queryClient.invalidateQueries({ queryKey: ['additions', gameId] })
      completionLogsAPI.recalculate(gameId, platformId)
      showToast('Edition updated', 'success')
    },
    onError: () => {
      showToast('Failed to update edition', 'error')
    },
  })

  const updateDlcsMutation = useMutation({
    mutationFn: (dlcIds: string[]) => ownershipAPI.setDlcs(gameId, platformId, dlcIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ownership', gameId] })
      queryClient.invalidateQueries({ queryKey: ['completionLogs', gameId] })
      queryClient.invalidateQueries({ queryKey: ['additions', gameId] })
      completionLogsAPI.recalculate(gameId, platformId)
      showToast('DLC ownership updated', 'success')
    },
    onError: () => {
      showToast('Failed to update DLC ownership', 'error')
    },
  })

  const handleEditionChange = (editionId: string) => {
    const newEditionId = editionId === '' ? null : editionId
    setSelectedEditionId(newEditionId)
    updateEditionMutation.mutate(newEditionId)
  }

  const handleDlcToggle = (dlcId: string) => {
    const newSet = new Set(selectedDlcIds)
    if (newSet.has(dlcId)) {
      newSet.delete(dlcId)
    } else {
      newSet.add(dlcId)
    }
    setSelectedDlcIds(newSet)
    updateDlcsMutation.mutate(Array.from(newSet))
  }

  const handleSelectAllDlcs = () => {
    if (!data) return
    const allDlcIds = data.dlcs.map((d) => d.id)
    setSelectedDlcIds(new Set(allDlcIds))
    updateDlcsMutation.mutate(allDlcIds)
  }

  const handleDeselectAllDlcs = () => {
    setSelectedDlcIds(new Set())
    updateDlcsMutation.mutate([])
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-4 bg-gray-700 rounded w-1/3" />
        <div className="h-10 bg-gray-700 rounded" />
        <div className="h-24 bg-gray-700 rounded" />
      </div>
    )
  }

  if (!data) {
    return null
  }

  const hasEditions = data.editions.length > 0
  const hasDlcs = data.dlcs.length > 0
  const isCompleteEdition = data.editions.find((e) => e.id === selectedEditionId)?.is_complete_edition || false

  if (!hasEditions && !hasDlcs) {
    return (
      <div className="text-sm text-gray-500 italic">
        No editions or DLCs found for this game.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {hasEditions && (
        <div>
          <label htmlFor="edition-select" className="block text-sm font-medium text-gray-400 mb-2">
            Which edition do you own?
          </label>
          <select
            id="edition-select"
            value={selectedEditionId || ''}
            onChange={(e) => handleEditionChange(e.target.value)}
            disabled={updateEditionMutation.isPending}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-purple disabled:opacity-50"
          >
            <option value="">Standard Edition (no DLCs included)</option>
            {data.editions.map((edition) => (
              <option key={edition.id} value={edition.id}>
                {edition.name}
                {edition.is_complete_edition && ' (includes all DLCs)'}
              </option>
            ))}
          </select>
          {isCompleteEdition && (
            <p className="text-xs text-primary-green mt-1">
              This edition includes all DLCs - they will be counted in your progress.
            </p>
          )}
        </div>
      )}

      {hasDlcs && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-400">
              DLCs You Own {isCompleteEdition && '(all included)'}
            </span>
            {!isCompleteEdition && (
              <div className="flex gap-2">
                <button
                  onClick={handleSelectAllDlcs}
                  disabled={updateDlcsMutation.isPending}
                  className="text-xs text-primary-cyan hover:text-primary-purple disabled:opacity-50"
                >
                  Select All
                </button>
                <span className="text-gray-600">|</span>
                <button
                  onClick={handleDeselectAllDlcs}
                  disabled={updateDlcsMutation.isPending}
                  className="text-xs text-primary-cyan hover:text-primary-purple disabled:opacity-50"
                >
                  Deselect All
                </button>
              </div>
            )}
          </div>
          <div className="grid gap-2 max-h-60 overflow-y-auto pr-1">
            {data.dlcs.map((dlc) => {
              const isOwned = isCompleteEdition || selectedDlcIds.has(dlc.id)
              return (
                <label
                  key={dlc.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                    isOwned
                      ? 'border-primary-purple bg-primary-purple/10'
                      : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                  } ${isCompleteEdition ? 'opacity-75 cursor-not-allowed' : ''}`}
                >
                  <Checkbox
                    checked={isOwned}
                    onChange={() => handleDlcToggle(dlc.id)}
                    disabled={isCompleteEdition || updateDlcsMutation.isPending}
                  />
                  <div className="flex-1">
                    <span className="text-sm text-white">{dlc.name}</span>
                    {dlc.required_for_full && (
                      <span className="ml-2 text-xs text-primary-cyan">(Required for Full)</span>
                    )}
                  </div>
                </label>
              )
            })}
          </div>
          {!isCompleteEdition && selectedDlcIds.size > 0 && (
            <p className="text-xs text-gray-400 mt-2">
              {selectedDlcIds.size} of {data.dlcs.length} DLCs owned
            </p>
          )}
        </div>
      )}
    </div>
  )
}
