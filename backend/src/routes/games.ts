import { router } from '@/lib/router'
import { requireAuth } from '@/middleware/auth'
import { queryMany, query, queryOne, withTransaction } from '@/services/db'
import { corsHeaders } from '@/middleware/cors'
import { getGameDetails, getGameDetailsBySlug, getGameSeries } from '@/services/rawg'
import type { Game } from '@/types'

interface UserGameWithDetails extends Game {
  platform_id: string
  platform_name: string
  platform_display_name: string
  status: string
  user_rating: number | null
  total_minutes: number
  last_played: string | null
  is_favorite: boolean
}

interface ExportedGame {
  name: string
  release_date: string | null
  description: string | null
  metacritic_score: number | null
  esrb_rating: string | null
  series_name: string | null
  platform: string
  status: string | null
  user_rating: number | null
  notes: string | null
  is_favorite: boolean
  playtime_minutes: number | null
  difficulty_rating: number | null
  completion_percentage: number | null
}

// Get user's game library
router.get(
  '/api/games',
  requireAuth(async (req, user) => {
    try {
      const games = await queryMany<UserGameWithDetails & {
        display_edition_name: string | null
        display_cover_art_url: string | null
      }>(
        `SELECT 
          g.*,
          p.id as platform_id,
          p.name as platform_name,
          p.display_name as platform_display_name,
          COALESCE(ugp.status, 'backlog') as status,
          ugp.user_rating,
          COALESCE(upt.total_minutes, 0) as total_minutes,
          upt.last_played,
          COALESCE(ugp.is_favorite, FALSE) as is_favorite,
          ugde.edition_name as display_edition_name,
          ugde.cover_art_url as display_cover_art_url
        FROM games g
        INNER JOIN user_games ug ON g.id = ug.game_id
        INNER JOIN platforms p ON ug.platform_id = p.id
        LEFT JOIN user_game_progress ugp ON g.id = ugp.game_id AND ug.platform_id = ugp.platform_id AND ugp.user_id = $1
        LEFT JOIN user_playtime upt ON g.id = upt.game_id AND ug.platform_id = upt.platform_id AND upt.user_id = $1
        LEFT JOIN user_game_display_editions ugde ON g.id = ugde.game_id AND ug.platform_id = ugde.platform_id AND ugde.user_id = $1
        WHERE ug.user_id = $1
        ORDER BY COALESCE(ugde.edition_name, g.name) ASC`,
        [user.id]
      )

      // Apply display edition overlay
      const gamesWithOverlay = games.map(g => {
        if (g.display_edition_name) {
          return {
            ...g,
            name: g.display_edition_name,
            cover_art_url: g.display_cover_art_url || g.cover_art_url,
          }
        }
        return g
      })

      return new Response(
        JSON.stringify({ games: gamesWithOverlay }),
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
      const games = await queryMany<ExportedGame>(
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
          ucf.completion_percentage
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
          'Notes',
        ]

        const csvRows = [
          headers.join(','),
          ...games.map((game) =>
            [
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
              `"${(game.notes || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
            ].join(',')
          ),
        ]

        const csv = csvRows.join('\n')

        return new Response(csv, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="mymemorycard-export-${new Date().toISOString().split('T')[0]}.csv"`,
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
            'Content-Disposition': `attachment; filename="mymemorycard-export-${new Date().toISOString().split('T')[0]}.json"`,
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

      const game = await queryMany<UserGameWithDetails & { 
        display_edition_name: string | null
        display_cover_art_url: string | null
        display_background_image_url: string | null
        display_description: string | null
      }>(
        `SELECT 
          g.*,
          p.id as platform_id,
          p.name as platform_name,
          p.display_name as platform_display_name,
          COALESCE(ugp.status, 'backlog') as status,
          ugp.user_rating,
          ugp.notes,
          COALESCE(upt.total_minutes, 0) as total_minutes,
          upt.last_played,
          COALESCE(ugp.is_favorite, FALSE) as is_favorite,
          ugde.edition_name as display_edition_name,
          ugde.cover_art_url as display_cover_art_url,
          ugde.background_image_url as display_background_image_url,
          ugde.description as display_description
        FROM games g
        LEFT JOIN user_games ug ON g.id = ug.game_id AND ug.user_id = $1
        LEFT JOIN platforms p ON ug.platform_id = p.id
        LEFT JOIN user_game_progress ugp ON g.id = ugp.game_id AND ug.platform_id = ugp.platform_id AND ugp.user_id = $1
        LEFT JOIN user_playtime upt ON g.id = upt.game_id AND ug.platform_id = upt.platform_id AND upt.user_id = $1
        LEFT JOIN user_game_display_editions ugde ON g.id = ugde.game_id AND ug.platform_id = ugde.platform_id AND ugde.user_id = $1
        WHERE g.id = $2`,
        [user.id, gameId]
      )

      if (game.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Game not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      // Apply display edition overlay if set
      const platforms = game.map(g => {
        if (g.display_edition_name) {
          return {
            ...g,
            name: g.display_edition_name,
            cover_art_url: g.display_cover_art_url || g.cover_art_url,
            background_image_url: g.display_background_image_url || g.background_image_url,
            description: g.display_description || g.description,
            is_using_display_edition: true,
          }
        }
        return { ...g, is_using_display_edition: false }
      })

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
          game: platforms[0], 
          platforms,
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
      const url = new URL(req.url)
      const platformId = url.searchParams.get('platform_id')

      if (!gameId) {
        return new Response(
          JSON.stringify({ error: 'Game ID is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      if (!platformId) {
        return new Response(
          JSON.stringify({ error: 'platform_id query parameter is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      const customFields = await queryOne(
        `SELECT 
          completion_percentage,
          difficulty_rating,
          updated_at
         FROM user_game_custom_fields
         WHERE user_id = $1 AND game_id = $2 AND platform_id = $3`,
        [user.id, gameId, platformId]
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
      const body = (await req.json()) as {
        platform_id?: string
        completion_percentage?: number | null
        difficulty_rating?: number | null
      }

      const { platform_id, completion_percentage, difficulty_rating } = body

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

      await query(
        `INSERT INTO user_game_custom_fields (
          user_id, game_id, platform_id,
          completion_percentage,
          difficulty_rating,
          updated_at
         )
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (user_id, game_id, platform_id)
         DO UPDATE SET
           completion_percentage = COALESCE($4, user_game_custom_fields.completion_percentage),
           difficulty_rating = COALESCE($5, user_game_custom_fields.difficulty_rating),
           updated_at = NOW()`,
        [user.id, gameId, platform_id, completion_percentage, difficulty_rating]
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

// Delete game from user's library (for a specific platform)
router.delete(
  '/api/games/:id',
  requireAuth(async (req, user, params) => {
    try {
      const gameId = params?.id
      const url = new URL(req.url)
      const platformId = url.searchParams.get('platform_id')

      if (!gameId || !platformId) {
        return new Response(
          JSON.stringify({ error: 'Game ID and platform_id are required' }),
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

      // Delete related user data (cascading from user_games deletion handles most)
      // But some tables reference game_id + platform_id directly, not user_games

      // Delete play sessions
      await query(
        'DELETE FROM play_sessions WHERE user_id = $1 AND game_id = $2 AND platform_id = $3',
        [user.id, gameId, platformId]
      )

      // Delete completion logs
      await query(
        'DELETE FROM completion_logs WHERE user_id = $1 AND game_id = $2 AND platform_id = $3',
        [user.id, gameId, platformId]
      )

      // Delete user playtime
      await query(
        'DELETE FROM user_playtime WHERE user_id = $1 AND game_id = $2 AND platform_id = $3',
        [user.id, gameId, platformId]
      )

      // Delete user game progress
      await query(
        'DELETE FROM user_game_progress WHERE user_id = $1 AND game_id = $2 AND platform_id = $3',
        [user.id, gameId, platformId]
      )

      // Delete custom fields
      await query(
        'DELETE FROM user_game_custom_fields WHERE user_id = $1 AND game_id = $2 AND platform_id = $3',
        [user.id, gameId, platformId]
      )

      // Delete display edition preference
      await query(
        'DELETE FROM user_game_display_editions WHERE user_id = $1 AND game_id = $2 AND platform_id = $3',
        [user.id, gameId, platformId]
      )

      // Delete edition ownership
      await query(
        'DELETE FROM user_game_editions WHERE user_id = $1 AND game_id = $2 AND platform_id = $3',
        [user.id, gameId, platformId]
      )

      // Delete DLC ownership
      await query(
        'DELETE FROM user_game_additions WHERE user_id = $1 AND game_id = $2 AND platform_id = $3',
        [user.id, gameId, platformId]
      )

      // Finally delete the user_games entry
      await query(
        'DELETE FROM user_games WHERE user_id = $1 AND game_id = $2 AND platform_id = $3',
        [user.id, gameId, platformId]
      )

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    } catch (error) {
      console.error('Delete game error:', error)
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    }
  })
)

// Bulk delete games
router.post(
  '/api/games/bulk-delete',
  requireAuth(async (req, user) => {
    try {
      const body = (await req.json()) as { gameIds?: string[] }
      const { gameIds } = body

      if (!gameIds || !Array.isArray(gameIds) || gameIds.length === 0) {
        return new Response(
          JSON.stringify({ error: 'gameIds array is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      if (gameIds.length > 100) {
        return new Response(
          JSON.stringify({ error: 'Cannot delete more than 100 games at once' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      let deletedCount = 0

      for (const gameId of gameIds) {
        const userGames = await queryMany<{ platform_id: string }>(
          'SELECT platform_id FROM user_games WHERE user_id = $1 AND game_id = $2',
          [user.id, gameId]
        )

        for (const { platform_id: platformId } of userGames) {
          await query(
            'DELETE FROM play_sessions WHERE user_id = $1 AND game_id = $2 AND platform_id = $3',
            [user.id, gameId, platformId]
          )
          await query(
            'DELETE FROM completion_logs WHERE user_id = $1 AND game_id = $2 AND platform_id = $3',
            [user.id, gameId, platformId]
          )
          await query(
            'DELETE FROM user_playtime WHERE user_id = $1 AND game_id = $2 AND platform_id = $3',
            [user.id, gameId, platformId]
          )
          await query(
            'DELETE FROM user_game_progress WHERE user_id = $1 AND game_id = $2 AND platform_id = $3',
            [user.id, gameId, platformId]
          )
          await query(
            'DELETE FROM user_game_custom_fields WHERE user_id = $1 AND game_id = $2 AND platform_id = $3',
            [user.id, gameId, platformId]
          )
          await query(
            'DELETE FROM user_game_display_editions WHERE user_id = $1 AND game_id = $2 AND platform_id = $3',
            [user.id, gameId, platformId]
          )
          await query(
            'DELETE FROM user_game_editions WHERE user_id = $1 AND game_id = $2 AND platform_id = $3',
            [user.id, gameId, platformId]
          )
          await query(
            'DELETE FROM user_game_additions WHERE user_id = $1 AND game_id = $2 AND platform_id = $3',
            [user.id, gameId, platformId]
          )
          await query(
            'DELETE FROM user_games WHERE user_id = $1 AND game_id = $2 AND platform_id = $3',
            [user.id, gameId, platformId]
          )
          deletedCount++
        }
      }

      return new Response(
        JSON.stringify({ success: true, deletedCount }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    } catch (error) {
      console.error('Bulk delete games error:', error)
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    }
  })
)

// Update game metadata from RAWG ID or slug
router.post(
  '/api/games/:id/update-from-rawg',
  requireAuth(async (req, user, params) => {
    try {
      const gameId = params?.id
      const body = (await req.json()) as { rawgId?: number; rawgSlug?: string }
      const { rawgId, rawgSlug } = body

      if (!gameId) {
        return new Response(
          JSON.stringify({ error: 'Game ID is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      if (!rawgId && !rawgSlug) {
        return new Response(
          JSON.stringify({ error: 'Either rawgId or rawgSlug is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      // Verify user owns this game
      const ownership = await queryOne<{ id: string }>(
        'SELECT id FROM user_games WHERE user_id = $1 AND game_id = $2',
        [user.id, gameId]
      )

      if (!ownership) {
        return new Response(
          JSON.stringify({ error: 'Game not found in your library' }),
          { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      // Fetch game details from RAWG (by ID or slug)
      let rawgGame = null
      if (rawgId) {
        rawgGame = await getGameDetails(rawgId)
      } else if (rawgSlug) {
        rawgGame = await getGameDetailsBySlug(rawgSlug)
      }

      if (!rawgGame) {
        return new Response(
          JSON.stringify({ error: 'Game not found in RAWG database' }),
          { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      // Check if another game already uses this RAWG ID
      const existingGame = await queryOne<{ id: string; name: string }>(
        'SELECT id, name FROM games WHERE rawg_id = $1 AND id != $2',
        [rawgGame.id, gameId]
      )

      if (existingGame) {
        return new Response(
          JSON.stringify({
            error: `Another game already uses this RAWG ID: "${existingGame.name}". You may want to merge these entries instead.`,
          }),
          { status: 409, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      // Fetch series info
      let seriesName: string | null = null
      try {
        seriesName = await getGameSeries(rawgGame.id)
      } catch (error) {
        console.warn(`Failed to fetch series for RAWG ID ${rawgGame.id}:`, error)
      }

      // Update the game metadata
      await withTransaction(async (client) => {
        await client.query(
          `UPDATE games SET
            rawg_id = $1,
            name = $2,
            slug = $3,
            release_date = $4,
            description = $5,
            cover_art_url = $6,
            background_image_url = $7,
            metacritic_score = $8,
            esrb_rating = $9,
            series_name = COALESCE($10, series_name),
            expected_playtime = $11,
            updated_at = NOW()
          WHERE id = $12`,
          [
            rawgGame.id,
            rawgGame.name,
            rawgGame.slug,
            rawgGame.released || null,
            rawgGame.description_raw || null,
            rawgGame.background_image || null,
            rawgGame.background_image || null,
            rawgGame.metacritic || null,
            rawgGame.esrb_rating?.slug || null,
            seriesName,
            rawgGame.playtime || null,
            gameId,
          ]
        )

        // Update genres - first remove old ones
        await client.query('DELETE FROM game_genres WHERE game_id = $1', [gameId])

        // Insert new genres
        for (const genre of rawgGame.genres) {
          let genreRecord = await client.query(
            'SELECT id FROM genres WHERE rawg_id = $1',
            [genre.id]
          )

          if (genreRecord.rows.length === 0) {
            genreRecord = await client.query(
              'INSERT INTO genres (rawg_id, name) VALUES ($1, $2) RETURNING id',
              [genre.id, genre.name]
            )
          }

          await client.query(
            'INSERT INTO game_genres (game_id, genre_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [gameId, genreRecord.rows[0].id]
          )
        }
      })

      return new Response(
        JSON.stringify({
          success: true,
          game: {
            id: gameId,
            rawg_id: rawgGame.id,
            name: rawgGame.name,
            cover_art_url: rawgGame.background_image,
            description: rawgGame.description_raw,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    } catch (error) {
      console.error('Update from RAWG error:', error)
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    }
  })
)
