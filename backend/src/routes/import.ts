import { router } from '@/lib/router'
import { requireAuth } from '@/middleware/auth'
import { query, queryOne, queryMany, withTransaction } from '@/services/db'
import { searchGames, getGameDetails, getGameSeries, type RAWGGame } from '@/services/rawg'
import { corsHeaders } from '@/middleware/cors'
import type { User, Game, Platform } from '@/types'

const EDITION_PATTERNS = [
  /\s*[-–—:]\s*complete\s*edition/i,
  /\s*[-–—:]\s*game\s*of\s*the\s*year\s*(edition)?/i,
  /\s*[-–—:]\s*goty\s*(edition)?/i,
  /\s*[-–—:]\s*definitive\s*edition/i,
  /\s*[-–—:]\s*deluxe\s*edition/i,
  /\s*[-–—:]\s*ultimate\s*edition/i,
  /\s*[-–—:]\s*gold\s*edition/i,
  /\s*[-–—:]\s*premium\s*edition/i,
  /\s*[-–—:]\s*enhanced\s*edition/i,
  /\s*[-–—:]\s*legendary\s*edition/i,
  /\s*[-–—:]\s*special\s*edition/i,
  /\s*[-–—:]\s*anniversary\s*edition/i,
]

function extractBaseGameName(gameName: string): { baseName: string; isEdition: boolean; editionSuffix: string | null } {
  for (const pattern of EDITION_PATTERNS) {
    const match = gameName.match(pattern)
    if (match) {
      return {
        baseName: gameName.replace(pattern, '').trim(),
        isEdition: true,
        editionSuffix: match[0].trim(),
      }
    }
  }
  return { baseName: gameName, isEdition: false, editionSuffix: null }
}

function normalizeForComparison(name: string): string {
  return name
    .toLowerCase()
    .replace(/[:\-–—]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

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
          let existingGame = await queryOne<Game>(
            'SELECT * FROM games WHERE LOWER(name) = LOWER($1)',
            [trimmedName]
          )

          // Also check if this is an edition and user already owns the base game
          const { baseName, isEdition } = extractBaseGameName(trimmedName)
          let matchedToBaseGame = false

          if (!existingGame && isEdition && platformId) {
            // Check if user owns the base game (by similar name matching)
            const userOwnedGames = await queryMany<Game>(
              `SELECT g.* FROM games g
               INNER JOIN user_games ug ON ug.game_id = g.id
               WHERE ug.user_id = $1`,
              [user.id]
            )

            // Find a base game match (normalize names for comparison to handle punctuation differences)
            const normalizedBaseName = normalizeForComparison(baseName)
            const baseGameMatch = userOwnedGames.find((g) => {
              const { baseName: existingBaseName } = extractBaseGameName(g.name)
              return normalizeForComparison(existingBaseName) === normalizedBaseName
            })

            if (baseGameMatch) {
              existingGame = baseGameMatch
              matchedToBaseGame = true
              console.log(`Edition detected in bulk import: "${trimmedName}" mapped to existing game "${existingGame.name}"`)
            }
          }

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

                // If matched to base game, set the display edition for this platform
                if (matchedToBaseGame && isEdition) {
                  await query(
                    `INSERT INTO user_game_display_editions 
                     (user_id, game_id, platform_id, edition_name)
                     VALUES ($1, $2, $3, $4)
                     ON CONFLICT (user_id, game_id, platform_id) DO UPDATE SET
                       edition_name = EXCLUDED.edition_name`,
                    [user.id, existingGame.id, platform.id, trimmedName]
                  )
                }
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
            // Fetch full game details (including description)
            const fullGameDetails = await getGameDetails(bestMatch.id)
            const gameToImport = fullGameDetails || bestMatch
            
            // We have a confident match, import it
            const game = await importGame(gameToImport, user, platformId)
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

    // Check if this is an edition and user already owns the base game
    const { baseName, isEdition } = extractBaseGameName(rawgGame.name)
    let existingBaseGame: Game | null = null

    if (!game && isEdition && platformId) {
      // Check if user owns the base game (by similar name matching)
      const userOwnedGames = await queryMany<Game & { user_game_id: string }>(
        `SELECT g.*, ug.id as user_game_id FROM games g
         INNER JOIN user_games ug ON ug.game_id = g.id
         WHERE ug.user_id = $1`,
        [user.id]
      )

      // Find a base game match (normalize names for comparison to handle punctuation differences)
      const normalizedBaseName = normalizeForComparison(baseName)
      existingBaseGame = userOwnedGames.find((g) => {
        const { baseName: existingBaseName } = extractBaseGameName(g.name)
        return normalizeForComparison(existingBaseName) === normalizedBaseName
      }) || null
    }

    if (existingBaseGame) {
      // User already owns the base game, add new platform to existing game
      game = existingBaseGame
      console.log(`Edition detected: "${rawgGame.name}" mapped to existing game "${game.name}"`)
    } else if (!game) {
      // Fetch game series in the background (optional, don't block import)
      let seriesName: string | null = null
      try {
        seriesName = await getGameSeries(rawgGame.id)
      } catch (error) {
        console.warn(`Failed to fetch series for ${rawgGame.name}:`, error)
      }

      // Create new game
      const result = await client.query<Game>(
        `INSERT INTO games (
          rawg_id, name, slug, release_date, description,
          cover_art_url, background_image_url, metacritic_score,
          esrb_rating, series_name
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
          seriesName,
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

      // If we matched to an existing base game and this is an edition,
      // set the display edition for this platform
      if (existingBaseGame && isEdition) {
        await client.query(
          `INSERT INTO user_game_display_editions 
           (user_id, game_id, platform_id, rawg_edition_id, edition_name, cover_art_url, background_image_url, description)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (user_id, game_id, platform_id) DO UPDATE SET
             rawg_edition_id = EXCLUDED.rawg_edition_id,
             edition_name = EXCLUDED.edition_name,
             cover_art_url = EXCLUDED.cover_art_url,
             background_image_url = EXCLUDED.background_image_url,
             description = EXCLUDED.description`,
          [
            user.id,
            game!.id,
            platform.id,
            rawgGame.id,
            rawgGame.name,
            rawgGame.background_image || null,
            rawgGame.background_image || null,
            rawgGame.description_raw || null,
          ]
        )
      }
    }

    return game!
  })
}
