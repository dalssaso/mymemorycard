import { router } from '@/lib/router'
import { requireAuth } from '@/middleware/auth'
import { queryMany, query, queryOne } from '@/services/db'
import { corsHeaders } from '@/middleware/cors'
import { getGameAdditions, classifyAddition } from '@/services/rawg'

type AdditionType = 'dlc' | 'edition' | 'other'

interface GameAddition {
  id: string
  game_id: string
  rawg_addition_id: number
  name: string
  slug: string | null
  released: string | null
  cover_image_url: string | null
  addition_type: AdditionType
  is_complete_edition: boolean
  weight: number
  required_for_full: boolean
  created_at: string
}

interface AdditionWithProgress extends GameAddition {
  percentage: number
  owned: boolean
}

async function syncAdditionsFromRawg(gameId: string, rawgId: number): Promise<void> {
  const rawgAdditions = await getGameAdditions(rawgId)

  for (const addition of rawgAdditions) {
    const classification = classifyAddition(addition.name)
    await query(
      `INSERT INTO game_additions (game_id, rawg_addition_id, name, slug, released, cover_image_url, addition_type, is_complete_edition)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (game_id, rawg_addition_id) DO UPDATE SET
         name = EXCLUDED.name,
         slug = EXCLUDED.slug,
         released = EXCLUDED.released,
         cover_image_url = EXCLUDED.cover_image_url,
         addition_type = EXCLUDED.addition_type,
         is_complete_edition = EXCLUDED.is_complete_edition`,
      [
        gameId,
        addition.id,
        addition.name,
        addition.slug,
        addition.released,
        addition.background_image,
        classification.type,
        classification.isComplete,
      ]
    )
  }
}

router.get(
  '/api/games/:gameId/additions',
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

      let additions = await queryMany<GameAddition>(
        `SELECT * FROM game_additions WHERE game_id = $1 
         ORDER BY addition_type ASC, released ASC NULLS LAST, name ASC`,
        [gameId]
      )

      if (additions.length === 0 && game.rawg_id) {
        await syncAdditionsFromRawg(gameId, game.rawg_id)
        additions = await queryMany<GameAddition>(
          `SELECT * FROM game_additions WHERE game_id = $1 
           ORDER BY addition_type ASC, released ASC NULLS LAST, name ASC`,
          [gameId]
        )
      }

      let userEdition: { edition_id: string | null } | null = null
      let ownedDlcIds: Set<string> = new Set()

      if (platformId) {
        userEdition = await queryOne<{ edition_id: string | null }>(
          'SELECT edition_id FROM user_game_editions WHERE user_id = $1 AND game_id = $2 AND platform_id = $3',
          [user.id, gameId, platformId]
        )

        const ownedDlcs = await queryMany<{ addition_id: string }>(
          'SELECT addition_id FROM user_game_additions WHERE user_id = $1 AND game_id = $2 AND platform_id = $3 AND owned = true',
          [user.id, gameId, platformId]
        )
        ownedDlcIds = new Set(ownedDlcs.map((d) => d.addition_id))
      }

      const hasCompleteEdition =
        userEdition?.edition_id &&
        additions.find((a) => a.id === userEdition?.edition_id && a.is_complete_edition)

      const additionsWithProgress: AdditionWithProgress[] = []

      for (const addition of additions) {
        let percentage = 0
        let owned = false

        if (addition.addition_type === 'dlc') {
          if (hasCompleteEdition) {
            owned = true
          } else {
            owned = ownedDlcIds.has(addition.id)
          }
        } else if (addition.addition_type === 'edition') {
          owned = userEdition?.edition_id === addition.id
        }

        if (platformId && addition.addition_type === 'dlc') {
          const latestLog = await queryOne<{ percentage: number }>(
            `SELECT percentage FROM completion_logs 
             WHERE user_id = $1 AND game_id = $2 AND platform_id = $3 
               AND completion_type = 'dlc' AND dlc_id = $4
             ORDER BY logged_at DESC LIMIT 1`,
            [user.id, gameId, platformId, addition.id]
          )
          percentage = latestLog?.percentage || 0
        }

        additionsWithProgress.push({
          ...addition,
          percentage,
          owned,
        })
      }

      const dlcs = additionsWithProgress.filter((a) => a.addition_type === 'dlc')
      const editions = additionsWithProgress.filter((a) => a.addition_type === 'edition')

      return new Response(
        JSON.stringify({
          additions: additionsWithProgress,
          dlcs,
          editions,
          total: additions.length,
          hasDlcs: dlcs.length > 0,
          hasEditions: editions.length > 0,
          userEditionId: userEdition?.edition_id || null,
          hasCompleteEdition: !!hasCompleteEdition,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    } catch (error) {
      console.error('Get game additions error:', error)
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      })
    }
  })
)

router.put(
  '/api/games/:gameId/additions/:additionId',
  requireAuth(async (req, user, params) => {
    try {
      const gameId = params?.gameId
      const additionId = params?.additionId

      if (!gameId || !additionId) {
        return new Response(JSON.stringify({ error: 'Game ID and Addition ID are required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        })
      }

      const body = (await req.json()) as {
        weight?: number
        requiredForFull?: boolean
      }

      const { weight, requiredForFull } = body

      const addition = await queryOne<GameAddition>(
        'SELECT * FROM game_additions WHERE id = $1 AND game_id = $2',
        [additionId, gameId]
      )

      if (!addition) {
        return new Response(JSON.stringify({ error: 'Addition not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        })
      }

      const updated = await queryOne<GameAddition>(
        `UPDATE game_additions SET
           weight = COALESCE($1, weight),
           required_for_full = COALESCE($2, required_for_full)
         WHERE id = $3
         RETURNING *`,
        [weight, requiredForFull, additionId]
      )

      return new Response(JSON.stringify({ addition: updated }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      })
    } catch (error) {
      console.error('Update game addition error:', error)
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      })
    }
  })
)

router.post(
  '/api/games/:gameId/additions/sync',
  requireAuth(async (req, user, params) => {
    try {
      const gameId = params?.gameId
      if (!gameId) {
        return new Response(JSON.stringify({ error: 'Game ID is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        })
      }

      const game = await queryOne<{ rawg_id: number | null }>(
        'SELECT rawg_id FROM games WHERE id = $1',
        [gameId]
      )

      if (!game || !game.rawg_id) {
        return new Response(JSON.stringify({ error: 'Game not found or no RAWG ID' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        })
      }

      await syncAdditionsFromRawg(gameId, game.rawg_id)

      const additions = await queryMany<GameAddition>(
        `SELECT * FROM game_additions WHERE game_id = $1 
         ORDER BY addition_type ASC, released ASC NULLS LAST, name ASC`,
        [gameId]
      )

      return new Response(
        JSON.stringify({
          message: `Synced ${additions.length} additions from RAWG`,
          additions,
          total: additions.length,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      )
    } catch (error) {
      console.error('Sync game additions error:', error)
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      })
    }
  })
)
