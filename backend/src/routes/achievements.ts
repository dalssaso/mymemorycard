import { router } from '@/lib/router'
import { requireAuth } from '@/middleware/auth'
import { queryMany, query, queryOne } from '@/services/db'
import { corsHeaders } from '@/middleware/cors'
import { getGameAchievements } from '@/services/rawg'

interface GameAchievement {
  rawg_achievement_id: number
  name: string
  description: string | null
  image_url: string | null
  rarity_percent: number | null
  completed: boolean
  completed_at: string | null
}

router.get(
  '/api/games/:id/achievements',
  requireAuth(async (req, user, params) => {
    try {
      const gameId = params?.id
      if (!gameId) {
        return new Response(
          JSON.stringify({ error: 'Game ID is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      const game = await queryOne<{ rawg_id: number | null }>(
        'SELECT rawg_id FROM games WHERE id = $1',
        [gameId]
      )

      if (!game) {
        return new Response(
          JSON.stringify({ error: 'Game not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      if (!game.rawg_id) {
        return new Response(
          JSON.stringify({ achievements: [], message: 'No RAWG ID for this game' }),
          { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      const cachedAchievements = await queryMany<{
        rawg_achievement_id: number
        name: string
        description: string | null
        image_url: string | null
        rarity_percent: number | null
      }>(
        'SELECT rawg_achievement_id, name, description, image_url, rarity_percent FROM game_rawg_achievements WHERE game_id = $1',
        [gameId]
      )

      let achievements: GameAchievement[]

      if (cachedAchievements.length === 0) {
        const rawgAchievements = await getGameAchievements(game.rawg_id)

        if (rawgAchievements.length > 0) {
          for (const ach of rawgAchievements) {
            await query(
              `INSERT INTO game_rawg_achievements (game_id, rawg_achievement_id, name, description, image_url, rarity_percent)
               VALUES ($1, $2, $3, $4, $5, $6)
               ON CONFLICT (game_id, rawg_achievement_id) DO NOTHING`,
              [gameId, ach.id, ach.name, ach.description, ach.image, parseFloat(ach.percent) || null]
            )
          }
        }

        const userProgress = await queryMany<{
          rawg_achievement_id: number
          completed: boolean
          completed_at: string | null
        }>(
          'SELECT rawg_achievement_id, completed, completed_at FROM user_rawg_achievements WHERE user_id = $1 AND game_id = $2',
          [user.id, gameId]
        )

        const progressMap = new Map(
          userProgress.map((p) => [p.rawg_achievement_id, p])
        )

        achievements = rawgAchievements.map((ach) => {
          const progress = progressMap.get(ach.id)
          return {
            rawg_achievement_id: ach.id,
            name: ach.name,
            description: ach.description,
            image_url: ach.image,
            rarity_percent: parseFloat(ach.percent) || null,
            completed: progress?.completed ?? false,
            completed_at: progress?.completed_at ?? null,
          }
        })
      } else {
        const userProgress = await queryMany<{
          rawg_achievement_id: number
          completed: boolean
          completed_at: string | null
        }>(
          'SELECT rawg_achievement_id, completed, completed_at FROM user_rawg_achievements WHERE user_id = $1 AND game_id = $2',
          [user.id, gameId]
        )

        const progressMap = new Map(
          userProgress.map((p) => [p.rawg_achievement_id, p])
        )

        achievements = cachedAchievements.map((ach) => {
          const progress = progressMap.get(ach.rawg_achievement_id)
          return {
            ...ach,
            completed: progress?.completed ?? false,
            completed_at: progress?.completed_at ?? null,
          }
        })
      }

      return new Response(
        JSON.stringify({ achievements }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    } catch (error) {
      console.error('Get achievements error:', error)
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    }
  })
)

router.put(
  '/api/games/:id/achievements/:achievementId',
  requireAuth(async (req, user, params) => {
    try {
      const gameId = params?.id
      const achievementId = params?.achievementId
      const body = (await req.json()) as { completed?: boolean }
      const { completed } = body

      if (!gameId || !achievementId) {
        return new Response(
          JSON.stringify({ error: 'Game ID and achievement ID are required' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      if (completed === undefined) {
        return new Response(
          JSON.stringify({ error: 'completed field is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      const ownership = await query(
        'SELECT 1 FROM user_games WHERE user_id = $1 AND game_id = $2',
        [user.id, gameId]
      )

      if (ownership.rowCount === 0) {
        return new Response(
          JSON.stringify({ error: 'Game not found in your library' }),
          { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      const rawgAchievementId = parseInt(achievementId, 10)
      const completedAt = completed ? new Date().toISOString() : null

      await query(
        `INSERT INTO user_rawg_achievements (user_id, game_id, rawg_achievement_id, completed, completed_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id, game_id, rawg_achievement_id)
         DO UPDATE SET completed = $4, completed_at = CASE WHEN $4 = true AND user_rawg_achievements.completed_at IS NULL THEN $5 ELSE CASE WHEN $4 = false THEN NULL ELSE user_rawg_achievements.completed_at END END`,
        [user.id, gameId, rawgAchievementId, completed, completedAt]
      )

      return new Response(
        JSON.stringify({ success: true, completed, completed_at: completed ? completedAt : null }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    } catch (error) {
      console.error('Update achievement error:', error)
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    }
  })
)
