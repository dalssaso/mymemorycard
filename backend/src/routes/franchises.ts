import { router } from "@/lib/router";
import { requireAuth } from "@/middleware/auth";
import { query, queryOne, queryMany, withTransaction } from "@/services/db";
import {
  getGameSeriesMembers,
  getGameDetails,
  getGameSeries,
  type SeriesMember,
} from "@/services/rawg";
import { corsHeaders } from "@/middleware/cors";
import type { Game } from "@/types";

interface FranchiseSummary {
  series_name: string;
  game_count: number;
  cover_art_url: string | null;
}

interface OwnedGame {
  id: string;
  rawg_id: number | null;
  name: string;
  release_date: string | null;
  cover_art_url: string | null;
  platforms: string[];
  status: string;
}

router.get(
  "/api/franchises",
  requireAuth(async (req, user) => {
    try {
      const franchises = await queryMany<FranchiseSummary>(
        `SELECT 
          g.series_name,
          COUNT(DISTINCT g.id) as game_count,
          (
            SELECT cover_art_url
            FROM games g2
            INNER JOIN user_games ug2 ON g2.id = ug2.game_id
            WHERE ug2.user_id = $1 
              AND g2.series_name = g.series_name
              AND g2.cover_art_url IS NOT NULL
            ORDER BY 
              g2.metacritic_score DESC NULLS LAST,
              g2.release_date DESC NULLS LAST
            LIMIT 1
          ) as cover_art_url
         FROM games g
         INNER JOIN user_games ug ON g.id = ug.game_id
         WHERE ug.user_id = $1 AND g.series_name IS NOT NULL AND g.series_name != ''
         GROUP BY g.series_name
         HAVING COUNT(DISTINCT g.id) >= 1
         ORDER BY g.series_name ASC`,
        [user.id]
      );

      return new Response(JSON.stringify({ franchises }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    } catch (error) {
      console.error("Get franchises error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }
  })
);

router.get(
  "/api/franchises/:seriesName",
  requireAuth(async (req, user, params) => {
    try {
      const seriesName = params?.seriesName;
      if (!seriesName) {
        return new Response(JSON.stringify({ error: "Series name is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        });
      }

      const decodedSeriesName = decodeURIComponent(seriesName);

      const ownedGames = await queryMany<OwnedGame>(
        `SELECT 
          g.id,
          g.rawg_id,
          g.name,
          g.release_date,
          g.cover_art_url,
          ARRAY_AGG(DISTINCT p.name) as platforms,
          MAX(CASE 
            WHEN ugp.status = 'completed' THEN 5
            WHEN ugp.status = 'finished' THEN 4
            WHEN ugp.status = 'playing' THEN 3
            WHEN ugp.status = 'dropped' THEN 2
            ELSE 1
          END) as status_priority,
          (ARRAY_AGG(COALESCE(ugp.status, 'backlog') ORDER BY 
            CASE 
              WHEN ugp.status = 'completed' THEN 1
              WHEN ugp.status = 'finished' THEN 2
              WHEN ugp.status = 'playing' THEN 3
              WHEN ugp.status = 'dropped' THEN 4
              ELSE 5
            END
          ))[1] as status
         FROM games g
         INNER JOIN user_games ug ON g.id = ug.game_id
         LEFT JOIN platforms p ON ug.platform_id = p.id
         LEFT JOIN user_game_progress ugp ON g.id = ugp.game_id AND ug.platform_id = ugp.platform_id AND ugp.user_id = $1
         WHERE ug.user_id = $1 AND g.series_name = $2
         GROUP BY g.id, g.rawg_id, g.name, g.release_date, g.cover_art_url
         ORDER BY g.release_date ASC NULLS LAST, g.name ASC`,
        [user.id, decodedSeriesName]
      );

      if (ownedGames.length === 0) {
        return new Response(JSON.stringify({ error: "Franchise not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        });
      }

      const ownedRawgIds = new Set(ownedGames.map((g) => g.rawg_id).filter(Boolean));

      let missingGames: SeriesMember[] = [];

      const gameWithRawgId = ownedGames.find((g) => g.rawg_id);
      if (gameWithRawgId?.rawg_id) {
        try {
          const seriesData = await getGameSeriesMembers(gameWithRawgId.rawg_id);
          missingGames = seriesData.members.filter((m) => !ownedRawgIds.has(m.rawgId));
        } catch (error) {
          console.warn("Failed to fetch series members from RAWG:", error);
        }
      }

      return new Response(
        JSON.stringify({
          series_name: decodedSeriesName,
          owned_games: ownedGames,
          missing_games: missingGames,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        }
      );
    } catch (error) {
      console.error("Get franchise detail error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }
  })
);

router.post(
  "/api/franchises/sync",
  requireAuth(async (req, user) => {
    try {
      const gamesWithoutSeries = await queryMany<{ id: string; rawg_id: number }>(
        `SELECT DISTINCT g.id, g.rawg_id
         FROM games g
         INNER JOIN user_games ug ON g.id = ug.game_id
         WHERE ug.user_id = $1 
           AND g.rawg_id IS NOT NULL 
           AND (g.series_name IS NULL OR g.series_name = '')`,
        [user.id]
      );

      let updatedCount = 0;

      for (const game of gamesWithoutSeries) {
        try {
          const seriesData = await getGameSeriesMembers(game.rawg_id);
          if (seriesData.seriesName) {
            await query("UPDATE games SET series_name = $1 WHERE id = $2", [
              seriesData.seriesName,
              game.id,
            ]);
            updatedCount++;
          }
        } catch (error) {
          console.warn(`Failed to sync series for game ${game.id}:`, error);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          games_checked: gamesWithoutSeries.length,
          games_updated: updatedCount,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        }
      );
    } catch (error) {
      console.error("Sync franchises error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }
  })
);

router.post(
  "/api/franchises/import",
  requireAuth(async (req, user) => {
    try {
      const body = (await req.json()) as {
        rawgId: number;
        platformId: string;
        seriesName?: string;
      };
      const { rawgId, platformId, seriesName: providedSeriesName } = body;

      if (!rawgId || !platformId) {
        return new Response(JSON.stringify({ error: "rawgId and platformId are required" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        });
      }

      const platform = await queryOne<{ id: string }>("SELECT id FROM platforms WHERE id = $1", [
        platformId,
      ]);
      if (!platform) {
        return new Response(JSON.stringify({ error: "Platform not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        });
      }

      let game = await queryOne<Game>("SELECT * FROM games WHERE rawg_id = $1", [rawgId]);

      if (game && providedSeriesName && !game.series_name) {
        await query("UPDATE games SET series_name = $1 WHERE id = $2", [
          providedSeriesName,
          game.id,
        ]);
        game.series_name = providedSeriesName;
      }

      if (!game) {
        const rawgGame = await getGameDetails(rawgId);
        if (!rawgGame) {
          return new Response(JSON.stringify({ error: "Game not found in RAWG" }), {
            status: 404,
            headers: { "Content-Type": "application/json", ...corsHeaders() },
          });
        }

        let seriesName: string | null = providedSeriesName || null;
        if (!seriesName) {
          try {
            seriesName = await getGameSeries(rawgId);
          } catch (error) {
            console.warn(`Failed to fetch series for ${rawgGame.name}:`, error);
          }
        }

        game = await withTransaction(async (client) => {
          const result = await client.query<Game>(
            `INSERT INTO games (
              rawg_id, name, slug, release_date, description,
              cover_art_url, background_image_url, metacritic_score,
              esrb_rating, series_name, expected_playtime
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            ON CONFLICT (rawg_id) DO UPDATE SET
              name = EXCLUDED.name,
              slug = EXCLUDED.slug,
              release_date = EXCLUDED.release_date,
              description = EXCLUDED.description,
              cover_art_url = EXCLUDED.cover_art_url,
              background_image_url = EXCLUDED.background_image_url,
              metacritic_score = EXCLUDED.metacritic_score,
              esrb_rating = EXCLUDED.esrb_rating,
              series_name = COALESCE(EXCLUDED.series_name, games.series_name),
              expected_playtime = EXCLUDED.expected_playtime,
              updated_at = NOW()
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
              rawgGame.playtime || null,
            ]
          );
          const newGame = result.rows[0];

          for (const genre of rawgGame.genres) {
            const genreRecord = await client.query(
              `INSERT INTO genres (rawg_id, name)
               VALUES ($1, $2)
               ON CONFLICT (rawg_id) DO UPDATE SET name = EXCLUDED.name
               RETURNING id`,
              [genre.id, genre.name]
            );
            await client.query(
              "INSERT INTO game_genres (game_id, genre_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
              [newGame.id, genreRecord.rows[0].id]
            );
          }

          return newGame;
        });
      }

      await query(
        `INSERT INTO user_games (user_id, game_id, platform_id, owned, import_source)
         VALUES ($1, $2, $3, true, 'franchise')
         ON CONFLICT (user_id, game_id, platform_id) DO NOTHING`,
        [user.id, game.id, platformId]
      );

      await query(
        `INSERT INTO user_game_progress (user_id, game_id, platform_id, status)
         VALUES ($1, $2, $3, 'backlog')
         ON CONFLICT (user_id, game_id, platform_id) DO NOTHING`,
        [user.id, game.id, platformId]
      );

      return new Response(JSON.stringify({ success: true, game }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    } catch (error) {
      console.error("Import franchise game error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }
  })
);
