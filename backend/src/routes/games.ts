import { router } from '@/lib/router'
import { requireAuth } from '@/middleware/auth'
import { queryMany, query, queryOne } from '@/services/db'
import { corsHeaders } from '@/middleware/cors'
import type { Game } from '@/types'

interface UserGameWithDetails extends Game {
  platform_id: string
  platform_name: string
  platform_display_name: string
  status: string
  user_rating: number | null
  total_minutes: number
  last_played: Date | null
  is_favorite: boolean
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
          upt.last_played,
          COALESCE(ugp.is_favorite, FALSE) as is_favorite
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

// Export user's library to JSON/CSV
router.get(
  '/api/games/export',
  requireAuth(async (req, user) => {
    try {
      const url = new URL(req.url)
      const format = url.searchParams.get('format') || 'json'

      // Fetch all user's games with full details
      const games = await queryMany(
        `SELECT 
          g.name,
          g.release_date,
          g.description,
          g.metacritic_score,
          g.esrb_rating,
          g.series_name,
          p.display_name as platform,
          ugp.status,
          ugp.user_rating,
          ugp.notes,
          ugp.is_favorite,
          upt.total_minutes as playtime_minutes,
          ucf.difficulty_rating,
          ucf.completion_percentage,
          ucf.achievements_total,
          ucf.achievements_earned,
          ucf.replay_value,
          ucf.estimated_completion_hours,
          ucf.actual_playtime_hours
         FROM games g
         INNER JOIN user_games ug ON g.id = ug.game_id
         INNER JOIN platforms p ON ug.platform_id = p.id
         LEFT JOIN user_game_progress ugp ON g.id = ugp.game_id AND ug.platform_id = ugp.platform_id AND ugp.user_id = $1
         LEFT JOIN user_playtime upt ON g.id = upt.game_id AND ug.platform_id = upt.platform_id AND upt.user_id = $1
         LEFT JOIN user_game_custom_fields ucf ON g.id = ucf.game_id AND ug.platform_id = ucf.platform_id AND ucf.user_id = $1
         WHERE ug.user_id = $1
         ORDER BY g.name ASC`,
        [user.id]
      )

      if (format === 'csv') {
        // Generate CSV
        const headers = [
          'Name',
          'Platform',
          'Status',
          'Rating',
          'Favorite',
          'Release Date',
          'Metacritic Score',
          'ESRB Rating',
          'Series',
          'Playtime (hours)',
          'Difficulty',
          'Completion %',
          'Achievements',
          'Replay Value',
          'Notes'
        ]

        const csvRows = [
          headers.join(','),
          ...games.map((game: any) => [
            `"${game.name.replace(/"/g, '""')}"`,
            game.platform,
            game.status || 'backlog',
            game.user_rating || '',
            game.is_favorite ? 'Yes' : 'No',
            game.release_date || '',
            game.metacritic_score || '',
            game.esrb_rating || '',
            game.series_name || '',
            game.playtime_minutes ? Math.round(game.playtime_minutes / 60) : '',
            game.difficulty_rating || '',
            game.completion_percentage || '',
            game.achievements_earned && game.achievements_total
              ? `${game.achievements_earned}/${game.achievements_total}`
              : '',
            game.replay_value || '',
            `"${(game.notes || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
          ].join(','))
        ]

        const csv = csvRows.join('\n')

        return new Response(csv, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="gamelist-export-${new Date().toISOString().split('T')[0]}.csv"`,
            ...corsHeaders()
          }
        })
      } else {
        // JSON format
        const jsonData = {
          exported_at: new Date().toISOString(),
          total_games: games.length,
          games: games
        }

        return new Response(JSON.stringify(jsonData, null, 2), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="gamelist-export-${new Date().toISOString().split('T')[0]}.json"`,
            ...corsHeaders()
          }
        })
      }
    } catch (error) {
      console.error('Export error:', error)
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    }
  })
)

// Get genre statistics for user's library
router.get(
  '/api/games/stats/genres',
  requireAuth(async (req, user) => {
    try {
      const genreStats = await queryMany<{ name: string; count: number }>(
        `SELECT g.name, COUNT(DISTINCT ug.game_id) as count
         FROM genres g
         INNER JOIN game_genres gg ON g.id = gg.genre_id
         INNER JOIN user_games ug ON gg.game_id = ug.game_id
         WHERE ug.user_id = $1
         GROUP BY g.id, g.name
         ORDER BY count DESC
         LIMIT 10`,
        [user.id]
      )

      return new Response(
        JSON.stringify({ genres: genreStats }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    } catch (error) {
      console.error('Get genre stats error:', error)
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
          upt.last_played,
          COALESCE(ugp.is_favorite, FALSE) as is_favorite
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

      return new Response(
        JSON.stringify({ 
          game: game[0], 
          platforms: game,
          genres: genres.map(g => g.name)
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

// Toggle favorite status
router.put(
  '/api/games/:id/favorite',
  requireAuth(async (req, user, params) => {
    try {
      const gameId = params?.id
      const body = await req.json() as { platform_id?: string; is_favorite?: boolean }
      const { platform_id, is_favorite } = body

      if (!gameId || !platform_id || is_favorite === undefined) {
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
        `INSERT INTO user_game_progress (user_id, game_id, platform_id, is_favorite)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, game_id, platform_id)
         DO UPDATE SET is_favorite = $4`,
        [user.id, gameId, platform_id, is_favorite]
      )

      return new Response(
        JSON.stringify({ success: true, is_favorite }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    } catch (error) {
      console.error('Toggle favorite error:', error)
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    }
  })
)

// Get custom fields for a game
router.get(
  '/api/games/:id/custom-fields',
  requireAuth(async (req, user, params) => {
    try {
      const gameId = params?.id
      if (!gameId) {
        return new Response(
          JSON.stringify({ error: 'Game ID is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      const customFields = await queryOne(
        `SELECT 
          estimated_completion_hours,
          actual_playtime_hours,
          completion_percentage,
          difficulty_rating,
          achievements_total,
          achievements_earned,
          replay_value,
          updated_at
         FROM user_game_custom_fields
         WHERE user_id = $1 AND game_id = $2`,
        [user.id, gameId]
      )

      return new Response(
        JSON.stringify({ customFields: customFields || {} }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    } catch (error) {
      console.error('Get custom fields error:', error)
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    }
  })
)

// Update custom fields for a game
router.put(
  '/api/games/:id/custom-fields',
  requireAuth(async (req, user, params) => {
    try {
      const gameId = params?.id
      const body = await req.json() as {
        platform_id?: string
        estimated_completion_hours?: number | null
        actual_playtime_hours?: number | null
        completion_percentage?: number | null
        difficulty_rating?: number | null
        achievements_total?: number | null
        achievements_earned?: number | null
        replay_value?: number | null
      }

      const { 
        platform_id,
        estimated_completion_hours,
        actual_playtime_hours,
        completion_percentage,
        difficulty_rating,
        achievements_total,
        achievements_earned,
        replay_value
      } = body

      if (!gameId || !platform_id) {
        return new Response(
          JSON.stringify({ error: 'Game ID and platform ID are required' }),
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

      // Validate ranges
      if (completion_percentage !== null && completion_percentage !== undefined) {
        if (completion_percentage < 0 || completion_percentage > 100) {
          return new Response(
            JSON.stringify({ error: 'Completion percentage must be between 0 and 100' }),
            { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
          )
        }
      }

      if (difficulty_rating !== null && difficulty_rating !== undefined) {
        if (difficulty_rating < 1 || difficulty_rating > 10) {
          return new Response(
            JSON.stringify({ error: 'Difficulty rating must be between 1 and 10' }),
            { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
          )
        }
      }

      if (replay_value !== null && replay_value !== undefined) {
        if (replay_value < 1 || replay_value > 5) {
          return new Response(
            JSON.stringify({ error: 'Replay value must be between 1 and 5' }),
            { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
          )
        }
      }

      await query(
        `INSERT INTO user_game_custom_fields (
          user_id, game_id, platform_id,
          estimated_completion_hours,
          actual_playtime_hours,
          completion_percentage,
          difficulty_rating,
          achievements_total,
          achievements_earned,
          replay_value,
          updated_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
         ON CONFLICT (user_id, game_id, platform_id)
         DO UPDATE SET
           estimated_completion_hours = COALESCE($4, user_game_custom_fields.estimated_completion_hours),
           actual_playtime_hours = COALESCE($5, user_game_custom_fields.actual_playtime_hours),
           completion_percentage = COALESCE($6, user_game_custom_fields.completion_percentage),
           difficulty_rating = COALESCE($7, user_game_custom_fields.difficulty_rating),
           achievements_total = COALESCE($8, user_game_custom_fields.achievements_total),
           achievements_earned = COALESCE($9, user_game_custom_fields.achievements_earned),
           replay_value = COALESCE($10, user_game_custom_fields.replay_value),
           updated_at = NOW()`,
        [
          user.id,
          gameId,
          platform_id,
          estimated_completion_hours,
          actual_playtime_hours,
          completion_percentage,
          difficulty_rating,
          achievements_total,
          achievements_earned,
          replay_value
        ]
      )

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    } catch (error) {
      console.error('Update custom fields error:', error)
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    }
  })
)
