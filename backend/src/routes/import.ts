import { router } from "@/lib/router";
import { requireAuth } from "@/middleware/auth";
import { queryOne, queryMany, withTransaction } from "@/services/db";
import { searchGames, getGameDetails, getGameSeries, type RAWGGame } from "@/services/rawg";
import { corsHeaders } from "@/middleware/cors";
import type { User, Game } from "@/types";

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
];

function extractBaseGameName(gameName: string): {
  baseName: string;
  isEdition: boolean;
  editionSuffix: string | null;
} {
  for (const pattern of EDITION_PATTERNS) {
    const match = gameName.match(pattern);
    if (match) {
      return {
        baseName: gameName.replace(pattern, "").trim(),
        isEdition: true,
        editionSuffix: match[0].trim(),
      };
    }
  }
  return { baseName: gameName, isEdition: false, editionSuffix: null };
}

function normalizeForComparison(name: string): string {
  return name
    .toLowerCase()
    .replace(/[:\-–—]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function findBaseGameDetails(
  baseName: string,
  excludeRawgId?: number
): Promise<RAWGGame | null> {
  const searchResults = await searchGames(baseName);
  if (searchResults.length === 0) {
    return null;
  }

  const normalizedBaseName = normalizeForComparison(baseName);
  const candidates = excludeRawgId
    ? searchResults.filter((result) => result.id !== excludeRawgId)
    : searchResults;

  const matchedBaseGame =
    candidates.find((result) => {
      const { baseName: candidateBaseName, isEdition: candidateIsEdition } = extractBaseGameName(
        result.name
      );
      return (
        !candidateIsEdition && normalizeForComparison(candidateBaseName) === normalizedBaseName
      );
    }) ||
    candidates.find((result) => {
      const { baseName: candidateBaseName } = extractBaseGameName(result.name);
      return normalizeForComparison(candidateBaseName) === normalizedBaseName;
    });

  if (!matchedBaseGame) {
    return null;
  }

  return (await getGameDetails(matchedBaseGame.id)) || matchedBaseGame;
}

interface BulkImportRequest {
  gameNames: string[];
  platformId?: string;
}

interface ImportResult {
  imported: Array<{
    game: Game;
    source: "exact" | "selected";
  }>;
  needsReview: Array<{
    searchTerm: string;
    candidates: RAWGGame[];
    error?: string;
  }>;
}

router.post(
  "/api/import/single",
  requireAuth(async (req, user) => {
    try {
      const body = (await req.json()) as { rawgId: number; platformId?: string };
      const { rawgId, platformId } = body;

      if (!rawgId || typeof rawgId !== "number") {
        return new Response(JSON.stringify({ error: "rawgId is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        });
      }

      const fullGameDetails = await getGameDetails(rawgId);
      if (!fullGameDetails) {
        return new Response(JSON.stringify({ error: "Game not found in RAWG" }), {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        });
      }

      const game = await importGame(fullGameDetails, user, platformId);
      const { isEdition } = extractBaseGameName(fullGameDetails.name);
      const display = isEdition
        ? {
            name: fullGameDetails.name,
            cover_art_url: fullGameDetails.background_image || null,
          }
        : null;

      return new Response(JSON.stringify({ game, source: "selected", display }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    } catch (error) {
      console.error("Single import error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }
  })
);

router.post(
  "/api/import/bulk",
  requireAuth(async (req, _user) => {
    try {
      const body = (await req.json()) as BulkImportRequest;
      const { gameNames } = body;

      if (!gameNames || !Array.isArray(gameNames) || gameNames.length === 0) {
        return new Response(JSON.stringify({ error: "gameNames array is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        });
      }

      const results: ImportResult = {
        imported: [],
        needsReview: [],
      };

      for (const gameName of gameNames) {
        const trimmedName = gameName.trim();
        if (!trimmedName) continue;

        try {
          // Always search RAWG first to find the correct game by exact match
          // The importGame function will check if game exists in DB by RAWG ID
          const rawgResults = await searchGames(trimmedName);

          if (rawgResults.length === 0) {
            results.needsReview.push({
              searchTerm: trimmedName,
              candidates: [],
            });
            continue;
          }

          // Always require user review to select the correct game
          // RAWG has many games with similar/same names (e.g., "God Of War" game jam vs "God of War (2018)")
          // Auto-import is unreliable, so user must always confirm
          results.needsReview.push({
            searchTerm: trimmedName,
            candidates: rawgResults,
          });
        } catch (error) {
          console.error(`Error processing game "${trimmedName}":`, error);
          results.needsReview.push({
            searchTerm: trimmedName,
            candidates: [],
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      return new Response(JSON.stringify(results), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    } catch (error) {
      console.error("Bulk import error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }
  })
);

async function importGame(rawgGame: RAWGGame, user: User, platformId?: string): Promise<Game> {
  return withTransaction(async (client) => {
    const { baseName, isEdition } = extractBaseGameName(rawgGame.name);
    let existingBaseGame: Game | null = null;

    if (isEdition && platformId) {
      // Check if user owns the base game (by similar name matching)
      const userOwnedGames = await queryMany<Game & { user_game_id: string }>(
        `SELECT g.*, ug.id as user_game_id FROM games g
         INNER JOIN user_games ug ON ug.game_id = g.id
         WHERE ug.user_id = $1`,
        [user.id]
      );

      // Find a base game match (normalize names for comparison to handle punctuation differences)
      const normalizedBaseName = normalizeForComparison(baseName);
      existingBaseGame =
        userOwnedGames.find((g) => {
          const { baseName: existingBaseName } = extractBaseGameName(g.name);
          return normalizeForComparison(existingBaseName) === normalizedBaseName;
        }) || null;
    }

    let baseGameDetails: RAWGGame | null = null;

    if (!existingBaseGame && isEdition) {
      try {
        baseGameDetails = await findBaseGameDetails(baseName, rawgGame.id);
      } catch (error) {
        console.warn(`Failed to resolve base game for "${rawgGame.name}":`, error);
      }
    }

    const primaryDetails = baseGameDetails || rawgGame;

    // Check if game already exists by RAWG ID (base if available)
    let game = existingBaseGame;
    if (!game) {
      game = await queryOne<Game>("SELECT * FROM games WHERE rawg_id = $1", [primaryDetails.id]);
    }

    if (existingBaseGame) {
      // User already owns the base game, add new platform to existing game
      game = existingBaseGame;
      console.log(`Edition detected: "${rawgGame.name}" mapped to existing game "${game.name}"`);
    } else if (!game) {
      let shouldInsertGenres = false;

      if (baseGameDetails) {
        const editionGame = await queryOne<Game>("SELECT * FROM games WHERE rawg_id = $1", [
          rawgGame.id,
        ]);

        if (editionGame) {
          let seriesName: string | null = null;
          try {
            seriesName = await getGameSeries(primaryDetails.id);
          } catch (error) {
            console.warn(`Failed to fetch series for ${primaryDetails.name}:`, error);
          }

          const result = await client.query<Game>(
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
              series_name = $10,
              expected_playtime = $11,
              updated_at = NOW()
             WHERE id = $12
             RETURNING *`,
            [
              primaryDetails.id,
              primaryDetails.name,
              primaryDetails.slug,
              primaryDetails.released || null,
              primaryDetails.description_raw || null,
              primaryDetails.background_image || null,
              primaryDetails.background_image || null,
              primaryDetails.metacritic || null,
              primaryDetails.esrb_rating?.slug || null,
              seriesName,
              primaryDetails.playtime || null,
              editionGame.id,
            ]
          );

          game = result.rows[0];
          shouldInsertGenres = true;
        }
      }

      if (!game) {
        // Fetch game series in the background (optional, don't block import)
        let seriesName: string | null = null;
        try {
          seriesName = await getGameSeries(primaryDetails.id);
        } catch (error) {
          console.warn(`Failed to fetch series for ${primaryDetails.name}:`, error);
        }

        // Create new game
        const result = await client.query<Game>(
          `INSERT INTO games (
            rawg_id, name, slug, release_date, description,
            cover_art_url, background_image_url, metacritic_score,
            esrb_rating, series_name, expected_playtime
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING *`,
          [
            primaryDetails.id,
            primaryDetails.name,
            primaryDetails.slug,
            primaryDetails.released || null,
            primaryDetails.description_raw || null,
            primaryDetails.background_image || null,
            primaryDetails.background_image || null,
            primaryDetails.metacritic || null,
            primaryDetails.esrb_rating?.slug || null,
            seriesName,
            primaryDetails.playtime || null,
          ]
        );
        game = result.rows[0];
        shouldInsertGenres = true;
      }

      if (shouldInsertGenres) {
        // Insert genres
        for (const genre of primaryDetails.genres) {
          // Get or create genre
          let genreRecord = await client.query("SELECT id FROM genres WHERE rawg_id = $1", [
            genre.id,
          ]);

          if (genreRecord.rows.length === 0) {
            genreRecord = await client.query(
              "INSERT INTO genres (rawg_id, name) VALUES ($1, $2) RETURNING id",
              [genre.id, genre.name]
            );
          }

          // Link game to genre
          await client.query(
            "INSERT INTO game_genres (game_id, genre_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
            [game!.id, genreRecord.rows[0].id]
          );
        }
      }
    }

    // Only create user_games and progress if platform is specified
    // If no platform, game is imported but not associated until review
    if (platformId) {
      const platform = await queryOne<{ id: string }>("SELECT id FROM platforms WHERE id = $1", [
        platformId,
      ]);

      if (!platform) {
        throw new Error("Platform not found");
      }

      // Add to user's library
      await client.query(
        `INSERT INTO user_games (user_id, game_id, platform_id, owned, import_source)
         VALUES ($1, $2, $3, true, 'bulk')
         ON CONFLICT (user_id, game_id, platform_id) DO NOTHING`,
        [user.id, game!.id, platformId]
      );

      // Create initial progress entry
      await client.query(
        `INSERT INTO user_game_progress (user_id, game_id, platform_id, status)
         VALUES ($1, $2, $3, 'backlog')
         ON CONFLICT (user_id, game_id, platform_id) DO NOTHING`,
        [user.id, game!.id, platformId]
      );

      // If we matched to an existing base game and this is an edition,
      // set the display edition for this platform
      if (isEdition && (existingBaseGame || baseGameDetails)) {
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
            platformId,
            rawgGame.id,
            rawgGame.name,
            rawgGame.background_image || null,
            rawgGame.background_image || null,
            rawgGame.description_raw || null,
          ]
        );
      }
    }

    return game!;
  });
}
