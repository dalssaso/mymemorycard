import { router } from "@/lib/router";
import { requireAuth } from "@/middleware/auth";
import { query, queryOne, queryMany } from "@/services/db";
import { corsHeaders } from "@/middleware/cors";

interface Collection {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  cover_filename: string | null;
  created_at: Date;
}

// Get all collections for the user
router.get(
  "/api/collections",
  requireAuth(async (req, user) => {
    try {
      const collections = await queryMany<Collection>(
        `SELECT id, name, description, cover_filename, created_at
         FROM collections
         WHERE user_id = $1
         ORDER BY name ASC`,
        [user.id]
      );

      // Get game counts and cover art for each collection
      const collectionsWithCounts = await Promise.all(
        collections.map(async (collection) => {
          const countResult = await queryOne<{ count: number }>(
            "SELECT COUNT(*) as count FROM collection_games WHERE collection_id = $1",
            [collection.id]
          );

          // Get cover art from the highest-rated or most recent game (with display edition support)
          const coverResult = await queryOne<{ cover_art_url: string | null }>(
            `SELECT COALESCE(ugde.cover_art_url, g.cover_art_url) as cover_art_url
             FROM games g
             INNER JOIN collection_games cg ON g.id = cg.game_id
             LEFT JOIN user_games ug ON g.id = ug.game_id AND ug.user_id = $2
             LEFT JOIN user_game_display_editions ugde
               ON g.id = ugde.game_id AND ugde.user_id = $2 AND ugde.platform_id = ug.platform_id
             WHERE cg.collection_id = $1
               AND COALESCE(ugde.cover_art_url, g.cover_art_url) IS NOT NULL
             ORDER BY g.metacritic_score DESC NULLS LAST, g.release_date DESC NULLS LAST
             LIMIT 1`,
            [collection.id, user.id]
          );

          return {
            ...collection,
            game_count: countResult?.count || 0,
            cover_art_url: coverResult?.cover_art_url || null,
          };
        })
      );

      return new Response(JSON.stringify({ collections: collectionsWithCounts }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    } catch (error) {
      console.error("Get collections error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }
  })
);

// Get games in a specific collection
router.get(
  "/api/collections/:id/games",
  requireAuth(async (req, user, params) => {
    try {
      const collectionId = params?.id;
      if (!collectionId) {
        return new Response(JSON.stringify({ error: "Collection ID is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        });
      }

      // Verify user owns this collection
      const collection = await queryOne<Collection>(
        "SELECT id, name, description, cover_filename, created_at FROM collections WHERE id = $1 AND user_id = $2",
        [collectionId, user.id]
      );

      if (!collection) {
        return new Response(JSON.stringify({ error: "Collection not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        });
      }

      // Get cover art from the highest-rated or most recent game (with display edition support)
      const coverResult = await queryOne<{ cover_art_url: string | null }>(
        `SELECT COALESCE(ugde.cover_art_url, g.cover_art_url) as cover_art_url
         FROM games g
         INNER JOIN collection_games cg ON g.id = cg.game_id
         LEFT JOIN user_games ug ON g.id = ug.game_id AND ug.user_id = $2
         LEFT JOIN user_game_display_editions ugde
           ON g.id = ugde.game_id AND ugde.user_id = $2 AND ugde.platform_id = ug.platform_id
         WHERE cg.collection_id = $1
           AND COALESCE(ugde.cover_art_url, g.cover_art_url) IS NOT NULL
         ORDER BY g.metacritic_score DESC NULLS LAST, g.release_date DESC NULLS LAST
         LIMIT 1`,
        [collectionId, user.id]
      );

      const games = await queryMany(
        `SELECT 
          g.*,
          first_ug.platform_id,
          first_ug.platform_display_name,
          first_ug.status,
          first_ug.user_rating,
          first_ug.is_favorite
         FROM games g
         INNER JOIN collection_games cg ON g.id = cg.game_id
         LEFT JOIN LATERAL (
           SELECT 
             ug.platform_id,
             p.display_name as platform_display_name,
             ugp.status,
             ugp.user_rating,
             ugp.is_favorite
           FROM user_games ug
           LEFT JOIN platforms p ON ug.platform_id = p.id
           LEFT JOIN user_game_progress ugp ON g.id = ugp.game_id AND ug.platform_id = ugp.platform_id AND ugp.user_id = $1
           WHERE ug.game_id = g.id AND ug.user_id = $1
           LIMIT 1
         ) first_ug ON true
         WHERE cg.collection_id = $2
         ORDER BY g.name ASC`,
        [user.id, collectionId]
      );

      return new Response(
        JSON.stringify({
          collection: {
            ...collection,
            cover_art_url: coverResult?.cover_art_url || null,
          },
          games,
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders() } }
      );
    } catch (error) {
      console.error("Get collection games error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }
  })
);

// Create a new collection
router.post(
  "/api/collections",
  requireAuth(async (req, user) => {
    try {
      const body = (await req.json()) as { name?: string; description?: string };
      const { name, description } = body;

      if (!name || !name.trim()) {
        return new Response(JSON.stringify({ error: "Collection name is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        });
      }

      const result = await query<Collection>(
        `INSERT INTO collections (user_id, name, description)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [user.id, name.trim(), description?.trim() || null]
      );

      return new Response(JSON.stringify({ collection: result.rows[0] }), {
        status: 201,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    } catch (error) {
      console.error("Create collection error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }
  })
);

// Update a collection
router.put(
  "/api/collections/:id",
  requireAuth(async (req, user, params) => {
    try {
      const collectionId = params?.id;
      const body = (await req.json()) as { name?: string; description?: string };
      const { name, description } = body;

      if (!collectionId) {
        return new Response(JSON.stringify({ error: "Collection ID is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        });
      }

      if (!name || !name.trim()) {
        return new Response(JSON.stringify({ error: "Collection name is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        });
      }

      // Verify ownership
      const existing = await queryOne("SELECT 1 FROM collections WHERE id = $1 AND user_id = $2", [
        collectionId,
        user.id,
      ]);

      if (!existing) {
        return new Response(JSON.stringify({ error: "Collection not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        });
      }

      const result = await query<Collection>(
        `UPDATE collections 
         SET name = $1, description = $2
         WHERE id = $3 AND user_id = $4
         RETURNING *`,
        [name.trim(), description?.trim() || null, collectionId, user.id]
      );

      return new Response(JSON.stringify({ collection: result.rows[0] }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    } catch (error) {
      console.error("Update collection error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }
  })
);

// Delete a collection
router.delete(
  "/api/collections/:id",
  requireAuth(async (req, user, params) => {
    try {
      const collectionId = params?.id;
      if (!collectionId) {
        return new Response(JSON.stringify({ error: "Collection ID is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        });
      }

      // Get collection to find cover filename
      const collection = await queryOne<{ cover_filename: string | null }>(
        "SELECT cover_filename FROM collections WHERE id = $1 AND user_id = $2",
        [collectionId, user.id]
      );

      if (!collection) {
        return new Response(JSON.stringify({ error: "Collection not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        });
      }

      // Delete from database
      await query("DELETE FROM collections WHERE id = $1 AND user_id = $2", [
        collectionId,
        user.id,
      ]);

      // Delete cover file if exists
      if (collection.cover_filename) {
        const fs = await import("fs/promises");
        const path = await import("path");
        const coverPath = path.join(
          import.meta.dir,
          "../../uploads/collection-covers",
          collection.cover_filename
        );
        try {
          await fs.unlink(coverPath);
        } catch (err) {
          console.error("Failed to delete cover file:", err);
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    } catch (error) {
      console.error("Delete collection error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }
  })
);

// Add game to collection
router.post(
  "/api/collections/:id/games",
  requireAuth(async (req, user, params) => {
    try {
      const collectionId = params?.id;
      const body = (await req.json()) as { game_id?: string };
      const { game_id } = body;

      if (!collectionId || !game_id) {
        return new Response(JSON.stringify({ error: "Collection ID and game ID are required" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        });
      }

      // Verify ownership
      const collection = await queryOne(
        "SELECT 1 FROM collections WHERE id = $1 AND user_id = $2",
        [collectionId, user.id]
      );

      if (!collection) {
        return new Response(JSON.stringify({ error: "Collection not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        });
      }

      // Add game to collection (ignore if already exists)
      await query(
        `INSERT INTO collection_games (collection_id, game_id)
         VALUES ($1, $2)
         ON CONFLICT (collection_id, game_id) DO NOTHING`,
        [collectionId, game_id]
      );

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    } catch (error) {
      console.error("Add game to collection error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }
  })
);

// Remove game from collection
router.delete(
  "/api/collections/:id/games/:gameId",
  requireAuth(async (req, user, params) => {
    try {
      const collectionId = params?.id;
      const gameId = params?.gameId;

      if (!collectionId || !gameId) {
        return new Response(JSON.stringify({ error: "Collection ID and game ID are required" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        });
      }

      // Verify ownership
      const collection = await queryOne(
        "SELECT 1 FROM collections WHERE id = $1 AND user_id = $2",
        [collectionId, user.id]
      );

      if (!collection) {
        return new Response(JSON.stringify({ error: "Collection not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        });
      }

      await query("DELETE FROM collection_games WHERE collection_id = $1 AND game_id = $2", [
        collectionId,
        gameId,
      ]);

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    } catch (error) {
      console.error("Remove game from collection error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }
  })
);

// Get game series (auto-collections based on series_name)
router.get(
  "/api/collections/series",
  requireAuth(async (req, user) => {
    try {
      const series = await queryMany<{
        series_name: string;
        owned_count: number;
        cover_art_url: string | null;
      }>(
        `SELECT
          g.series_name,
          COUNT(DISTINCT g.id) as owned_count,
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
         WHERE ug.user_id = $1 AND g.series_name IS NOT NULL
         GROUP BY g.series_name
         HAVING COUNT(DISTINCT g.id) >= 1
         ORDER BY owned_count DESC, g.series_name ASC`,
        [user.id]
      );

      return new Response(JSON.stringify({ series }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    } catch (error) {
      console.error("Get series error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }
  })
);

// Get games in a series
router.get(
  "/api/collections/series/:seriesName/games",
  requireAuth(async (req, user, params) => {
    try {
      const seriesName = params?.seriesName;
      if (!seriesName) {
        return new Response(JSON.stringify({ error: "Series name is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        });
      }

      const games = await queryMany(
        `SELECT 
          g.*,
          p.id as platform_id,
          p.display_name as platform_display_name,
          ugp.status,
          ugp.user_rating,
          ugp.is_favorite
         FROM games g
         INNER JOIN user_games ug ON g.id = ug.game_id
         LEFT JOIN platforms p ON ug.platform_id = p.id
         LEFT JOIN user_game_progress ugp ON g.id = ugp.game_id AND ug.platform_id = ugp.platform_id AND ugp.user_id = $1
         WHERE ug.user_id = $1 AND g.series_name = $2
         ORDER BY g.release_date ASC NULLS LAST, g.name ASC`,
        [user.id, decodeURIComponent(seriesName)]
      );

      return new Response(JSON.stringify({ series_name: seriesName, games }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    } catch (error) {
      console.error("Get series games error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }
  })
);

// Bulk add games to collection
router.post(
  "/api/collections/:id/games/bulk",
  requireAuth(async (req, user, params) => {
    try {
      const collectionId = params?.id;
      const body = (await req.json()) as { gameIds?: string[] };
      const { gameIds } = body;

      if (!collectionId) {
        return new Response(JSON.stringify({ error: "Collection ID is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        });
      }

      if (!gameIds || !Array.isArray(gameIds) || gameIds.length === 0) {
        return new Response(JSON.stringify({ error: "gameIds array is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        });
      }

      if (gameIds.length > 100) {
        return new Response(JSON.stringify({ error: "Cannot add more than 100 games at once" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        });
      }

      const collection = await queryOne(
        "SELECT 1 FROM collections WHERE id = $1 AND user_id = $2",
        [collectionId, user.id]
      );

      if (!collection) {
        return new Response(JSON.stringify({ error: "Collection not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        });
      }

      let addedCount = 0;
      for (const gameId of gameIds) {
        const result = await query(
          `INSERT INTO collection_games (collection_id, game_id)
           VALUES ($1, $2)
           ON CONFLICT (collection_id, game_id) DO NOTHING`,
          [collectionId, gameId]
        );
        if (result.rowCount && result.rowCount > 0) {
          addedCount++;
        }
      }

      return new Response(JSON.stringify({ success: true, addedCount }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    } catch (error) {
      console.error("Bulk add games to collection error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }
  })
);

// Upload/update collection cover
router.post(
  "/api/collections/:id/cover",
  requireAuth(async (req, user, params) => {
    try {
      const collectionId = params?.id;
      if (!collectionId) {
        return new Response(JSON.stringify({ error: "Collection ID is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        });
      }

      // Verify ownership
      const collection = await queryOne<{ id: string; cover_filename: string | null }>(
        "SELECT id, cover_filename FROM collections WHERE id = $1 AND user_id = $2",
        [collectionId, user.id]
      );

      if (!collection) {
        return new Response(JSON.stringify({ error: "Collection not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        });
      }

      // Parse form data
      const formData = await req.formData();
      const file = formData.get("cover") as File;

      if (!file) {
        return new Response(JSON.stringify({ error: "No file provided" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        });
      }

      // Validate file type
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
      if (!allowedTypes.includes(file.type)) {
        return new Response(
          JSON.stringify({ error: "Only JPG, PNG, WebP, and GIF images are supported" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders() } }
        );
      }

      // Validate file size (5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        return new Response(JSON.stringify({ error: "Image must be under 5MB" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        });
      }

      // Process image
      const sharp = (await import("sharp")).default;
      const buffer = Buffer.from(await file.arrayBuffer());

      const processedBuffer = await sharp(buffer)
        .resize(600, 900, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();

      // Generate filename
      const timestamp = Date.now();
      const filename = `${user.id}-${collectionId}-${timestamp}.webp`;

      // Save file
      const fs = await import("fs/promises");
      const path = await import("path");
      const coverDir = path.join(import.meta.dir, "../../uploads/collection-covers");

      // Ensure directory exists
      await fs.mkdir(coverDir, { recursive: true });

      const filePath = path.join(coverDir, filename);
      await fs.writeFile(filePath, processedBuffer);

      // Delete old cover if exists
      if (collection.cover_filename) {
        const oldPath = path.join(coverDir, collection.cover_filename);
        try {
          await fs.unlink(oldPath);
        } catch (err) {
          console.error("Failed to delete old cover:", err);
        }
      }

      // Update database
      await query("UPDATE collections SET cover_filename = $1 WHERE id = $2", [
        filename,
        collectionId,
      ]);

      return new Response(
        JSON.stringify({
          success: true,
          filename,
          url: `/api/collection-covers/${filename}`,
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders() } }
      );
    } catch (error) {
      console.error("Upload cover error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to upload cover image. Please try again." }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders() } }
      );
    }
  })
);

// Delete collection cover
router.delete(
  "/api/collections/:id/cover",
  requireAuth(async (req, user, params) => {
    try {
      const collectionId = params?.id;
      if (!collectionId) {
        return new Response(JSON.stringify({ error: "Collection ID is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        });
      }

      // Get collection
      const collection = await queryOne<{ cover_filename: string | null }>(
        "SELECT cover_filename FROM collections WHERE id = $1 AND user_id = $2",
        [collectionId, user.id]
      );

      if (!collection) {
        return new Response(JSON.stringify({ error: "Collection not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        });
      }

      // Delete file if exists
      if (collection.cover_filename) {
        const fs = await import("fs/promises");
        const path = await import("path");
        const coverPath = path.join(
          import.meta.dir,
          "../../uploads/collection-covers",
          collection.cover_filename
        );
        try {
          await fs.unlink(coverPath);
        } catch (err) {
          console.error("Failed to delete cover file:", err);
        }
      }

      // Update database
      await query("UPDATE collections SET cover_filename = NULL WHERE id = $1", [collectionId]);

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    } catch (error) {
      console.error("Delete cover error:", error);
      return new Response(JSON.stringify({ error: "Failed to remove cover" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }
  })
);

// Serve collection cover images (bypasses Vite dev server caching issues)
router.get("/api/collection-covers/:filename", async (req, params) => {
  try {
    const filename = params?.filename;
    if (!filename) {
      return new Response("Not found", { status: 404 });
    }

    // Sanitize filename to prevent path traversal
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "");
    if (sanitizedFilename !== filename) {
      return new Response("Invalid filename", { status: 400 });
    }

    const path = await import("path");
    const fs = await import("fs");
    const coverPath = path.join(
      import.meta.dir,
      "../../uploads/collection-covers",
      sanitizedFilename
    );

    // Check if file exists
    if (!fs.existsSync(coverPath)) {
      return new Response("Not found", { status: 404 });
    }

    const file = Bun.file(coverPath);
    return new Response(file, {
      headers: {
        "Content-Type": file.type || "image/webp",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        ...corsHeaders(),
      },
    });
  } catch (error) {
    console.error("Serve cover error:", error);
    return new Response("Internal server error", { status: 500 });
  }
});
