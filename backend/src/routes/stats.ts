import { router } from '@/lib/router'
import { requireAuth } from '@/middleware/auth'
import { queryMany } from '@/services/db'
import { corsHeaders } from '@/middleware/cors'

interface HeatmapData {
  date: string
  count: number
  value: number
}

// Get activity heatmap data (play sessions)
router.get(
  '/api/stats/activity-heatmap',
  requireAuth(async (req, user) => {
    try {
      const url = new URL(req.url)
      const year = parseInt(url.searchParams.get('year') || new Date().getFullYear().toString())

      const startDate = `${year}-01-01`
      const endDate = `${year}-12-31`

      const data = await queryMany<HeatmapData>(
        `SELECT 
          TO_CHAR(DATE(started_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') as date,
          COUNT(*) as count,
          COALESCE(SUM(duration_minutes), 0) as value
        FROM play_sessions
        WHERE user_id = $1 
          AND started_at >= $2 
          AND started_at <= $3
          AND ended_at IS NOT NULL
        GROUP BY DATE(started_at AT TIME ZONE 'UTC')
        ORDER BY date`,
        [user.id, startDate, endDate]
      )

      // Calculate summary stats
      const totalSessions = data.reduce((sum, d) => sum + Number(d.count), 0)
      const totalMinutes = data.reduce((sum, d) => sum + Number(d.value), 0)
      const activeDays = data.length

      // Calculate current streak
      let currentStreak = 0
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const dateSet = new Set(data.map((d) => d.date))

      for (let i = 0; i <= 365; i++) {
        const checkDate = new Date(today)
        checkDate.setDate(checkDate.getDate() - i)
        const dateStr = checkDate.toISOString().split('T')[0]

        if (dateSet.has(dateStr)) {
          currentStreak++
        } else if (i > 0) {
          break
        }
      }

      // Calculate longest streak
      let longestStreak = 0
      let tempStreak = 0
      const sortedDates = Array.from(dateSet).sort()

      for (let i = 0; i < sortedDates.length; i++) {
        if (i === 0) {
          tempStreak = 1
        } else {
          const prevDate = new Date(sortedDates[i - 1])
          const currDate = new Date(sortedDates[i])
          const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))

          if (diffDays === 1) {
            tempStreak++
          } else {
            longestStreak = Math.max(longestStreak, tempStreak)
            tempStreak = 1
          }
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak)

      return new Response(
        JSON.stringify({
          data,
          summary: {
            totalSessions,
            totalMinutes,
            totalHours: Math.round(totalMinutes / 60),
            activeDays,
            currentStreak,
            longestStreak,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    } catch (error) {
      console.error('Get activity heatmap error:', error)
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    }
  })
)

// Get completion heatmap data
router.get(
  '/api/stats/completion-heatmap',
  requireAuth(async (req, user) => {
    try {
      const url = new URL(req.url)
      const year = parseInt(url.searchParams.get('year') || new Date().getFullYear().toString())

      const startDate = `${year}-01-01`
      const endDate = `${year}-12-31`

      const data = await queryMany<HeatmapData>(
        `SELECT 
          TO_CHAR(DATE(logged_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') as date,
          COUNT(*) as count,
          SUM(percentage) as value
        FROM completion_logs
        WHERE user_id = $1 
          AND logged_at >= $2 
          AND logged_at <= $3
        GROUP BY DATE(logged_at AT TIME ZONE 'UTC')
        ORDER BY date`,
        [user.id, startDate, endDate]
      )

      // Calculate summary stats
      const totalLogs = data.reduce((sum, d) => sum + Number(d.count), 0)
      const activeDays = data.length

      // Count games that reached 100%
      const completedGames = await queryMany<{ game_id: string }>(
        `SELECT DISTINCT game_id
         FROM completion_logs
         WHERE user_id = $1 
           AND logged_at >= $2 
           AND logged_at <= $3
           AND percentage = 100`,
        [user.id, startDate, endDate]
      )

      return new Response(
        JSON.stringify({
          data,
          summary: {
            totalLogs,
            activeDays,
            completedGames: completedGames.length,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    } catch (error) {
      console.error('Get completion heatmap error:', error)
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    }
  })
)

// Get recent activity feed
router.get(
  '/api/stats/activity-feed',
  requireAuth(async (req, user) => {
    try {
      const url = new URL(req.url)
      const limit = parseInt(url.searchParams.get('limit') || '20')

      // Get recent sessions
      const sessions = await queryMany<{
        type: string
        id: string
        game_id: string
        game_name: string
        platform_name: string
        timestamp: string
        duration_minutes: number | null
      }>(
        `SELECT 
          'session' as type,
          ps.id,
          ps.game_id,
          g.name as game_name,
          p.display_name as platform_name,
          ps.ended_at as timestamp,
          ps.duration_minutes
        FROM play_sessions ps
        INNER JOIN games g ON ps.game_id = g.id
        INNER JOIN platforms p ON ps.platform_id = p.id
        WHERE ps.user_id = $1 AND ps.ended_at IS NOT NULL
        ORDER BY ps.ended_at DESC
        LIMIT $2`,
        [user.id, limit]
      )

      // Get recent completion logs
      const completions = await queryMany<{
        type: string
        id: string
        game_id: string
        game_name: string
        platform_name: string
        timestamp: string
        percentage: number
      }>(
        `SELECT 
          'completion' as type,
          cl.id,
          cl.game_id,
          g.name as game_name,
          p.display_name as platform_name,
          cl.logged_at as timestamp,
          cl.percentage
        FROM completion_logs cl
        INNER JOIN games g ON cl.game_id = g.id
        INNER JOIN platforms p ON cl.platform_id = p.id
        WHERE cl.user_id = $1
        ORDER BY cl.logged_at DESC
        LIMIT $2`,
        [user.id, limit]
      )

      // Combine and sort
      const feed = [...sessions, ...completions]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit)

      return new Response(JSON.stringify({ feed }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      })
    } catch (error) {
      console.error('Get activity feed error:', error)
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    }
  })
)
