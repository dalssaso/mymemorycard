import { router } from "@/lib/router";
import { requireAuth } from "@/middleware/auth";
import { queryMany, query, queryOne } from "@/services/db";
import { corsHeaders } from "@/middleware/cors";

type AdditionType = "dlc" | "edition" | "other";

interface GameAddition {
  id: string;
  game_id: string;
  name: string;
  addition_type: AdditionType;
  is_complete_edition: boolean;
  weight: number;
  required_for_full: boolean;
}

interface UserGameEdition {
  id: string;
  user_id: string;
  game_id: string;
  platform_id: string;
  edition_id: string | null;
}

interface UserGameAddition {
  id: string;
  user_id: string;
  game_id: string;
  platform_id: string;
  addition_id: string;
  owned: boolean;
}

router.get(
  "/api/games/:gameId/ownership",
  requireAuth(async (req, user, params) => {
    try {
      const gameId = params?.gameId;
      if (!gameId) {
        return new Response(JSON.stringify({ error: "Game ID is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        });
      }

      const url = new URL(req.url);
      const platformId = url.searchParams.get("platform_id");

      if (!platformId) {
        return new Response(JSON.stringify({ error: "Platform ID is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        });
      }

      const userEdition = await queryOne<UserGameEdition>(
        "SELECT * FROM user_game_editions WHERE user_id = $1 AND game_id = $2 AND platform_id = $3",
        [user.id, gameId, platformId]
      );

      const ownedAdditions = await queryMany<UserGameAddition>(
        "SELECT * FROM user_game_additions WHERE user_id = $1 AND game_id = $2 AND platform_id = $3",
        [user.id, gameId, platformId]
      );

      const editions = await queryMany<GameAddition>(
        `SELECT id, game_id, name, addition_type, is_complete_edition, weight, required_for_full 
         FROM game_additions WHERE game_id = $1 AND addition_type = 'edition' ORDER BY name ASC`,
        [gameId]
      );

      const dlcs = await queryMany<GameAddition>(
        `SELECT id, game_id, name, addition_type, is_complete_edition, weight, required_for_full 
         FROM game_additions WHERE game_id = $1 AND addition_type = 'dlc' ORDER BY name ASC`,
        [gameId]
      );

      const selectedEdition = userEdition?.edition_id
        ? editions.find((e) => e.id === userEdition.edition_id)
        : null;

      const hasCompleteEdition = selectedEdition?.is_complete_edition || false;

      const ownedDlcIds = hasCompleteEdition
        ? dlcs.map((d) => d.id)
        : ownedAdditions.filter((a) => a.owned).map((a) => a.addition_id);

      return new Response(
        JSON.stringify({
          editionId: userEdition?.edition_id || null,
          editions,
          dlcs,
          ownedDlcIds,
          hasCompleteEdition,
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders() } }
      );
    } catch (error) {
      console.error("Get ownership error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }
  })
);

router.put(
  "/api/games/:gameId/ownership/edition",
  requireAuth(async (req, user, params) => {
    try {
      const gameId = params?.gameId;
      if (!gameId) {
        return new Response(JSON.stringify({ error: "Game ID is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        });
      }

      const body = (await req.json()) as {
        platformId: string;
        editionId: string | null;
      };

      const { platformId, editionId } = body;

      if (!platformId) {
        return new Response(JSON.stringify({ error: "Platform ID is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        });
      }

      if (editionId) {
        const edition = await queryOne<GameAddition>(
          "SELECT * FROM game_additions WHERE id = $1 AND game_id = $2 AND addition_type = 'edition'",
          [editionId, gameId]
        );

        if (!edition) {
          return new Response(JSON.stringify({ error: "Edition not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json", ...corsHeaders() },
          });
        }
      }

      await query(
        `INSERT INTO user_game_editions (user_id, game_id, platform_id, edition_id)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, game_id, platform_id) DO UPDATE SET
           edition_id = EXCLUDED.edition_id,
           updated_at = NOW()`,
        [user.id, gameId, platformId, editionId]
      );

      const userEdition = await queryOne<UserGameEdition>(
        "SELECT * FROM user_game_editions WHERE user_id = $1 AND game_id = $2 AND platform_id = $3",
        [user.id, gameId, platformId]
      );

      return new Response(
        JSON.stringify({
          editionId: userEdition?.edition_id || null,
          message: editionId ? "Edition updated" : "Edition cleared",
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders() } }
      );
    } catch (error) {
      console.error("Update edition error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }
  })
);

router.put(
  "/api/games/:gameId/ownership/dlcs",
  requireAuth(async (req, user, params) => {
    try {
      const gameId = params?.gameId;
      if (!gameId) {
        return new Response(JSON.stringify({ error: "Game ID is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        });
      }

      const body = (await req.json()) as {
        platformId: string;
        dlcIds: string[];
      };

      const { platformId, dlcIds } = body;

      if (!platformId) {
        return new Response(JSON.stringify({ error: "Platform ID is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        });
      }

      if (!Array.isArray(dlcIds)) {
        return new Response(JSON.stringify({ error: "dlcIds must be an array" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        });
      }

      const allDlcs = await queryMany<GameAddition>(
        "SELECT id FROM game_additions WHERE game_id = $1 AND addition_type = 'dlc'",
        [gameId]
      );

      const dlcIdSet = new Set(dlcIds);

      for (const dlc of allDlcs) {
        const owned = dlcIdSet.has(dlc.id);
        await query(
          `INSERT INTO user_game_additions (user_id, game_id, platform_id, addition_id, owned)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (user_id, game_id, platform_id, addition_id) DO UPDATE SET
             owned = EXCLUDED.owned`,
          [user.id, gameId, platformId, dlc.id, owned]
        );
      }

      return new Response(
        JSON.stringify({
          ownedDlcIds: dlcIds,
          message: `Updated ${dlcIds.length} DLC ownership`,
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders() } }
      );
    } catch (error) {
      console.error("Update DLC ownership error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }
  })
);
