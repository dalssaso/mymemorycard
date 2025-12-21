import { router } from '@/lib/router'
import { requireAuth } from '@/middleware/auth'
import { query, queryOne, withTransaction } from '@/services/db'
import { searchGames, type RAWGGame } from '@/services/rawg'
import { corsHeaders } from '@/middleware/cors'
import type { User, Game, Platform } from '@/types'

interface BulkImportRequest {
  gameNames: string[]
  platformId?: string
}

interface ImportResult {
  imported: Array<{
    game: Game
    source: 'exact' | 'best_match'
  }>
  needsReview: Array<{
    searchTerm: string
    candidates: RAWGGame[]
    error?: string
  }>
}

router.post(
  '/api/import/bulk',
  requireAuth(async (req, user) => {
    try {
      const body = (await req.json()) as BulkImportRequest
      const { gameNames, platformId } = body

      if (!gameNames || !Array.isArray(gameNames) || gameNames.length === 0) {
        return new Response(
          JSON.stringify({ error: 'gameNames array is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        )
      }

      const results: ImportResult = {
        imported: [],
        needsReview: [],
      }

      for (const gameName of gameNames) {
        const trimmedName = gameName.trim()
        if (!trimmedName) continue

        try {
          // First, check if we already have this game in our database by name
          const existingGame = await queryOne<Game>(
            'SELECT * FROM games WHERE LOWER(name) = LOWER($1)',
            [trimmedName]
          )

          if (existingGame) {
            // Game already exists, just associate with user
            if (platformId) {
              const platform = await queryOne<Platform>(
                'SELECT * FROM platforms WHERE id = $1',
                [platformId]
              )

              if (platform) {
                await query(
                  `INSERT INTO user_games (user_id, game_id, platform_id, owned, import_source)
                   VALUES ($1, $2, $3, true, 'bulk')
                   ON CONFLICT (user_id, game_id, platform_id) DO NOTHING`,
                  [user.id, existingGame.id, platform.id]
                )

                await query(
                  `INSERT INTO user_game_progress (user_id, game_id, platform_id, status)
                   VALUES ($1, $2, $3, 'backlog')
                   ON CONFLICT (user_id, game_id, platform_id) DO NOTHING`,
                  [user.id, existingGame.id, platform.id]
                )
              }
            }

            results.imported.push({
              game: existingGame,
              source: 'exact',
            })
            continue
          }

          // Game not in DB, search RAWG (this uses cache)
          const rawgResults = await searchGames(trimmedName)

          if (rawgResults.length === 0) {
            results.needsReview.push({
              searchTerm: trimmedName,
              candidates: [],
            })
            continue
          }

          // Check for exact match (case-insensitive)
          const exactMatch = rawgResults.find(
            (g) => g.name.toLowerCase() === trimmedName.toLowerCase()
          )

          // Check for very close match (within first 2 results and high confidence)
          const bestMatch =
            exactMatch ||
            (rawgResults.length === 1
              ? rawgResults[0]
              : rawgResults[0]?.name.toLowerCase().includes(trimmedName.toLowerCase())
              ? rawgResults[0]
              : null)

          if (bestMatch) {
            // We have a confident match, import it
            const game = await importGame(bestMatch, user, platformId)
            results.imported.push({
              game,
              source: exactMatch ? 'exact' : 'best_match',
            })
          } else {
            // Multiple matches, needs user review
            results.needsReview.push({
              searchTerm: trimmedName,
              candidates: rawgResults,
            })
          }
        } catch (error) {
          console.error(`Error processing game "${trimmedName}":`, error)
          results.needsReview.push({
            searchTerm: trimmedName,
            candidates: [],
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }

      return new Response(JSON.stringify(results), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      })
    } catch (error) {
      console.error('Bulk import error:', error)
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      })
    }
  })
)

async function importGame(
  rawgGame: RAWGGame,
  user: User,
  platformId?: string
): Promise<Game> {
  return withTransaction(async (client) => {
    // Check if game already exists by RAWG ID
    let game = await queryOne<Game>(
      'SELECT * FROM games WHERE rawg_id = $1',
      [rawgGame.id]
    )

    if (!game) {
      // Create new game
      const result = await client.query<Game>(
        `INSERT INTO games (
          rawg_id, name, slug, release_date, description,
          cover_art_url, background_image_url, metacritic_score,
          esrb_rating
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
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
        ]
      )
      game = result.rows[0]

      // Insert genres
      for (const genre of rawgGame.genres) {
        // Get or create genre
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

        // Link game to genre
        await client.query(
          'INSERT INTO game_genres (game_id, genre_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [game!.id, genreRecord.rows[0].id]
        )
      }
    }

    // Only create user_games and progress if platform is specified
    // If no platform, game is imported but not associated until review
    if (platformId) {
      const platform = await queryOne<Platform>(
        'SELECT * FROM platforms WHERE id = $1',
        [platformId]
      )

      if (!platform) {
        throw new Error('Platform not found')
      }

      // Add to user's library
      await client.query(
        `INSERT INTO user_games (user_id, game_id, platform_id, owned, import_source)
         VALUES ($1, $2, $3, true, 'bulk')
         ON CONFLICT (user_id, game_id, platform_id) DO NOTHING`,
        [user.id, game!.id, platform.id]
      )

      // Create initial progress entry
      await client.query(
        `INSERT INTO user_game_progress (user_id, game_id, platform_id, status)
         VALUES ($1, $2, $3, 'backlog')
         ON CONFLICT (user_id, game_id, platform_id) DO NOTHING`,
        [user.id, game!.id, platform.id]
      )
    }

    return game!
  })
}
