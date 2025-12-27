import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sessionsAPI } from '@/lib/api'
import { useToast } from '@/components/ui/Toast'

interface PlaySession {
  id: string
  user_id: string
  game_id: string
  platform_id: string
  started_at: string
  ended_at: string | null
  duration_minutes: number | null
  notes: string | null
  created_at: string
  game_name?: string
  platform_name?: string
}

interface SessionsHistoryProps {
  gameId: string
  platformId: string
  onSessionChange?: () => void
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
}

export function SessionsHistory({ gameId, platformId, onSessionChange }: SessionsHistoryProps) {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [isManualMode, setIsManualMode] = useState(false)
  const [manualDuration, setManualDuration] = useState('')
  const [manualDate, setManualDate] = useState(() => new Date().toISOString().split('T')[0])
  const [sessionNotes, setSessionNotes] = useState('')

  const { data: sessionsData, isLoading: loadingSessions } = useQuery({
    queryKey: ['sessions', gameId],
    queryFn: async () => {
      const response = await sessionsAPI.getAll(gameId, { limit: 20 })
      return response.data as {
        sessions: PlaySession[]
        total: number
        totalMinutes: number
      }
    },
  })

  const addManualSessionMutation = useMutation({
    mutationFn: () => {
      const durationMinutes = parseInt(manualDuration)
      if (isNaN(durationMinutes) || durationMinutes <= 0) {
        throw new Error('Invalid duration')
      }
      const startedAt = new Date(manualDate)
      const endedAt = new Date(startedAt.getTime() + durationMinutes * 60000)
      return sessionsAPI.create(gameId, {
        platformId,
        startedAt: startedAt.toISOString(),
        endedAt: endedAt.toISOString(),
        durationMinutes,
        notes: sessionNotes || null,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions', gameId] })
      queryClient.invalidateQueries({ queryKey: ['game', gameId] })
      setManualDuration('')
      setSessionNotes('')
      setIsManualMode(false)
      showToast('Session added', 'success')
      onSessionChange?.()
    },
    onError: () => {
      showToast('Failed to add session', 'error')
    },
  })

  const deleteSessionMutation = useMutation({
    mutationFn: (sessionId: string) => sessionsAPI.delete(gameId, sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions', gameId] })
      queryClient.invalidateQueries({ queryKey: ['game', gameId] })
      showToast('Session deleted', 'success')
      onSessionChange?.()
    },
    onError: () => {
      showToast('Failed to delete session', 'error')
    },
  })

  const sessions = sessionsData?.sessions || []
  const totalMinutes = sessionsData?.totalMinutes || 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Sessions History</h3>
          <div className="text-sm text-gray-400">
            Total: {formatDuration(totalMinutes)}
          </div>
        </div>
        <button
          onClick={() => setIsManualMode(!isManualMode)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            isManualMode
              ? 'bg-primary-purple text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
          }`}
        >
          + Add Manual
        </button>
      </div>

      {isManualMode && (
        <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="manual-date-history" className="block text-sm text-gray-400 mb-1">
                Date
              </label>
              <input
                id="manual-date-history"
                type="date"
                value={manualDate}
                onChange={(e) => setManualDate(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-purple"
              />
            </div>
            <div>
              <label htmlFor="manual-duration-history" className="block text-sm text-gray-400 mb-1">
                Duration (minutes)
              </label>
              <input
                id="manual-duration-history"
                type="number"
                min="1"
                placeholder="60"
                value={manualDuration}
                onChange={(e) => setManualDuration(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-purple"
              />
            </div>
          </div>
          <div>
            <label htmlFor="session-notes-history" className="block text-sm text-gray-400 mb-1">
              Notes (optional)
            </label>
            <input
              id="session-notes-history"
              type="text"
              placeholder="What did you do in this session?"
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-purple"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => addManualSessionMutation.mutate()}
              disabled={addManualSessionMutation.isPending || !manualDuration}
              className="flex-1 py-2 bg-primary-purple hover:bg-primary-purple/80 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {addManualSessionMutation.isPending ? 'Adding...' : 'Add Session'}
            </button>
            <button
              onClick={() => {
                setIsManualMode(false)
                setManualDuration('')
                setSessionNotes('')
              }}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loadingSessions ? (
        <div className="text-gray-400 text-sm">Loading sessions...</div>
      ) : sessions.length > 0 ? (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between bg-gray-800/50 rounded-lg p-3"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">
                    {session.ended_at ? formatDuration(session.duration_minutes || 0) : 'In progress'}
                  </span>
                  <span className="text-gray-500 text-sm">
                    {new Date(session.started_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                {session.notes && (
                  <p className="text-sm text-gray-400 mt-1">{session.notes}</p>
                )}
              </div>
              <button
                onClick={() => deleteSessionMutation.mutate(session.id)}
                disabled={deleteSessionMutation.isPending || !session.ended_at}
                className="p-2 text-gray-500 hover:text-primary-red transition-colors disabled:opacity-50"
                title={session.ended_at ? 'Delete session' : 'Cannot delete active session'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-gray-500 text-sm text-center py-8 bg-gray-800/30 rounded-lg">
          No sessions recorded yet
        </div>
      )}
    </div>
  )
}
