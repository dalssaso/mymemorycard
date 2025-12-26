import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { completionLogsAPI } from '@/lib/api'
import { useToast } from '@/components/ui/Toast'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'

interface CompletionLog {
  id: string
  user_id: string
  game_id: string
  platform_id: string
  percentage: number
  logged_at: string
  notes: string | null
  game_name?: string
  platform_name?: string
}

interface CompletionProgressTrackerProps {
  gameId: string
  platformId: string
  onProgressChange?: () => void
}

const QUICK_PRESETS = [25, 50, 75, 100]

export function CompletionProgressTracker({
  gameId,
  platformId,
  onProgressChange,
}: CompletionProgressTrackerProps) {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [sliderValue, setSliderValue] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  const [showHistory, setShowHistory] = useState(false)

  const { data: logsData, isLoading } = useQuery({
    queryKey: ['completionLogs', gameId],
    queryFn: async () => {
      const response = await completionLogsAPI.getAll(gameId, { limit: 50 })
      return response.data as {
        logs: CompletionLog[]
        total: number
        currentPercentage: number
      }
    },
  })

  const currentPercentage = logsData?.currentPercentage ?? 0
  const displayValue = sliderValue ?? currentPercentage
  const logs = logsData?.logs || []

  const logProgressMutation = useMutation({
    mutationFn: () =>
      completionLogsAPI.create(gameId, {
        platformId,
        percentage: displayValue,
        notes: notes || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['completionLogs', gameId] })
      queryClient.invalidateQueries({ queryKey: ['customFields', gameId, platformId] })
      queryClient.invalidateQueries({ queryKey: ['game', gameId] })
      setSliderValue(null)
      setNotes('')
      showToast('Progress logged', 'success')
      onProgressChange?.()
    },
    onError: () => {
      showToast('Failed to log progress', 'error')
    },
  })

  const deleteLogMutation = useMutation({
    mutationFn: (logId: string) => completionLogsAPI.delete(gameId, logId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['completionLogs', gameId] })
      queryClient.invalidateQueries({ queryKey: ['customFields', gameId, platformId] })
      queryClient.invalidateQueries({ queryKey: ['game', gameId] })
      showToast('Log entry deleted', 'success')
      onProgressChange?.()
    },
    onError: () => {
      showToast('Failed to delete log entry', 'error')
    },
  })

  const hasChanged = sliderValue !== null && sliderValue !== currentPercentage

  const chartData = [...logs]
    .reverse()
    .map((log) => ({
      date: new Date(log.logged_at).toLocaleDateString(),
      percentage: log.percentage,
    }))

  return (
    <div className="space-y-4">
      {/* Main Progress Card */}
      <div className="bg-gray-900/70 rounded-xl p-4 space-y-4 border border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Completion Progress</h3>
            <p className="text-xs text-gray-500">Drag the slider or tap a preset</p>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-primary-green">{displayValue}</span>
            <span className="text-sm text-gray-400">%</span>
          </div>
        </div>

        {/* Progress bar visual */}
        <div className="relative">
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-primary-green/80 to-primary-green h-2 rounded-full transition-all duration-200"
              style={{ width: `${displayValue}%` }}
            />
          </div>
        </div>

        {/* Slider */}
        <input
          type="range"
          min={0}
          max={100}
          value={displayValue}
          onChange={(e) => setSliderValue(parseInt(e.target.value))}
          className="progress-slider w-full"
        />

        {/* Quick presets */}
        <div className="flex flex-wrap gap-2">
          {QUICK_PRESETS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setSliderValue(value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all
                border bg-gray-900/80
                ${displayValue === value
                  ? 'border-primary-green text-primary-green bg-primary-green/10'
                  : 'border-gray-700/80 text-gray-400 hover:border-primary-cyan hover:text-primary-cyan'
                }`}
            >
              {value}%
            </button>
          ))}
        </div>

        {/* Notes + actions (shown when changed) */}
        {hasChanged && (
          <div className="pt-3 mt-1 border-t border-gray-800/80 space-y-3">
            <input
              type="text"
              placeholder="Add a note about this update (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-gray-950/80 border border-gray-700 rounded-lg px-3 py-2 
                         text-sm text-white placeholder:text-gray-500
                         focus:outline-none focus:ring-1 focus:ring-primary-purple focus:border-primary-purple"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setSliderValue(null)
                  setNotes('')
                }}
                className="px-3 py-1.5 text-sm text-gray-300 rounded-lg border border-gray-700 
                           bg-gray-900/60 hover:bg-gray-800/80 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => logProgressMutation.mutate()}
                disabled={logProgressMutation.isPending}
                className="px-4 py-1.5 text-sm font-semibold rounded-lg 
                           bg-primary-green hover:bg-primary-green/80
                           text-gray-950 transition-colors disabled:opacity-50"
              >
                {logProgressMutation.isPending ? 'Saving...' : 'Log Progress'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Progress Chart */}
      {chartData.length >= 2 && (
        <div className="bg-gray-900/60 rounded-xl p-4 border border-gray-800/80">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold tracking-wide text-gray-400 uppercase">
              Progress Over Time
            </h4>
            {logs[0] && (
              <span className="text-xs text-gray-500">
                Last: {new Date(logs[0].logged_at).toLocaleDateString()}
              </span>
            )}
          </div>
          <ResponsiveContainer width="100%" height={100}>
            <LineChart data={chartData}>
              <XAxis
                dataKey="date"
                tick={{ fill: '#71717A', fontSize: 10 }}
                axisLine={{ stroke: '#3f3f46' }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: '#71717A', fontSize: 10 }}
                axisLine={{ stroke: '#3f3f46' }}
                tickLine={false}
                width={25}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #3f3f46',
                  borderRadius: '8px',
                }}
                itemStyle={{ color: '#fff' }}
                formatter={(value: number) => [`${value}%`, 'Completion']}
              />
              <Line
                type="monotone"
                dataKey="percentage"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ fill: '#10B981', strokeWidth: 0, r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* History */}
      {logs.length > 0 && (
        <div className="bg-gray-900/40 rounded-xl p-3 border border-gray-800/60">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center justify-between w-full text-xs text-gray-400 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className={`w-4 h-4 transition-transform ${showHistory ? 'rotate-90' : ''}`}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
              History ({logs.length} {logs.length === 1 ? 'entry' : 'entries'})
            </span>
            <span className="text-xs text-gray-500">
              {showHistory ? 'Hide' : 'View'}
            </span>
          </button>

          {showHistory && (
            <div className="mt-3 space-y-2 max-h-40 overflow-y-auto pr-1">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start justify-between bg-gray-900/70 rounded-lg p-2.5"
                >
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-primary-green font-medium text-sm">
                        {log.percentage}%
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(log.logged_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {log.notes && (
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">{log.notes}</p>
                    )}
                  </div>
                  <button
                    onClick={() => deleteLogMutation.mutate(log.id)}
                    disabled={deleteLogMutation.isPending}
                    className="p-1.5 text-gray-500 hover:text-primary-red transition-colors disabled:opacity-50"
                    title="Delete log entry"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {isLoading && (
        <div className="text-gray-400 text-sm">Loading progress history...</div>
      )}
    </div>
  )
}
