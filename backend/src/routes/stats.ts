import { router } from '@/lib/router'
import { requireAuth } from '@/middleware/auth'
import { queryMany } from '@/services/db'
import { corsHeaders } from '@/middleware/cors'

interface HeatmapData {
  date: string
  count: number
  value: number
}

interface CombinedHeatmapDay {
  date: string
  sessions: { count: number; minutes: number }
  completions: { count: number }
  achievements: { count: number }
  total: number
}

// Get combined heatmap data (all activity types)
router.get(
  '/api/stats/combined-heatmap',
  requireAuth(async (req, user) => {
    try {
      const url = new URL(req.url)
      const year = parseInt(url.searchParams.get('year') || new Date().getFullYear().toString())

      const startDate = `${year}-01-01`
      const endDate = `${year}-12-31`

      // Get sessions data
      const sessionsData = await queryMany<{ date: string; count: number; minutes: number }>(
        `SELECT 
          TO_CHAR(DATE(started_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') as date,
          COUNT(*) as count,
          COALESCE(SUM(duration_minutes), 0) as minutes
        FROM play_sessions
        WHERE user_id = $1 
          AND started_at >= $2 
          AND started_at <= $3
          AND ended_at IS NOT NULL
        GROUP BY DATE(started_at AT TIME ZONE 'UTC')`,
        [user.id, startDate, endDate]
      )

      // Get completion data
      const completionsData = await queryMany<{ date: string; count: number }>(
        `SELECT 
          TO_CHAR(DATE(logged_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') as date,
          COUNT(*) as count
        FROM completion_logs
        WHERE user_id = $1 
          AND logged_at >= $2 
          AND logged_at <= $3
        GROUP BY DATE(logged_at AT TIME ZONE 'UTC')`,
        [user.id, startDate, endDate]
      )

      // Get achievements data
      const achievementsData = await queryMany<{ date: string; count: number }>(
        `SELECT 
          TO_CHAR(DATE(completed_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') as date,
          COUNT(*) as count
        FROM user_rawg_achievements
        WHERE user_id = $1 
          AND completed = true
          AND completed_at >= $2 
          AND completed_at <= $3
        GROUP BY DATE(completed_at AT TIME ZONE 'UTC')`,
        [user.id, startDate, endDate]
      )

      // Combine all data by date
      const dateMap = new Map<string, CombinedHeatmapDay>()

      for (const s of sessionsData) {
        const existing = dateMap.get(s.date) || {
          date: s.date,
          sessions: { count: 0, minutes: 0 },
          completions: { count: 0 },
          achievements: { count: 0 },
          total: 0,
        }
        existing.sessions = { count: Number(s.count), minutes: Number(s.minutes) }
        existing.total += Number(s.count)
        dateMap.set(s.date, existing)
      }

      for (const c of completionsData) {
        const existing = dateMap.get(c.date) || {
          date: c.date,
          sessions: { count: 0, minutes: 0 },
          completions: { count: 0 },
          achievements: { count: 0 },
          total: 0,
        }
        existing.completions = { count: Number(c.count) }
        existing.total += Number(c.count)
        dateMap.set(c.date, existing)
      }

      for (const a of achievementsData) {
        const existing = dateMap.get(a.date) || {
          date: a.date,
          sessions: { count: 0, minutes: 0 },
          completions: { count: 0 },
          achievements: { count: 0 },
          total: 0,
        }
        existing.achievements = { count: Number(a.count) }
        existing.total += Number(a.count)
        dateMap.set(a.date, existing)
      }

      const data = Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date))

      // Calculate summary stats
      const totalSessions = sessionsData.reduce((sum, d) => sum + Number(d.count), 0)
      const totalMinutes = sessionsData.reduce((sum, d) => sum + Number(d.minutes), 0)
      const totalCompletions = completionsData.reduce((sum, d) => sum + Number(d.count), 0)
      const totalAchievements = achievementsData.reduce((sum, d) => sum + Number(d.count), 0)
      const activeDays = dateMap.size

      // Calculate current streak (any activity)
      let currentStreak = 0
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const dateSet = new Set(dateMap.keys())

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

      return new Response(
        JSON.stringify({
          data,
          summary: {
            totalSessions,
            totalMinutes,
            totalHours: Math.round(totalMinutes / 60),
            totalCompletions,
            totalAchievements,
            activeDays,
            currentStreak,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    } catch (error) {
      console.error('Get combined heatmap error:', error)
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    }
  })
)

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

// Get achievement heatmap data
router.get(
  '/api/stats/achievement-heatmap',
  requireAuth(async (req, user) => {
    try {
      const url = new URL(req.url)
      const year = parseInt(url.searchParams.get('year') || new Date().getFullYear().toString())

      const startDate = `${year}-01-01`
      const endDate = `${year}-12-31`

      const data = await queryMany<HeatmapData>(
        `SELECT 
          TO_CHAR(DATE(completed_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') as date,
          COUNT(*) as count,
          COUNT(*) as value
        FROM user_rawg_achievements
        WHERE user_id = $1 
          AND completed = true
          AND completed_at >= $2 
          AND completed_at <= $3
        GROUP BY DATE(completed_at AT TIME ZONE 'UTC')
        ORDER BY date`,
        [user.id, startDate, endDate]
      )

      const totalAchievements = data.reduce((sum, d) => sum + Number(d.count), 0)
      const activeDays = data.length

      const rareAchievements = await queryMany<{ count: number }>(
        `SELECT COUNT(*) as count
         FROM user_rawg_achievements ura
         INNER JOIN game_rawg_achievements gra ON ura.game_id = gra.game_id 
           AND ura.rawg_achievement_id = gra.rawg_achievement_id
         WHERE ura.user_id = $1 
           AND ura.completed = true
           AND ura.completed_at >= $2 
           AND ura.completed_at <= $3
           AND gra.rarity_percent < 15`,
        [user.id, startDate, endDate]
      )

      return new Response(
        JSON.stringify({
          data,
          summary: {
            totalAchievements,
            activeDays,
            rareAchievements: Number(rareAchievements[0]?.count || 0),
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    } catch (error) {
      console.error('Get achievement heatmap error:', error)
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    }
  })
)

// Get global achievement stats
router.get(
  '/api/stats/achievements',
  requireAuth(async (_req, user) => {
    try {
      const stats = await queryMany<{
        game_id: string
        game_name: string
        cover_art_url: string | null
        total_achievements: number
        completed_achievements: number
        avg_rarity: number | null
        rarest_achievement_name: string | null
        rarest_achievement_rarity: number | null
      }>(
        `WITH game_achievement_stats AS (
          SELECT 
            g.id as game_id,
            g.name as game_name,
            g.cover_art_url,
            COUNT(gra.rawg_achievement_id) as total_achievements,
            COUNT(ura.rawg_achievement_id) FILTER (WHERE ura.completed = true) as completed_achievements,
            AVG(gra.rarity_percent) as avg_rarity,
            MIN(gra.rarity_percent) FILTER (WHERE ura.completed = true) as min_completed_rarity
          FROM games g
          INNER JOIN user_games ug ON g.id = ug.game_id AND ug.user_id = $1
          INNER JOIN game_rawg_achievements gra ON g.id = gra.game_id
          LEFT JOIN user_rawg_achievements ura ON gra.game_id = ura.game_id 
            AND gra.rawg_achievement_id = ura.rawg_achievement_id 
            AND ura.user_id = $1
          GROUP BY g.id, g.name, g.cover_art_url
          HAVING COUNT(gra.rawg_achievement_id) > 0
        ),
        rarest_achievements AS (
          SELECT DISTINCT ON (gas.game_id)
            gas.game_id,
            gra.name as rarest_achievement_name,
            gra.rarity_percent as rarest_achievement_rarity
          FROM game_achievement_stats gas
          INNER JOIN game_rawg_achievements gra ON gas.game_id = gra.game_id
          INNER JOIN user_rawg_achievements ura ON gra.game_id = ura.game_id 
            AND gra.rawg_achievement_id = ura.rawg_achievement_id 
            AND ura.user_id = $1 AND ura.completed = true
          WHERE gas.min_completed_rarity IS NOT NULL
          ORDER BY gas.game_id, gra.rarity_percent ASC
        )
        SELECT 
          gas.game_id,
          gas.game_name,
          gas.cover_art_url,
          gas.total_achievements,
          gas.completed_achievements,
          gas.avg_rarity,
          ra.rarest_achievement_name,
          ra.rarest_achievement_rarity
        FROM game_achievement_stats gas
        LEFT JOIN rarest_achievements ra ON gas.game_id = ra.game_id
        ORDER BY gas.completed_achievements DESC`,
        [user.id]
      )

      const totalAchievements = stats.reduce((sum, g) => sum + Number(g.total_achievements), 0)
      const completedAchievements = stats.reduce((sum, g) => sum + Number(g.completed_achievements), 0)
      const overallPercentage = totalAchievements > 0 
        ? Math.round((completedAchievements / totalAchievements) * 100) 
        : 0

      const gamesWithAchievements = stats.length
      const perfectGames = stats.filter(g => Number(g.completed_achievements) === Number(g.total_achievements)).length

      const rarestUnlocked = stats
        .filter(g => g.rarest_achievement_rarity !== null)
        .sort((a, b) => (a.rarest_achievement_rarity ?? 100) - (b.rarest_achievement_rarity ?? 100))
        .slice(0, 5)
        .map(g => ({
          gameName: g.game_name,
          coverArtUrl: g.cover_art_url,
          achievementName: g.rarest_achievement_name,
          rarity: g.rarest_achievement_rarity,
        }))

      const rarityBuckets = {
        legendary: 0,
        rare: 0,
        uncommon: 0,
        common: 0,
      }

      for (const game of stats) {
        const achievementDetails = await queryMany<{ rarity_percent: number | null; completed: boolean }>(
          `SELECT gra.rarity_percent, COALESCE(ura.completed, false) as completed
           FROM game_rawg_achievements gra
           LEFT JOIN user_rawg_achievements ura ON gra.game_id = ura.game_id 
             AND gra.rawg_achievement_id = ura.rawg_achievement_id 
             AND ura.user_id = $1
           WHERE gra.game_id = $2 AND COALESCE(ura.completed, false) = true`,
          [user.id, game.game_id]
        )

        for (const ach of achievementDetails) {
          const rarity = ach.rarity_percent ?? 50
          if (rarity < 5) rarityBuckets.legendary++
          else if (rarity < 15) rarityBuckets.rare++
          else if (rarity < 35) rarityBuckets.uncommon++
          else rarityBuckets.common++
        }
      }

      const gameStats = stats.map(g => ({
        gameId: g.game_id,
        gameName: g.game_name,
        coverArtUrl: g.cover_art_url,
        total: Number(g.total_achievements),
        completed: Number(g.completed_achievements),
        percentage: Number(g.total_achievements) > 0 
          ? Math.round((Number(g.completed_achievements) / Number(g.total_achievements)) * 100)
          : 0,
      }))

      return new Response(
        JSON.stringify({
          summary: {
            totalAchievements,
            completedAchievements,
            overallPercentage,
            gamesWithAchievements,
            perfectGames,
          },
          rarityBreakdown: rarityBuckets,
          rarestUnlocked,
          gameStats,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    } catch (error) {
      console.error('Get achievement stats error:', error)
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

      // Get recent achievement unlocks
      const achievements = await queryMany<{
        type: string
        id: string
        game_id: string
        game_name: string
        platform_name: string
        timestamp: string
        achievement_name: string
        rarity_percent: number | null
      }>(
        `SELECT 
          'achievement' as type,
          ura.id::text as id,
          ura.game_id,
          g.name as game_name,
          p.display_name as platform_name,
          ura.completed_at as timestamp,
          gra.name as achievement_name,
          gra.rarity_percent
        FROM user_rawg_achievements ura
        INNER JOIN games g ON ura.game_id = g.id
        INNER JOIN platforms p ON ura.platform_id = p.id
        INNER JOIN game_rawg_achievements gra ON ura.game_id = gra.game_id 
          AND ura.rawg_achievement_id = gra.rawg_achievement_id
        WHERE ura.user_id = $1 AND ura.completed = true AND ura.completed_at IS NOT NULL
        ORDER BY ura.completed_at DESC
        LIMIT $2`,
        [user.id, limit]
      )

      // Combine and sort
      const feed = [...sessions, ...completions, ...achievements]
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
