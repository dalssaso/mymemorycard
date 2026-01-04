import { randomUUID } from 'crypto'
import { router } from '@/lib/router'
import { requireAuth } from '@/middleware/auth'
import { queryMany, query, queryOne } from '@/services/db'
import { corsHeaders } from '@/middleware/cors'
import { getGameAchievements } from '@/services/rawg'

interface GameAchievement {
  achievement_id: string
  source: 'rawg' | 'manual'
  name: string
  description: string | null
  image_url: string | null
  rarity_percent: number | null
  completed: boolean
  completed_at: string | null
  can_delete: boolean
}

router.get(
  '/api/games/:id/achievements',
  requireAuth(async (req, user, params) => {
    try {
      const gameId = params?.id
      const url = new URL(req.url)
      const platformId = url.searchParams.get('platform_id')

      if (!gameId) {
        return new Response(JSON.stringify({ error: 'Game ID is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        })
      }

      if (!platformId) {
        return new Response(JSON.stringify({ error: 'Platform ID is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        })
      }

      const game = await queryOne<{ rawg_id: number | null }>(
        'SELECT rawg_id FROM games WHERE id = $1',
        [gameId]
      )

      if (!game) {
        return new Response(JSON.stringify({ error: 'Game not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        })
      }

      const manualAchievements = await queryMany<{
        id: string
        name: string | null
        description: string | null
        icon_url: string | null
        rarity_percentage: number | null
        unlocked: boolean
        unlock_date: string | null
      }>(
        `SELECT 
          a.id,
          a.name,
          a.description,
          a.icon_url,
          a.rarity_percentage,
          ua.unlocked,
          ua.unlock_date
        FROM achievements a
        INNER JOIN user_achievements ua ON a.id = ua.achievement_id
        WHERE a.game_id = $1 AND a.platform_id = $2 AND ua.user_id = $3`,
        [gameId, platformId, user.id]
      )

      const manualMapped: GameAchievement[] = manualAchievements.map((ach) => ({
        achievement_id: ach.id,
        source: 'manual',
        name: ach.name ?? 'Untitled achievement',
        description: ach.description,
        image_url: ach.icon_url,
        rarity_percent: ach.rarity_percentage,
        completed: ach.unlocked,
        completed_at: ach.unlock_date,
        can_delete: true,
      }))

      if (!game.rawg_id) {
        return new Response(
          JSON.stringify({
            achievements: manualMapped,
            message:
              manualMapped.length === 0 ? 'No achievements available for this game' : undefined,
          }),
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
              [
                gameId,
                ach.id,
                ach.name,
                ach.description,
                ach.image,
                parseFloat(ach.percent) || null,
              ]
            )
          }
        }

        const userProgress = await queryMany<{
          rawg_achievement_id: number
          completed: boolean
          completed_at: string | null
        }>(
          'SELECT rawg_achievement_id, completed, completed_at FROM user_rawg_achievements WHERE user_id = $1 AND game_id = $2 AND platform_id = $3',
          [user.id, gameId, platformId]
        )

        const progressMap = new Map(userProgress.map((p) => [p.rawg_achievement_id, p]))

        achievements = rawgAchievements.map((ach) => {
          const progress = progressMap.get(ach.id)
          return {
            achievement_id: ach.id.toString(),
            source: 'rawg',
            name: ach.name,
            description: ach.description,
            image_url: ach.image,
            rarity_percent: parseFloat(ach.percent) || null,
            completed: progress?.completed ?? false,
            completed_at: progress?.completed_at ?? null,
            can_delete: false,
          }
        })
      } else {
        const userProgress = await queryMany<{
          rawg_achievement_id: number
          completed: boolean
          completed_at: string | null
        }>(
          'SELECT rawg_achievement_id, completed, completed_at FROM user_rawg_achievements WHERE user_id = $1 AND game_id = $2 AND platform_id = $3',
          [user.id, gameId, platformId]
        )

        const progressMap = new Map(userProgress.map((p) => [p.rawg_achievement_id, p]))

        achievements = cachedAchievements.map((ach) => {
          const progress = progressMap.get(ach.rawg_achievement_id)
          return {
            achievement_id: ach.rawg_achievement_id.toString(),
            source: 'rawg',
            name: ach.name,
            description: ach.description,
            image_url: ach.image_url,
            rarity_percent: ach.rarity_percent,
            completed: progress?.completed ?? false,
            completed_at: progress?.completed_at ?? null,
            can_delete: false,
          }
        })
      }

      return new Response(JSON.stringify({ achievements: [...manualMapped, ...achievements] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      })
    } catch (error) {
      console.error('Get achievements error:', error)
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      })
    }
  })
)

router.post(
  '/api/games/:id/achievements/manual',
  requireAuth(async (req, user, params) => {
    try {
      const gameId = params?.id
      const body = (await req.json()) as {
        platform_id?: string
        name?: string
        description?: string | null
      }
      const { platform_id: platformId, name, description } = body

      if (!gameId) {
        return new Response(JSON.stringify({ error: 'Game ID is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        })
      }

      if (!platformId) {
        return new Response(JSON.stringify({ error: 'Platform ID is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        })
      }

      if (!name || !name.trim()) {
        return new Response(JSON.stringify({ error: 'Achievement name is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        })
      }

      const ownership = await queryOne<{ id: string }>(
        'SELECT id FROM user_games WHERE user_id = $1 AND game_id = $2 AND platform_id = $3',
        [user.id, gameId, platformId]
      )

      if (!ownership) {
        return new Response(
          JSON.stringify({ error: 'Game not found in your library for this platform' }),
          { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      const achievementId = `manual_${randomUUID()}`
      const created = await queryOne<{
        id: string
        name: string | null
        description: string | null
      }>(
        `INSERT INTO achievements (game_id, platform_id, achievement_id, name, description)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, name, description`,
        [gameId, platformId, achievementId, name.trim(), description?.trim() || null]
      )

      if (!created) {
        return new Response(JSON.stringify({ error: 'Failed to create achievement' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        })
      }

      await query(
        `INSERT INTO user_achievements (user_id, achievement_id, unlocked, unlock_date)
         VALUES ($1, $2, false, NULL)
         ON CONFLICT (user_id, achievement_id) DO NOTHING`,
        [user.id, created.id]
      )

      return new Response(
        JSON.stringify({
          achievement: {
            achievement_id: created.id,
            source: 'manual',
            name: created.name ?? 'Untitled achievement',
            description: created.description,
            image_url: null,
            rarity_percent: null,
            completed: false,
            completed_at: null,
            can_delete: true,
          },
        }),
        { status: 201, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    } catch (error) {
      console.error('Create manual achievement error:', error)
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      })
    }
  })
)

router.post(
  '/api/games/:id/achievements/manual/bulk-delete',
  requireAuth(async (req, user, params) => {
    try {
      const gameId = params?.id
      const body = (await req.json()) as { platform_id?: string; achievementIds?: string[] }
      const { platform_id: platformId, achievementIds } = body

      if (!gameId) {
        return new Response(JSON.stringify({ error: 'Game ID is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        })
      }

      if (!platformId) {
        return new Response(JSON.stringify({ error: 'Platform ID is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        })
      }

      if (!achievementIds || achievementIds.length === 0) {
        return new Response(JSON.stringify({ error: 'Achievement IDs are required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        })
      }

      const validIds = achievementIds.filter((id) => /^[0-9a-f-]{36}$/i.test(id))
      if (validIds.length === 0) {
        return new Response(JSON.stringify({ error: 'No valid achievement IDs provided' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        })
      }

      const deleted = await queryMany<{ id: string }>(
        `DELETE FROM achievements a
         USING user_achievements ua
         WHERE a.id = ua.achievement_id
           AND ua.user_id = $1
           AND a.game_id = $2
           AND a.platform_id = $3
           AND a.id = ANY($4::uuid[])
         RETURNING a.id`,
        [user.id, gameId, platformId, validIds]
      )

      return new Response(JSON.stringify({ deletedIds: deleted.map((row) => row.id) }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      })
    } catch (error) {
      console.error('Bulk delete manual achievements error:', error)
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      })
    }
  })
)

router.put(
  '/api/games/:id/achievements/:achievementId',
  requireAuth(async (req, user, params) => {
    try {
      const gameId = params?.id
      const achievementId = params?.achievementId
      const body = (await req.json()) as { completed?: boolean; platform_id?: string }
      const { completed, platform_id: platformId } = body

      if (!gameId || !achievementId) {
        return new Response(JSON.stringify({ error: 'Game ID and achievement ID are required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        })
      }

      if (!platformId) {
        return new Response(JSON.stringify({ error: 'Platform ID is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        })
      }

      if (completed === undefined) {
        return new Response(JSON.stringify({ error: 'completed field is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        })
      }

      const ownership = await query(
        'SELECT 1 FROM user_games WHERE user_id = $1 AND game_id = $2 AND platform_id = $3',
        [user.id, gameId, platformId]
      )

      if (ownership.rowCount === 0) {
        return new Response(
          JSON.stringify({ error: 'Game not found in your library for this platform' }),
          { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      const completedAt = completed ? new Date().toISOString() : null
      const rawgAchievementId = Number(achievementId)

      if (Number.isNaN(rawgAchievementId)) {
        const achievement = await queryOne<{ id: string }>(
          `SELECT a.id 
           FROM achievements a
           INNER JOIN user_achievements ua ON a.id = ua.achievement_id
           WHERE a.id = $1 AND a.game_id = $2 AND a.platform_id = $3 AND ua.user_id = $4`,
          [achievementId, gameId, platformId, user.id]
        )

        if (!achievement) {
          return new Response(JSON.stringify({ error: 'Achievement not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json', ...corsHeaders() },
          })
        }

        await query(
          `INSERT INTO user_achievements (user_id, achievement_id, unlocked, unlock_date)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (user_id, achievement_id)
           DO UPDATE SET unlocked = $3, unlock_date = CASE WHEN $3 = true AND user_achievements.unlock_date IS NULL THEN $4 ELSE CASE WHEN $3 = false THEN NULL ELSE user_achievements.unlock_date END END`,
          [user.id, achievement.id, completed, completedAt]
        )

        if (completed) {
          const achievementStats = await queryOne<{ total: number; completedCount: number }>(
            `SELECT
               (SELECT COUNT(*) FROM game_rawg_achievements WHERE game_id = $1) +
               (SELECT COUNT(*) FROM achievements WHERE game_id = $1 AND platform_id = $2) as total,
               (SELECT COUNT(*) FROM user_rawg_achievements WHERE user_id = $3 AND game_id = $1 AND completed = true) +
               (SELECT COUNT(*)
                FROM achievements a
                INNER JOIN user_achievements ua ON a.id = ua.achievement_id
                WHERE a.game_id = $1 AND a.platform_id = $2 AND ua.user_id = $3 AND ua.unlocked = true) as "completedCount"`,
            [gameId, platformId, user.id]
          )

          const total = achievementStats?.total || 0
          const completedCount = achievementStats?.completedCount || 0

          if (total > 0 && completedCount === total) {
            const existingLog = await queryOne<{ id: string }>(
              `SELECT id FROM completion_logs
               WHERE user_id = $1 AND game_id = $2 AND platform_id = $3
                 AND completion_type = 'main' AND percentage = 100
               ORDER BY logged_at DESC LIMIT 1`,
              [user.id, gameId, platformId]
            )

            if (!existingLog) {
              await query(
                `INSERT INTO completion_logs (user_id, game_id, platform_id, completion_type, percentage, notes)
                 VALUES ($1, $2, $3, 'main', 100, 'Auto-logged: All achievements completed')`,
                [user.id, gameId, platformId]
              )
            }
          }
        }

        return new Response(
          JSON.stringify({
            success: true,
            completed,
            completed_at: completed ? completedAt : null,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      await query(
        `INSERT INTO user_rawg_achievements (user_id, game_id, platform_id, rawg_achievement_id, completed, completed_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (user_id, game_id, platform_id, rawg_achievement_id)
         DO UPDATE SET completed = $5, completed_at = CASE WHEN $5 = true AND user_rawg_achievements.completed_at IS NULL THEN $6 ELSE CASE WHEN $5 = false THEN NULL ELSE user_rawg_achievements.completed_at END END`,
        [user.id, gameId, platformId, rawgAchievementId, completed, completedAt]
      )

      if (completed) {
        const achievementStats = await queryOne<{ total: number; completedCount: number }>(
          `SELECT
             (SELECT COUNT(*) FROM game_rawg_achievements WHERE game_id = $1) +
             (SELECT COUNT(*) FROM achievements WHERE game_id = $1 AND platform_id = $2) as total,
             (SELECT COUNT(*) FROM user_rawg_achievements WHERE user_id = $3 AND game_id = $1 AND completed = true) +
             (SELECT COUNT(*)
              FROM achievements a
              INNER JOIN user_achievements ua ON a.id = ua.achievement_id
              WHERE a.game_id = $1 AND a.platform_id = $2 AND ua.user_id = $3 AND ua.unlocked = true) as "completedCount"`,
          [gameId, platformId, user.id]
        )

        const total = achievementStats?.total || 0
        const completedCount = achievementStats?.completedCount || 0

        if (total > 0 && completedCount === total) {
          const existingLog = await queryOne<{ id: string }>(
            `SELECT id FROM completion_logs
             WHERE user_id = $1 AND game_id = $2 AND platform_id = $3
               AND completion_type = 'main' AND percentage = 100
             ORDER BY logged_at DESC LIMIT 1`,
            [user.id, gameId, platformId]
          )

          if (!existingLog) {
            await query(
              `INSERT INTO completion_logs (user_id, game_id, platform_id, completion_type, percentage, notes)
               VALUES ($1, $2, $3, 'main', 100, 'Auto-logged: All achievements completed')`,
              [user.id, gameId, platformId]
            )
          }
        }
      }

      return new Response(
        JSON.stringify({ success: true, completed, completed_at: completed ? completedAt : null }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    } catch (error) {
      console.error('Update achievement error:', error)
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      })
    }
  })
)
