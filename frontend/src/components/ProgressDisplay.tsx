import { useQuery } from '@tanstack/react-query'
import { completionLogsAPI, CompletionType } from '@/lib/api'
import { Link } from '@tanstack/react-router'

interface DLCSummary {
  dlcId: string
  name: string
  percentage: number
  weight: number
  requiredForFull: boolean
  owned?: boolean
}

interface CompletionSummary {
  main: number
  full: number
  completionist: number
  dlcs: DLCSummary[]
  achievementPercentage: number
  hasDlcs: boolean
}

interface ProgressDisplayProps {
  gameId: string
}

const TYPE_COLORS: Record<CompletionType, string> = {
  main: '#10B981',
  dlc: '#8B5CF6',
  full: '#06B6D4',
  completionist: '#F59E0B',
}

export function ProgressDisplay({ gameId }: ProgressDisplayProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['completionLogs', gameId],
    queryFn: async () => {
      const response = await completionLogsAPI.getAll(gameId, { limit: 1 })
      return response.data as {
        logs: unknown[]
        total: number
        currentPercentage: number
        summary: CompletionSummary
      }
    },
  })

  if (isLoading) {
    return (
      <div className="bg-ctp-surface0/50 rounded-lg p-3 animate-pulse">
        <div className="h-4 bg-ctp-surface1 rounded w-1/2 mb-2" />
        <div className="h-6 bg-ctp-surface1 rounded w-1/3" />
      </div>
    )
  }

  const summary = data?.summary || { main: 0, full: 0, completionist: 0, dlcs: [], achievementPercentage: 100, hasDlcs: false }
  const mainProgress = summary.main
  const fullProgress = summary.full
  const hasDlcs = summary.hasDlcs

  return (
    <Link
      to="."
      hash="stats"
      className="block bg-ctp-surface0/50 border border-ctp-surface1 hover:border-ctp-teal/50 rounded-lg p-3 transition-colors group"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-ctp-subtext0 group-hover:text-ctp-subtext1">
          {hasDlcs ? 'Full Progress' : 'Main Progress'}
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 text-ctp-overlay1 group-hover:text-ctp-teal">
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold" style={{ color: hasDlcs ? TYPE_COLORS.full : TYPE_COLORS.main }}>
          {hasDlcs ? fullProgress : mainProgress}
        </span>
        <span className="text-sm text-ctp-subtext0">%</span>
      </div>
      <div className="mt-2 w-full bg-ctp-mantle rounded-full h-1.5">
        <div
          className="h-1.5 rounded-full transition-all duration-200"
          style={{
            width: `${hasDlcs ? fullProgress : mainProgress}%`,
            backgroundColor: hasDlcs ? TYPE_COLORS.full : TYPE_COLORS.main,
          }}
        />
      </div>
      {hasDlcs && (
        <div className="mt-2 flex gap-3 text-xs">
          <span style={{ color: TYPE_COLORS.main }}>Main: {mainProgress}%</span>
          {summary.dlcs.filter((d) => d.owned !== false).length > 0 && (
            <span style={{ color: TYPE_COLORS.dlc }}>
              DLCs: {Math.floor(
                summary.dlcs
                  .filter((d) => d.owned !== false)
                  .reduce((acc, d) => acc + d.percentage, 0) /
                  summary.dlcs.filter((d) => d.owned !== false).length
              )}%
            </span>
          )}
        </div>
      )}
      {summary.completionist > 0 && (
        <div className="mt-1 flex gap-3 text-xs">
          <span style={{ color: TYPE_COLORS.completionist }}>100%: {summary.completionist}%</span>
        </div>
      )}
    </Link>
  )
}
