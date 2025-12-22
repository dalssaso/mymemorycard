import { router } from '@/lib/router'
import { requireAuth } from '@/middleware/auth'
import { queryMany, query, queryOne } from '@/services/db'
import { corsHeaders } from '@/middleware/cors'
import type { Game } from '@/types'
import { fetchAndSavePSNProfilesData } from '@/services/scraper/psnprofiles'

interface UserGameWithDetails extends Game {
  platform_id: string
  platform_name: string
  platform_display_name: string
  status: string
  user_rating: number | null
  total_minutes: number
  last_played: Date | null
}

// Get user's game library
router.get(
  '/api/games',
  requireAuth(async (req, user) => {
    try {
      const games = await queryMany<UserGameWithDetails>(
        `SELECT 
          g.*,
          p.id as platform_id,
          p.name as platform_name,
          p.display_name as platform_display_name,
          COALESCE(ugp.status, 'backlog') as status,
          ugp.user_rating,
          COALESCE(upt.total_minutes, 0) as total_minutes,
          upt.last_played
        FROM games g
        INNER JOIN user_games ug ON g.id = ug.game_id
        INNER JOIN platforms p ON ug.platform_id = p.id
        LEFT JOIN user_game_progress ugp ON g.id = ugp.game_id AND ug.platform_id = ugp.platform_id AND ugp.user_id = $1
        LEFT JOIN user_playtime upt ON g.id = upt.game_id AND ug.platform_id = upt.platform_id AND upt.user_id = $1
        WHERE ug.user_id = $1
        ORDER BY g.name ASC`,
        [user.id]
      )

      return new Response(
        JSON.stringify({ games }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    } catch (error) {
      console.error('Get games error:', error)
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    }
  })
)

// Get single game details
router.get(
  '/api/games/:id',
  requireAuth(async (req, user, params) => {
    try {
      const gameId = params?.id
      if (!gameId) {
        return new Response(
          JSON.stringify({ error: 'Game ID is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      const game = await queryMany<UserGameWithDetails>(
        `SELECT 
          g.*,
          p.id as platform_id,
          p.name as platform_name,
          p.display_name as platform_display_name,
          ugp.status,
          ugp.user_rating,
          ugp.notes,
          upt.total_minutes,
          upt.last_played
        FROM games g
        LEFT JOIN user_games ug ON g.id = ug.game_id AND ug.user_id = $1
        LEFT JOIN platforms p ON ug.platform_id = p.id
        LEFT JOIN user_game_progress ugp ON g.id = ugp.game_id AND ug.platform_id = ugp.platform_id AND ugp.user_id = $1
        LEFT JOIN user_playtime upt ON g.id = upt.game_id AND ug.platform_id = upt.platform_id AND upt.user_id = $1
        WHERE g.id = $2`,
        [user.id, gameId]
      )

      if (game.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Game not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      // Fetch genres for this game
      const genres = await queryMany<{ name: string }>(
        `SELECT g.name
         FROM genres g
         INNER JOIN game_genres gg ON g.id = gg.genre_id
         WHERE gg.game_id = $1
         ORDER BY g.name`,
        [gameId]
      )

      // Fetch PSNProfiles data if available
      const psnData = await queryOne(
        `SELECT 
          difficulty_rating,
          trophy_count_bronze,
          trophy_count_silver,
          trophy_count_gold,
          trophy_count_platinum,
          average_completion_time_hours,
          psnprofiles_url,
          updated_at
         FROM psnprofiles_data
         WHERE game_id = $1`,
        [gameId]
      )

      return new Response(
        JSON.stringify({ 
          game: game[0], 
          platforms: game,
          genres: genres.map(g => g.name),
          psnprofiles: psnData || null
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    } catch (error) {
      console.error('Get game error:', error)
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    }
  })
)

// Update game status
router.patch(
  '/api/games/:id/status',
  requireAuth(async (req, user, params) => {
    try {
      const gameId = params?.id
      const body = await req.json() as { platform_id?: string; status?: string }
      const { platform_id, status } = body

      if (!gameId || !platform_id || !status) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      const validStatuses = ['backlog', 'playing', 'finished', 'dropped', 'completed']
      if (!validStatuses.includes(status)) {
        return new Response(
          JSON.stringify({ error: 'Invalid status' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      // Verify user owns this game on this platform
      const ownership = await query(
        'SELECT 1 FROM user_games WHERE user_id = $1 AND game_id = $2 AND platform_id = $3',
        [user.id, gameId, platform_id]
      )
      
      if (ownership.rowCount === 0) {
        return new Response(
          JSON.stringify({ error: 'Game not found in your library' }),
          { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      // Automatically set started_at and completed_at based on status changes
      let dateUpdate = ''
      if (status === 'playing') {
        dateUpdate = ', started_at = COALESCE(user_game_progress.started_at, NOW())'
      } else if (status === 'finished' || status === 'completed') {
        dateUpdate = ', completed_at = COALESCE(user_game_progress.completed_at, NOW())'
      }

      await query(
        `INSERT INTO user_game_progress (user_id, game_id, platform_id, status${status === 'playing' ? ', started_at' : ''}${['finished', 'completed'].includes(status) ? ', completed_at' : ''})
         VALUES ($1, $2, $3, $4${status === 'playing' ? ', NOW()' : ''}${['finished', 'completed'].includes(status) ? ', NOW()' : ''})
         ON CONFLICT (user_id, game_id, platform_id)
         DO UPDATE SET status = $4${dateUpdate}`,
        [user.id, gameId, platform_id, status]
      )

      return new Response(
        JSON.stringify({ success: true, status }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    } catch (error) {
      console.error('Update status error:', error)
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    }
  })
)

// Update game rating
router.put(
  '/api/games/:id/rating',
  requireAuth(async (req, user, params) => {
    try {
      const gameId = params?.id
      const body = await req.json() as { platform_id?: string; rating?: number }
      const { platform_id, rating } = body

      if (!gameId || !platform_id || rating === undefined) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      const numRating = Number(rating)
      if (isNaN(numRating) || numRating < 1 || numRating > 10) {
        return new Response(
          JSON.stringify({ error: 'Rating must be between 1 and 10' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      // Verify user owns this game on this platform
      const ownership = await query(
        'SELECT 1 FROM user_games WHERE user_id = $1 AND game_id = $2 AND platform_id = $3',
        [user.id, gameId, platform_id]
      )
      
      if (ownership.rowCount === 0) {
        return new Response(
          JSON.stringify({ error: 'Game not found in your library' }),
          { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      await query(
        `INSERT INTO user_game_progress (user_id, game_id, platform_id, user_rating)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, game_id, platform_id)
         DO UPDATE SET user_rating = $4`,
        [user.id, gameId, platform_id, numRating]
      )

      return new Response(
        JSON.stringify({ success: true, rating: numRating }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    } catch (error) {
      console.error('Update rating error:', error)
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    }
  })
)

// Update game notes
router.post(
  '/api/games/:id/notes',
  requireAuth(async (req, user, params) => {
    try {
      const gameId = params?.id
      const body = await req.json() as { platform_id?: string; notes?: string }
      const { platform_id, notes } = body

      if (!gameId || !platform_id || notes === undefined) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      // Verify user owns this game on this platform
      const ownership = await query(
        'SELECT 1 FROM user_games WHERE user_id = $1 AND game_id = $2 AND platform_id = $3',
        [user.id, gameId, platform_id]
      )
      
      if (ownership.rowCount === 0) {
        return new Response(
          JSON.stringify({ error: 'Game not found in your library' }),
          { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      await query(
        `INSERT INTO user_game_progress (user_id, game_id, platform_id, notes)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, game_id, platform_id)
         DO UPDATE SET notes = $4`,
        [user.id, gameId, platform_id, notes]
      )

      return new Response(
        JSON.stringify({ success: true, notes }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    } catch (error) {
      console.error('Update notes error:', error)
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    }
  })
)

// Refresh game metadata (PSNProfiles data)
router.post(
  '/api/games/:id/refresh',
  requireAuth(async (req, user, params) => {
    try {
      const gameId = params?.id
      if (!gameId) {
        return new Response(
          JSON.stringify({ error: 'Game ID is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      // Verify user owns this game
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

      // Get game name
      const game = await queryOne<{ name: string }>(
        'SELECT name FROM games WHERE id = $1',
        [gameId]
      )

      if (!game) {
        return new Response(
          JSON.stringify({ error: 'Game not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      // Fetch and save PSNProfiles data
      const psnData = await fetchAndSavePSNProfilesData(gameId, game.name)

      if (!psnData) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'No PSNProfiles data found for this game' 
          }),
          { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Metadata refreshed successfully',
          data: psnData
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    } catch (error) {
      console.error('Refresh metadata error:', error)
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    }
  })
)
