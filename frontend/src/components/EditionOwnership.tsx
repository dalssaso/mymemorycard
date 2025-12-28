import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Checkbox, ScrollFade } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import { ownershipAPI, OwnershipData, completionLogsAPI } from '@/lib/api'

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
  const [isEditionOpen, setIsEditionOpen] = useState(false)
  const editionButtonRef = useRef<HTMLButtonElement | null>(null)
  const editionListRef = useRef<HTMLDivElement | null>(null)

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

  const handleEditionChange = (editionId: string | null) => {
    setSelectedEditionId(editionId)
    updateEditionMutation.mutate(editionId)
    setIsEditionOpen(false)
  }

  useEffect(() => {
    if (!isEditionOpen) {
      return
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        editionButtonRef.current?.contains(target) ||
        editionListRef.current?.contains(target)
      ) {
        return
      }
      setIsEditionOpen(false)
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsEditionOpen(false)
        editionButtonRef.current?.focus()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isEditionOpen])

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
        <div className="h-4 bg-ctp-surface1 rounded w-1/3" />
        <div className="h-10 bg-ctp-surface1 rounded" />
        <div className="h-24 bg-ctp-surface1 rounded" />
      </div>
    )
  }

  if (!data) {
    return null
  }

  const hasEditions = data.editions.length > 0
  const hasDlcs = data.dlcs.length > 0
  const selectedEdition = data.editions.find((e) => e.id === selectedEditionId)
  const isCompleteEdition = selectedEdition?.is_complete_edition || false

  if (!hasEditions && !hasDlcs) {
    return (
      <div className="text-sm text-ctp-overlay1 italic">
        No editions or DLCs found for this game.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {hasEditions && (
        <div>
          <label htmlFor="edition-select" className="block text-sm font-medium text-ctp-subtext0 mb-2">
            Which edition do you own?
          </label>
          <div className="relative" ref={editionListRef}>
            <button
              ref={editionButtonRef}
              id="edition-select"
              type="button"
              onClick={() => setIsEditionOpen((prev) => !prev)}
              disabled={updateEditionMutation.isPending}
              aria-haspopup="listbox"
              aria-expanded={isEditionOpen}
              className="w-full bg-ctp-mantle border border-ctp-surface1 rounded-lg px-3 py-2 text-ctp-text focus:outline-none focus:border-ctp-mauve disabled:opacity-50 flex items-center justify-between gap-3"
            >
              <span className="text-sm text-ctp-text truncate">
                {selectedEdition
                  ? `${selectedEdition.name}${selectedEdition.is_complete_edition ? ' (includes all DLCs)' : ''}`
                  : 'Standard Edition (no DLCs included)'}
              </span>
              <svg
                className={`w-4 h-4 text-ctp-subtext0 transition-transform ${isEditionOpen ? 'rotate-180' : ''}`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            {isEditionOpen && (
              <div className="absolute z-20 mt-2 w-full rounded-lg border border-ctp-surface1 bg-ctp-mantle shadow-lg">
                <ScrollFade axis="y" className="max-h-64 overflow-y-auto" role="listbox">
                  <button
                    type="button"
                    onClick={() => handleEditionChange(null)}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      !selectedEditionId
                        ? 'bg-ctp-mauve/20 text-ctp-mauve'
                        : 'text-ctp-subtext0 hover:bg-ctp-surface0 hover:text-ctp-text'
                    }`}
                    role="option"
                    aria-selected={!selectedEditionId}
                  >
                    Standard Edition (no DLCs included)
                  </button>
                  {data.editions.map((edition) => (
                    <button
                      key={edition.id}
                      type="button"
                      onClick={() => handleEditionChange(edition.id)}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                        selectedEditionId === edition.id
                          ? 'bg-ctp-mauve/20 text-ctp-mauve'
                          : 'text-ctp-subtext0 hover:bg-ctp-surface0 hover:text-ctp-text'
                      }`}
                      role="option"
                      aria-selected={selectedEditionId === edition.id}
                    >
                      <span className="block text-ctp-text">{edition.name}</span>
                      {edition.is_complete_edition && (
                        <span className="block text-xs text-ctp-teal">Includes all DLCs</span>
                      )}
                    </button>
                  ))}
                </ScrollFade>
              </div>
            )}
          </div>
          {isCompleteEdition && (
            <p className="text-xs text-ctp-green mt-1">
              This edition includes all DLCs - they will be counted in your progress.
            </p>
          )}
        </div>
      )}

      {hasDlcs && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-ctp-subtext0">
              DLCs You Own {isCompleteEdition && '(all included)'}
            </span>
            {!isCompleteEdition && (
              <div className="flex gap-2">
                <button
                  onClick={handleSelectAllDlcs}
                  disabled={updateDlcsMutation.isPending}
                  className="text-xs text-ctp-teal hover:text-ctp-mauve disabled:opacity-50"
                >
                  Select All
                </button>
                <span className="text-gray-600">|</span>
                <button
                  onClick={handleDeselectAllDlcs}
                  disabled={updateDlcsMutation.isPending}
                  className="text-xs text-ctp-teal hover:text-ctp-mauve disabled:opacity-50"
                >
                  Deselect All
                </button>
              </div>
            )}
          </div>
          <ScrollFade axis="y" className="space-y-2 max-h-60 overflow-y-auto">
            {data.dlcs.map((dlc) => {
              const isOwned = isCompleteEdition || selectedDlcIds.has(dlc.id)
              return (
                <label
                  key={dlc.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                    isOwned
                      ? 'border-ctp-mauve bg-ctp-mauve/10'
                      : 'border-ctp-surface1 bg-ctp-surface0/50 hover:border-ctp-surface2'
                  } ${isCompleteEdition ? 'opacity-75 cursor-not-allowed' : ''}`}
                >
                  <Checkbox
                    checked={isOwned}
                    onChange={() => handleDlcToggle(dlc.id)}
                    disabled={isCompleteEdition || updateDlcsMutation.isPending}
                  />
                  <div className="flex-1">
                    <span className="text-sm text-ctp-text">{dlc.name}</span>
                    {dlc.required_for_full && (
                      <span className="ml-2 text-xs text-ctp-teal">(Required for Full)</span>
                    )}
                  </div>
                </label>
              )
            })}
          </ScrollFade>
          {!isCompleteEdition && selectedDlcIds.size > 0 && (
            <p className="text-xs text-ctp-subtext0 mt-2">
              {selectedDlcIds.size} of {data.dlcs.length} DLCs owned
            </p>
          )}
        </div>
      )}
    </div>
  )
}
