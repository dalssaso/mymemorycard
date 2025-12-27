import { router } from '@/lib/router'
import { requireAuth } from '@/middleware/auth'
import { queryMany, query, queryOne } from '@/services/db'
import { corsHeaders } from '@/middleware/cors'
import { getGameDetails, getGameAdditions } from '@/services/rawg'

interface DisplayEdition {
  id: string
  rawg_edition_id: number | null
  edition_name: string
  cover_art_url: string | null
  background_image_url: string | null
  description: string | null
}

interface RawgEditionOption {
  rawg_id: number
  name: string
  cover_url: string | null
  background_url: string | null
  description: string | null
}

router.get(
  '/api/games/:gameId/display-edition',
  requireAuth(async (req, user, params) => {
    try {
      const gameId = params?.gameId
      if (!gameId) {
        return new Response(JSON.stringify({ error: 'Game ID is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        })
      }

      const url = new URL(req.url)
      const platformId = url.searchParams.get('platform_id')

      if (!platformId) {
        return new Response(JSON.stringify({ error: 'Platform ID is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        })
      }

      const displayEdition = await queryOne<DisplayEdition>(
        `SELECT id, rawg_edition_id, edition_name, cover_art_url, background_image_url, description
         FROM user_game_display_editions
         WHERE user_id = $1 AND game_id = $2 AND platform_id = $3`,
        [user.id, gameId, platformId]
      )

      const game = await queryOne<{ rawg_id: number | null; name: string }>(
        'SELECT rawg_id, name FROM games WHERE id = $1',
        [gameId]
      )

      let availableEditions: RawgEditionOption[] = []

      if (game?.rawg_id) {
        const additions = await getGameAdditions(game.rawg_id)
        const editionAdditions = additions.filter((a) => {
          const name = a.name.toLowerCase()
          return (
            name.includes('edition') ||
            name.includes('goty') ||
            name.includes('game of the year') ||
            name.includes('complete') ||
            name.includes('definitive') ||
            name.includes('ultimate') ||
            name.includes('legendary')
          )
        })

        for (const addition of editionAdditions) {
          const details = await getGameDetails(addition.id)
          availableEditions.push({
            rawg_id: addition.id,
            name: addition.name,
            cover_url: details?.background_image || addition.background_image,
            background_url: details?.background_image || addition.background_image,
            description: details?.description_raw || null,
          })
        }
      }

      return new Response(
        JSON.stringify({
          currentDisplay: displayEdition,
          baseGame: game ? { name: game.name, rawg_id: game.rawg_id } : null,
          availableEditions,
          isUsingEdition: !!displayEdition,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    } catch (error) {
      console.error('Get display edition error:', error)
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      })
    }
  })
)

router.put(
  '/api/games/:gameId/display-edition',
  requireAuth(async (req, user, params) => {
    try {
      const gameId = params?.gameId
      if (!gameId) {
        return new Response(JSON.stringify({ error: 'Game ID is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        })
      }

      const body = (await req.json()) as {
        platformId: string
        rawgEditionId: number
        editionName: string
        coverArtUrl: string | null
        backgroundImageUrl: string | null
        description: string | null
      }

      const { platformId, rawgEditionId, editionName, coverArtUrl, backgroundImageUrl, description } = body

      if (!platformId || !editionName) {
        return new Response(JSON.stringify({ error: 'Platform ID and edition name are required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        })
      }

      await query(
        `INSERT INTO user_game_display_editions 
         (user_id, game_id, platform_id, rawg_edition_id, edition_name, cover_art_url, background_image_url, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (user_id, game_id, platform_id) DO UPDATE SET
           rawg_edition_id = EXCLUDED.rawg_edition_id,
           edition_name = EXCLUDED.edition_name,
           cover_art_url = EXCLUDED.cover_art_url,
           background_image_url = EXCLUDED.background_image_url,
           description = EXCLUDED.description,
           updated_at = NOW()`,
        [user.id, gameId, platformId, rawgEditionId, editionName, coverArtUrl, backgroundImageUrl, description]
      )

      return new Response(
        JSON.stringify({ message: 'Display edition updated', editionName }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    } catch (error) {
      console.error('Set display edition error:', error)
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      })
    }
  })
)

router.delete(
  '/api/games/:gameId/display-edition',
  requireAuth(async (req, user, params) => {
    try {
      const gameId = params?.gameId
      if (!gameId) {
        return new Response(JSON.stringify({ error: 'Game ID is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        })
      }

      const url = new URL(req.url)
      const platformId = url.searchParams.get('platform_id')

      if (!platformId) {
        return new Response(JSON.stringify({ error: 'Platform ID is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        })
      }

      await query(
        'DELETE FROM user_game_display_editions WHERE user_id = $1 AND game_id = $2 AND platform_id = $3',
        [user.id, gameId, platformId]
      )

      return new Response(
        JSON.stringify({ message: 'Display edition reset to base game' }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    } catch (error) {
      console.error('Reset display edition error:', error)
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      })
    }
  })
)
