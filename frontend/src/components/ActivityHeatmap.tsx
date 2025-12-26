import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { statsAPI } from '@/lib/api'

interface HeatmapData {
  date: string
  count: number
  value: number
}

interface HeatmapSummary {
  totalSessions: number
  totalMinutes: number
  totalHours: number
  activeDays: number
  currentStreak: number
  longestStreak: number
}

interface ActivityHeatmapProps {
  type?: 'activity' | 'completion'
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function getLevel(value: number, maxValue: number): 0 | 1 | 2 | 3 | 4 {
  if (value === 0) return 0
  const ratio = value / maxValue
  if (ratio < 0.25) return 1
  if (ratio < 0.5) return 2
  if (ratio < 0.75) return 3
  return 4
}

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
}

export function ActivityHeatmap({ type = 'activity' }: ActivityHeatmapProps) {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [hoveredDay, setHoveredDay] = useState<{
    date: string
    count: number
    value: number
    x: number
    y: number
  } | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: [type === 'activity' ? 'activityHeatmap' : 'completionHeatmap', year],
    queryFn: async () => {
      const response =
        type === 'activity'
          ? await statsAPI.getActivityHeatmap(year)
          : await statsAPI.getCompletionHeatmap(year)
      return response.data as {
        data: HeatmapData[]
        summary: HeatmapSummary
      }
    },
  })

  const { calendar, maxValue, monthLabels } = useMemo(() => {
    const startDate = new Date(year, 0, 1)
    const endDate = new Date(year, 11, 31)
    const dataMap = new Map<string, HeatmapData>()

    if (data?.data) {
      data.data.forEach((d) => dataMap.set(d.date, d))
    }

    const weeks: Array<Array<{ date: Date; data: HeatmapData | null } | null>> = []
    let currentWeek: Array<{ date: Date; data: HeatmapData | null } | null> = []

    const startDayOfWeek = startDate.getDay()
    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek.push(null)
    }

    let maxVal = 0
    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0]
      const dayData = dataMap.get(dateStr) || null
      if (dayData && dayData.value > maxVal) {
        maxVal = dayData.value
      }

      currentWeek.push({ date: new Date(currentDate), data: dayData })

      if (currentWeek.length === 7) {
        weeks.push(currentWeek)
        currentWeek = []
      }

      currentDate.setDate(currentDate.getDate() + 1)
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null)
      }
      weeks.push(currentWeek)
    }

    const labels: Array<{ month: string; weekIndex: number }> = []
    let lastMonth = -1
    weeks.forEach((week, weekIndex) => {
      const validDay = week.find((d) => d !== null)
      if (validDay) {
        const month = validDay.date.getMonth()
        if (month !== lastMonth) {
          labels.push({ month: MONTHS[month], weekIndex })
          lastMonth = month
        }
      }
    })

    return { calendar: weeks, maxValue: maxVal || 1, monthLabels: labels }
  }, [year, data])

  const summary = data?.summary

  const levelColors = {
    activity: ['#1a1a1a', '#083344', '#0e7490', '#06b6d4', '#22d3ee'],
    completion: ['#1a1a1a', '#2d1f4a', '#4c2889', '#8b5cf6', '#a78bfa'],
  }

  const colors = levelColors[type]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          {type === 'activity' ? 'Play Activity' : 'Completion Activity'}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setYear((y) => y - 1)}
            disabled={year <= 2020}
            className="p-1 text-gray-400 hover:text-white disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <span className="text-white font-medium min-w-[60px] text-center">{year}</span>
          <button
            onClick={() => setYear((y) => y + 1)}
            disabled={year >= currentYear}
            className="p-1 text-gray-400 hover:text-white disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="text-xs text-gray-400">
              {type === 'activity' ? 'Total Sessions' : 'Total Logs'}
            </div>
            <div className="text-xl font-bold text-white">
              {type === 'activity' ? summary.totalSessions : (summary as any).totalLogs || 0}
            </div>
          </div>
          {type === 'activity' && (
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="text-xs text-gray-400">Total Playtime</div>
              <div className="text-xl font-bold text-primary-green">
                {formatMinutes(summary.totalMinutes)}
              </div>
            </div>
          )}
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="text-xs text-gray-400">Active Days</div>
            <div className="text-xl font-bold text-primary-cyan">{summary.activeDays}</div>
          </div>
          {type === 'activity' && (
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="text-xs text-gray-400">Current Streak</div>
              <div className="text-xl font-bold text-primary-purple">
                {summary.currentStreak} {summary.currentStreak === 1 ? 'day' : 'days'}
              </div>
            </div>
          )}
          {type === 'completion' && (
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="text-xs text-gray-400">Games Completed</div>
              <div className="text-xl font-bold text-primary-purple">
                {(summary as any).completedGames || 0}
              </div>
            </div>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="h-[140px] flex items-center justify-center text-gray-400">
          Loading activity data...
        </div>
      ) : (
        <div className="relative">
          <div className="relative h-4 ml-7 text-xs text-gray-500">
            {monthLabels.map(({ month, weekIndex }) => (
              <div
                key={`${month}-${weekIndex}`}
                className="absolute"
                style={{ left: weekIndex * 12 }}
              >
                {month}
              </div>
            ))}
          </div>
          <div className="flex gap-[2px]">
            <div className="flex flex-col gap-[2px] text-xs text-gray-500 mr-1 shrink-0">
              {DAYS.map((day, i) => (
                <div
                  key={day}
                  className="h-[10px] text-right pr-1 leading-[10px]"
                  style={{ visibility: i % 2 === 1 ? 'visible' : 'hidden' }}
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="flex gap-[2px] flex-1 min-w-0">
              {calendar.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-[2px] flex-1 min-w-0">
                  {week.map((day, dayIndex) => {
                    if (!day) {
                      return <div key={dayIndex} className="aspect-square w-full max-w-[10px]" />
                    }
                    const level = day.data ? getLevel(day.data.value, maxValue) : 0
                    return (
                      <div
                        key={dayIndex}
                        className="aspect-square w-full max-w-[10px] rounded-sm cursor-pointer transition-all hover:ring-1 hover:ring-white"
                        style={{ backgroundColor: colors[level] }}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect()
                          setHoveredDay({
                            date: day.date.toLocaleDateString(),
                            count: day.data?.count || 0,
                            value: day.data?.value || 0,
                            x: rect.left + rect.width / 2,
                            y: rect.top - 10,
                          })
                        }}
                        onMouseLeave={() => setHoveredDay(null)}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          {hoveredDay && (
            <div
              className="fixed z-50 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm pointer-events-none transform -translate-x-1/2 -translate-y-full"
              style={{ left: hoveredDay.x, top: hoveredDay.y }}
            >
              <div className="font-medium text-white">{hoveredDay.date}</div>
              {hoveredDay.count > 0 ? (
                <div className="text-gray-400">
                  {type === 'activity'
                    ? `${hoveredDay.count} session${hoveredDay.count > 1 ? 's' : ''}, ${formatMinutes(hoveredDay.value)}`
                    : `${hoveredDay.count} update${hoveredDay.count > 1 ? 's' : ''}`}
                </div>
              ) : (
                <div className="text-gray-500">No activity</div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-1 mt-2 text-xs text-gray-500">
            <span>Less</span>
            {colors.map((color, i) => (
              <div
                key={i}
                className="w-[10px] h-[10px] rounded-sm"
                style={{ backgroundColor: color }}
              />
            ))}
            <span>More</span>
          </div>
        </div>
      )}
    </div>
  )
}
