import { router } from '@/lib/router'
import { requireAuth } from '@/middleware/auth'
import { queryMany, query, queryOne } from '@/services/db'
import { corsHeaders } from '@/middleware/cors'

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
}

interface PlaySessionWithGame extends PlaySession {
  game_name: string
  platform_name: string
}

// Get all sessions for a game
router.get(
  '/api/games/:gameId/sessions',
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
      const startDate = url.searchParams.get('startDate')
      const endDate = url.searchParams.get('endDate')

      let queryStr = `
        SELECT 
          ps.*,
          g.name as game_name,
          p.display_name as platform_name
        FROM play_sessions ps
        INNER JOIN games g ON ps.game_id = g.id
        INNER JOIN platforms p ON ps.platform_id = p.id
        WHERE ps.user_id = $1 AND ps.game_id = $2
      `
      const queryParams: (string | number)[] = [user.id, gameId]

      if (startDate) {
        queryParams.push(startDate)
        queryStr += ` AND ps.started_at >= $${queryParams.length}`
      }

      if (endDate) {
        queryParams.push(endDate)
        queryStr += ` AND ps.started_at <= $${queryParams.length}`
      }

      queryStr += ` ORDER BY ps.started_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`
      queryParams.push(limit, offset)

      const sessions = await queryMany<PlaySessionWithGame>(queryStr, queryParams)

      const totalResult = await queryOne<{ count: number }>(
        `SELECT COUNT(*) as count FROM play_sessions WHERE user_id = $1 AND game_id = $2`,
        [user.id, gameId]
      )

      const totalMinutesResult = await queryOne<{ total: number }>(
        `SELECT COALESCE(SUM(duration_minutes), 0) as total 
         FROM play_sessions 
         WHERE user_id = $1 AND game_id = $2 AND duration_minutes IS NOT NULL`,
        [user.id, gameId]
      )

      return new Response(
        JSON.stringify({
          sessions,
          total: totalResult?.count || 0,
          totalMinutes: totalMinutesResult?.total || 0,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    } catch (error) {
      console.error('Get sessions error:', error)
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    }
  })
)

// Create a new session (start or manual entry)
router.post(
  '/api/games/:gameId/sessions',
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
        startedAt?: string
        endedAt?: string | null
        durationMinutes?: number | null
        notes?: string | null
      }

      const { platformId, startedAt, endedAt, durationMinutes, notes } = body

      if (!platformId) {
        return new Response(
          JSON.stringify({ error: 'Platform ID is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      if (!startedAt) {
        return new Response(
          JSON.stringify({ error: 'startedAt is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      // Verify user owns this game on this platform
      const ownership = await queryOne<{ id: string }>(
        'SELECT id FROM user_games WHERE user_id = $1 AND game_id = $2 AND platform_id = $3',
        [user.id, gameId, platformId]
      )

      if (!ownership) {
        return new Response(
          JSON.stringify({ error: 'Game not found in your library' }),
          { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      // Get progress status from user_game_progress table
      const progress = await queryOne<{ status: string }>(
        'SELECT status FROM user_game_progress WHERE user_id = $1 AND game_id = $2 AND platform_id = $3',
        [user.id, gameId, platformId]
      )

      // Auto-move game from backlog to playing when starting a session
      const currentStatus = progress?.status || 'backlog'
      if (currentStatus === 'backlog' && !endedAt) {
        await query(
          `INSERT INTO user_game_progress (user_id, game_id, platform_id, status, started_at)
           VALUES ($1, $2, $3, 'playing', NOW())
           ON CONFLICT (user_id, game_id, platform_id)
           DO UPDATE SET status = 'playing', started_at = COALESCE(user_game_progress.started_at, NOW())`,
          [user.id, gameId, platformId]
        )
      }

      // Check for existing active session on any game
      const activeSession = await queryOne<PlaySession>(
        'SELECT * FROM play_sessions WHERE user_id = $1 AND ended_at IS NULL',
        [user.id]
      )

      if (activeSession && !endedAt) {
        return new Response(
          JSON.stringify({
            error: 'You already have an active session',
            activeSession,
          }),
          { status: 409, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      // Calculate duration if endedAt is provided but durationMinutes is not
      let calculatedDuration = durationMinutes
      if (endedAt && !durationMinutes) {
        const startTime = new Date(startedAt).getTime()
        const endTime = new Date(endedAt).getTime()
        calculatedDuration = Math.round((endTime - startTime) / 60000)
      }

      const session = await queryOne<PlaySession>(
        `INSERT INTO play_sessions (user_id, game_id, platform_id, started_at, ended_at, duration_minutes, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [user.id, gameId, platformId, startedAt, endedAt || null, calculatedDuration || null, notes || null]
      )

      // If this is a completed session (has endedAt), update user_playtime
      if (endedAt && calculatedDuration) {
        await query(
          `INSERT INTO user_playtime (user_id, game_id, platform_id, total_minutes, last_played)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (user_id, game_id, platform_id)
           DO UPDATE SET 
             total_minutes = user_playtime.total_minutes + $4,
             last_played = $5`,
          [user.id, gameId, platformId, calculatedDuration, endedAt]
        )
      }

      return new Response(JSON.stringify({ session }), {
        status: 201,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      })
    } catch (error) {
      console.error('Create session error:', error)
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    }
  })
)

// Update a session (end session, update notes, etc.)
router.patch(
  '/api/games/:gameId/sessions/:sessionId',
  requireAuth(async (req, user, params) => {
    try {
      const gameId = params?.gameId
      const sessionId = params?.sessionId

      if (!gameId || !sessionId) {
        return new Response(
          JSON.stringify({ error: 'Game ID and Session ID are required' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      // Verify session belongs to user
      const existingSession = await queryOne<PlaySession>(
        'SELECT * FROM play_sessions WHERE id = $1 AND user_id = $2 AND game_id = $3',
        [sessionId, user.id, gameId]
      )

      if (!existingSession) {
        return new Response(
          JSON.stringify({ error: 'Session not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      const body = (await req.json()) as {
        endedAt?: string | null
        durationMinutes?: number | null
        notes?: string | null
      }

      const { endedAt, durationMinutes, notes } = body

      // Calculate duration if ending a session
      let calculatedDuration = durationMinutes
      if (endedAt && !durationMinutes && !existingSession.ended_at) {
        const startTime = new Date(existingSession.started_at).getTime()
        const endTime = new Date(endedAt).getTime()
        calculatedDuration = Math.round((endTime - startTime) / 60000)
      }

      const session = await queryOne<PlaySession>(
        `UPDATE play_sessions 
         SET 
           ended_at = COALESCE($1, ended_at),
           duration_minutes = COALESCE($2, duration_minutes),
           notes = COALESCE($3, notes)
         WHERE id = $4 AND user_id = $5
         RETURNING *`,
        [endedAt || null, calculatedDuration || null, notes, sessionId, user.id]
      )

      // If we just ended the session, update user_playtime
      if (endedAt && calculatedDuration && !existingSession.ended_at) {
        await query(
          `INSERT INTO user_playtime (user_id, game_id, platform_id, total_minutes, last_played)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (user_id, game_id, platform_id)
           DO UPDATE SET 
             total_minutes = user_playtime.total_minutes + $4,
             last_played = $5`,
          [user.id, gameId, existingSession.platform_id, calculatedDuration, endedAt]
        )
      }

      return new Response(JSON.stringify({ session }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      })
    } catch (error) {
      console.error('Update session error:', error)
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    }
  })
)

// Delete a session
router.delete(
  '/api/games/:gameId/sessions/:sessionId',
  requireAuth(async (req, user, params) => {
    try {
      const gameId = params?.gameId
      const sessionId = params?.sessionId

      if (!gameId || !sessionId) {
        return new Response(
          JSON.stringify({ error: 'Game ID and Session ID are required' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      // Get session before deleting to update playtime
      const existingSession = await queryOne<PlaySession>(
        'SELECT * FROM play_sessions WHERE id = $1 AND user_id = $2 AND game_id = $3',
        [sessionId, user.id, gameId]
      )

      if (!existingSession) {
        return new Response(
          JSON.stringify({ error: 'Session not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      await query('DELETE FROM play_sessions WHERE id = $1 AND user_id = $2', [sessionId, user.id])

      // If session had duration, subtract from user_playtime
      if (existingSession.duration_minutes) {
        await query(
          `UPDATE user_playtime 
           SET total_minutes = GREATEST(0, total_minutes - $1)
           WHERE user_id = $2 AND game_id = $3 AND platform_id = $4`,
          [existingSession.duration_minutes, user.id, gameId, existingSession.platform_id]
        )
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      })
    } catch (error) {
      console.error('Delete session error:', error)
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    }
  })
)

// Get currently active session (across all games)
router.get(
  '/api/sessions/active',
  requireAuth(async (req, user) => {
    try {
      const activeSession = await queryOne<PlaySessionWithGame>(
        `SELECT 
          ps.*,
          g.name as game_name,
          p.display_name as platform_name
        FROM play_sessions ps
        INNER JOIN games g ON ps.game_id = g.id
        INNER JOIN platforms p ON ps.platform_id = p.id
        WHERE ps.user_id = $1 AND ps.ended_at IS NULL
        ORDER BY ps.started_at DESC
        LIMIT 1`,
        [user.id]
      )

      return new Response(JSON.stringify({ session: activeSession }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      })
    } catch (error) {
      console.error('Get active session error:', error)
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    }
  })
)
