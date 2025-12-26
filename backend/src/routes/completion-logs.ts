import { router } from '@/lib/router'
import { requireAuth } from '@/middleware/auth'
import { queryMany, query, queryOne } from '@/services/db'
import { corsHeaders } from '@/middleware/cors'

interface CompletionLog {
  id: string
  user_id: string
  game_id: string
  platform_id: string
  percentage: number
  logged_at: string
  notes: string | null
}

interface CompletionLogWithGame extends CompletionLog {
  game_name: string
  platform_name: string
}

// Get completion logs for a game
router.get(
  '/api/games/:gameId/completion-logs',
  requireAuth(async (req, user, params) => {
    try {
      const gameId = params?.gameId
      if (!gameId) {
        return new Response(
          JSON.stringify({ error: 'Game ID is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      const url = new URL(req.url)
      const limit = parseInt(url.searchParams.get('limit') || '50')
      const offset = parseInt(url.searchParams.get('offset') || '0')

      const logs = await queryMany<CompletionLogWithGame>(
        `SELECT 
          cl.*,
          g.name as game_name,
          p.display_name as platform_name
        FROM completion_logs cl
        INNER JOIN games g ON cl.game_id = g.id
        INNER JOIN platforms p ON cl.platform_id = p.id
        WHERE cl.user_id = $1 AND cl.game_id = $2
        ORDER BY cl.logged_at DESC
        LIMIT $3 OFFSET $4`,
        [user.id, gameId, limit, offset]
      )

      const totalResult = await queryOne<{ count: number }>(
        `SELECT COUNT(*) as count FROM completion_logs WHERE user_id = $1 AND game_id = $2`,
        [user.id, gameId]
      )

      // Get the latest (current) percentage
      const currentPercentage = logs.length > 0 ? logs[0].percentage : 0

      return new Response(
        JSON.stringify({
          logs,
          total: totalResult?.count || 0,
          currentPercentage,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    } catch (error) {
      console.error('Get completion logs error:', error)
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    }
  })
)

// Add a completion log entry
router.post(
  '/api/games/:gameId/completion-logs',
  requireAuth(async (req, user, params) => {
    try {
      const gameId = params?.gameId
      if (!gameId) {
        return new Response(
          JSON.stringify({ error: 'Game ID is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      const body = (await req.json()) as {
        platformId?: string
        percentage?: number
        notes?: string | null
      }

      const { platformId, percentage, notes } = body

      if (!platformId) {
        return new Response(
          JSON.stringify({ error: 'Platform ID is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      if (percentage === undefined || percentage === null) {
        return new Response(
          JSON.stringify({ error: 'Percentage is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      if (percentage < 0 || percentage > 100) {
        return new Response(
          JSON.stringify({ error: 'Percentage must be between 0 and 100' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      // Verify user owns this game on this platform
      const ownership = await query(
        'SELECT 1 FROM user_games WHERE user_id = $1 AND game_id = $2 AND platform_id = $3',
        [user.id, gameId, platformId]
      )

      if (ownership.rowCount === 0) {
        return new Response(
          JSON.stringify({ error: 'Game not found in your library' }),
          { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      // Insert completion log
      const log = await queryOne<CompletionLog>(
        `INSERT INTO completion_logs (user_id, game_id, platform_id, percentage, notes)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [user.id, gameId, platformId, percentage, notes || null]
      )

      // Also update user_game_progress.completion_percentage
      await query(
        `INSERT INTO user_game_progress (user_id, game_id, platform_id, completion_percentage)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, game_id, platform_id)
         DO UPDATE SET completion_percentage = $4`,
        [user.id, gameId, platformId, percentage]
      )

      // Also update user_game_custom_fields.completion_percentage
      await query(
        `INSERT INTO user_game_custom_fields (user_id, game_id, platform_id, completion_percentage, updated_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (user_id, game_id, platform_id)
         DO UPDATE SET completion_percentage = $4, updated_at = NOW()`,
        [user.id, gameId, platformId, percentage]
      )

      return new Response(JSON.stringify({ log }), {
        status: 201,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      })
    } catch (error) {
      console.error('Create completion log error:', error)
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    }
  })
)

// Delete a completion log entry
router.delete(
  '/api/games/:gameId/completion-logs/:logId',
  requireAuth(async (req, user, params) => {
    try {
      const gameId = params?.gameId
      const logId = params?.logId

      if (!gameId || !logId) {
        return new Response(
          JSON.stringify({ error: 'Game ID and Log ID are required' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      // Verify log belongs to user
      const existingLog = await queryOne<CompletionLog>(
        'SELECT * FROM completion_logs WHERE id = $1 AND user_id = $2 AND game_id = $3',
        [logId, user.id, gameId]
      )

      if (!existingLog) {
        return new Response(
          JSON.stringify({ error: 'Completion log not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      await query('DELETE FROM completion_logs WHERE id = $1 AND user_id = $2', [logId, user.id])

      // Update the current percentage to the latest remaining log (or 0 if none)
      const latestLog = await queryOne<CompletionLog>(
        `SELECT * FROM completion_logs 
         WHERE user_id = $1 AND game_id = $2 AND platform_id = $3
         ORDER BY logged_at DESC
         LIMIT 1`,
        [user.id, gameId, existingLog.platform_id]
      )

      const newPercentage = latestLog?.percentage || 0

      await query(
        `UPDATE user_game_progress 
         SET completion_percentage = $1
         WHERE user_id = $2 AND game_id = $3 AND platform_id = $4`,
        [newPercentage, user.id, gameId, existingLog.platform_id]
      )

      await query(
        `UPDATE user_game_custom_fields 
         SET completion_percentage = $1, updated_at = NOW()
         WHERE user_id = $2 AND game_id = $3 AND platform_id = $4`,
        [newPercentage, user.id, gameId, existingLog.platform_id]
      )

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      })
    } catch (error) {
      console.error('Delete completion log error:', error)
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    }
  })
)
