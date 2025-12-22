import { router } from '@/lib/router'
import { requireAuth } from '@/middleware/auth'
import { queryMany, query } from '@/services/db'
import { getGameDetails } from '@/services/rawg'
import { corsHeaders } from '@/middleware/cors'
import type { Game } from '@/types'

// Backfill descriptions for games missing them
router.post(
  '/api/admin/backfill-descriptions',
  requireAuth(async (req, user) => {
    try {
      // Get all games with RAWG ID but no description
      const games = await queryMany<Game>(
        'SELECT id, rawg_id, name FROM games WHERE rawg_id IS NOT NULL AND (description IS NULL OR description = \'\')'
      )

      let updated = 0
      let failed = 0

      for (const game of games) {
        try {
          if (!game.rawg_id) continue

          // Fetch full details from RAWG
          const details = await getGameDetails(game.rawg_id)
          
          if (details?.description_raw) {
            await query(
              'UPDATE games SET description = $1, updated_at = NOW() WHERE id = $2',
              [details.description_raw, game.id]
            )
            updated++
            console.log(`Updated description for: ${game.name}`)
          }
        } catch (error) {
          console.error(`Failed to update ${game.name}:`, error)
          failed++
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          total: games.length,
          updated,
          failed,
          message: `Backfilled ${updated} game descriptions` 
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    } catch (error) {
      console.error('Backfill error:', error)
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    }
  })
)
