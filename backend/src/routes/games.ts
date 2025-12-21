import { router } from '@/lib/router'
import { requireAuth } from '@/middleware/auth'
import { queryMany } from '@/services/db'
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

      return new Response(
        JSON.stringify({ game: game[0], platforms: game }),
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
