import { router } from "@/lib/router";
import { requireAuth } from "@/middleware/auth";
import { queryMany, query, queryOne } from "@/services/db";
import { corsHeaders } from "@/middleware/cors";

interface PlaySession {
  id: string;
  user_id: string;
  game_id: string;
  platform_id: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  notes: string | null;
  created_at: string;
}

interface PlaySessionWithGame extends PlaySession {
  game_name: string;
  platform_name: string;
}

// Get all sessions for a game
router.get(
  "/api/games/:gameId/sessions",
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
      const limit = parseInt(url.searchParams.get("limit") || "50");
      const offset = parseInt(url.searchParams.get("offset") || "0");
      const startDate = url.searchParams.get("startDate");
      const endDate = url.searchParams.get("endDate");

      let queryStr = `
        SELECT 
          ps.*,
          g.name as game_name,
          p.name as platform_name
        FROM play_sessions ps
        INNER JOIN games g ON ps.game_id = g.id
        INNER JOIN platforms p ON ps.platform_id = p.id
        WHERE ps.user_id = $1 AND ps.game_id = $2
      `;
      const queryParams: (string | number)[] = [user.id, gameId];

      if (startDate) {
        queryParams.push(startDate);
        queryStr += ` AND ps.started_at >= $${queryParams.length}`;
      }

      if (endDate) {
        queryParams.push(endDate);
        queryStr += ` AND ps.started_at <= $${queryParams.length}`;
      }

      queryStr += ` ORDER BY ps.started_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
      queryParams.push(limit, offset);

      const sessions = await queryMany<PlaySessionWithGame>(queryStr, queryParams);

      const totalResult = await queryOne<{ count: number }>(
        "SELECT COUNT(*) as count FROM play_sessions WHERE user_id = $1 AND game_id = $2",
        [user.id, gameId]
      );

      const totalMinutesResult = await queryOne<{ total: number }>(
        `SELECT COALESCE(SUM(duration_minutes), 0) as total 
         FROM play_sessions 
         WHERE user_id = $1 AND game_id = $2 AND duration_minutes IS NOT NULL`,
        [user.id, gameId]
      );

      return new Response(
        JSON.stringify({
          sessions,
          total: totalResult?.count || 0,
          totalMinutes: totalMinutesResult?.total || 0,
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders() } }
      );
    } catch (error) {
      console.error("Get sessions error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }
  })
);

// Create a new session (start or manual entry)
router.post(
  "/api/games/:gameId/sessions",
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
        platformId?: string;
        startedAt?: string;
        endedAt?: string | null;
        durationMinutes?: number | null;
        notes?: string | null;
      };

      const { platformId, startedAt, endedAt, durationMinutes, notes } = body;

      if (!platformId) {
        return new Response(JSON.stringify({ error: "Platform ID is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        });
      }

      if (!startedAt) {
        return new Response(JSON.stringify({ error: "startedAt is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        });
      }

      // Verify user owns this game on this platform
      const ownership = await queryOne<{ id: string }>(
        "SELECT id FROM user_games WHERE user_id = $1 AND game_id = $2 AND platform_id = $3",
        [user.id, gameId, platformId]
      );

      if (!ownership) {
        return new Response(JSON.stringify({ error: "Game not found in your library" }), {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        });
      }

      // Get progress status from user_game_progress table
      const progress = await queryOne<{ status: string }>(
        "SELECT status FROM user_game_progress WHERE user_id = $1 AND game_id = $2 AND platform_id = $3",
        [user.id, gameId, platformId]
      );

      // Auto-move game from backlog to playing when starting a session
      const currentStatus = progress?.status || "backlog";
      if (currentStatus === "backlog" && !endedAt) {
        await query(
          `INSERT INTO user_game_progress (user_id, game_id, platform_id, status, started_at)
           VALUES ($1, $2, $3, 'playing', NOW())
           ON CONFLICT (user_id, game_id, platform_id)
           DO UPDATE SET status = 'playing', started_at = COALESCE(user_game_progress.started_at, NOW())`,
          [user.id, gameId, platformId]
        );
      }

      // Check for existing active session on any game
      const activeSession = await queryOne<PlaySession>(
        "SELECT * FROM play_sessions WHERE user_id = $1 AND ended_at IS NULL",
        [user.id]
      );

      if (activeSession && !endedAt) {
        return new Response(
          JSON.stringify({
            error: "You already have an active session",
            activeSession,
          }),
          { status: 409, headers: { "Content-Type": "application/json", ...corsHeaders() } }
        );
      }

      // Calculate duration if endedAt is provided but durationMinutes is not
      let calculatedDuration = durationMinutes;
      if (endedAt && !durationMinutes) {
        const startTime = new Date(startedAt).getTime();
        const endTime = new Date(endedAt).getTime();
        calculatedDuration = Math.round((endTime - startTime) / 60000);
      }

      const session = await queryOne<PlaySession>(
        `INSERT INTO play_sessions (user_id, game_id, platform_id, started_at, ended_at, duration_minutes, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          user.id,
          gameId,
          platformId,
          startedAt,
          endedAt || null,
          calculatedDuration || null,
          notes || null,
        ]
      );

      // If this is a completed session (has endedAt), update user_playtime
      if (endedAt) {
        const duration = calculatedDuration || 0;
        await query(
          `INSERT INTO user_playtime (user_id, game_id, platform_id, total_minutes, last_played)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (user_id, game_id, platform_id)
           DO UPDATE SET 
             total_minutes = user_playtime.total_minutes + $4,
             last_played = $5`,
          [user.id, gameId, platformId, duration, endedAt]
        );
      }

      return new Response(JSON.stringify({ session }), {
        status: 201,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    } catch (error) {
      console.error("Create session error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }
  })
);

// Update a session (end session, update notes, etc.)
router.patch(
  "/api/games/:gameId/sessions/:sessionId",
  requireAuth(async (req, user, params) => {
    try {
      const gameId = params?.gameId;
      const sessionId = params?.sessionId;

      if (!gameId || !sessionId) {
        return new Response(JSON.stringify({ error: "Game ID and Session ID are required" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        });
      }

      // Verify session belongs to user
      const existingSession = await queryOne<PlaySession>(
        "SELECT * FROM play_sessions WHERE id = $1 AND user_id = $2 AND game_id = $3",
        [sessionId, user.id, gameId]
      );

      if (!existingSession) {
        return new Response(JSON.stringify({ error: "Session not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        });
      }

      const body = (await req.json()) as {
        startedAt?: string;
        endedAt?: string | null;
        durationMinutes?: number | null;
        notes?: string | null;
      };

      const { startedAt, endedAt, durationMinutes, notes } = body;

      // Determine the effective start and end times
      const effectiveStartedAt = startedAt || existingSession.started_at;
      const effectiveEndedAt = endedAt !== undefined ? endedAt : existingSession.ended_at;

      // Calculate duration if we have both start and end times
      let calculatedDuration = durationMinutes;
      if (effectiveEndedAt && !durationMinutes) {
        const startTime = new Date(effectiveStartedAt).getTime();
        const endTime = new Date(effectiveEndedAt).getTime();
        calculatedDuration = Math.round((endTime - startTime) / 60000);
      }

      const session = await queryOne<PlaySession>(
        `UPDATE play_sessions 
         SET 
           started_at = COALESCE($1, started_at),
           ended_at = COALESCE($2, ended_at),
           duration_minutes = COALESCE($3, duration_minutes),
           notes = COALESCE($4, notes)
         WHERE id = $5 AND user_id = $6
         RETURNING *`,
        [startedAt || null, endedAt || null, calculatedDuration || null, notes, sessionId, user.id]
      );

      // Recalculate user_playtime if duration changed on a completed session
      const oldDuration = existingSession.duration_minutes || 0;
      const newDuration = session?.duration_minutes || 0;
      const durationChanged = oldDuration !== newDuration;
      const sessionIsCompleted = session?.ended_at !== null;

      if (sessionIsCompleted && (durationChanged || (endedAt && !existingSession.ended_at))) {
        // Recalculate total playtime from all sessions for this game/platform
        const totals = await queryOne<{ total: number; last: string | null }>(
          `SELECT 
             COALESCE(SUM(duration_minutes), 0) as total,
             MAX(ended_at) as last
           FROM play_sessions
           WHERE user_id = $1 AND game_id = $2 AND platform_id = $3 AND ended_at IS NOT NULL`,
          [user.id, gameId, existingSession.platform_id]
        );

        await query(
          `INSERT INTO user_playtime (user_id, game_id, platform_id, total_minutes, last_played)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (user_id, game_id, platform_id)
           DO UPDATE SET 
             total_minutes = $4,
             last_played = $5`,
          [user.id, gameId, existingSession.platform_id, totals?.total || 0, totals?.last]
        );
      }

      return new Response(JSON.stringify({ session }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    } catch (error) {
      console.error("Update session error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }
  })
);

// Delete a session
router.delete(
  "/api/games/:gameId/sessions/:sessionId",
  requireAuth(async (req, user, params) => {
    try {
      const gameId = params?.gameId;
      const sessionId = params?.sessionId;

      if (!gameId || !sessionId) {
        return new Response(JSON.stringify({ error: "Game ID and Session ID are required" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        });
      }

      // Get session before deleting to update playtime
      const existingSession = await queryOne<PlaySession>(
        "SELECT * FROM play_sessions WHERE id = $1 AND user_id = $2 AND game_id = $3",
        [sessionId, user.id, gameId]
      );

      if (!existingSession) {
        return new Response(JSON.stringify({ error: "Session not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        });
      }

      await query("DELETE FROM play_sessions WHERE id = $1 AND user_id = $2", [sessionId, user.id]);

      // Recalculate user_playtime from remaining sessions
      if (existingSession.ended_at) {
        const totals = await queryOne<{ total: number; last: string | null }>(
          `SELECT 
             COALESCE(SUM(duration_minutes), 0) as total,
             MAX(ended_at) as last
           FROM play_sessions
           WHERE user_id = $1 AND game_id = $2 AND platform_id = $3 AND ended_at IS NOT NULL`,
          [user.id, gameId, existingSession.platform_id]
        );

        if (totals && (totals.total > 0 || totals.last)) {
          await query(
            `INSERT INTO user_playtime (user_id, game_id, platform_id, total_minutes, last_played)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (user_id, game_id, platform_id)
             DO UPDATE SET 
               total_minutes = $4,
               last_played = $5`,
            [user.id, gameId, existingSession.platform_id, totals.total, totals.last]
          );
        } else {
          // No more sessions, delete user_playtime record
          await query(
            "DELETE FROM user_playtime WHERE user_id = $1 AND game_id = $2 AND platform_id = $3",
            [user.id, gameId, existingSession.platform_id]
          );
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    } catch (error) {
      console.error("Delete session error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }
  })
);

// Get currently active session (across all games)
router.get(
  "/api/sessions/active",
  requireAuth(async (req, user) => {
    try {
      const activeSession = await queryOne<PlaySessionWithGame>(
        `SELECT 
          ps.*,
          g.name as game_name,
          p.name as platform_name
        FROM play_sessions ps
        INNER JOIN games g ON ps.game_id = g.id
        INNER JOIN platforms p ON ps.platform_id = p.id
        WHERE ps.user_id = $1 AND ps.ended_at IS NULL
        ORDER BY ps.started_at DESC
        LIMIT 1`,
        [user.id]
      );

      return new Response(JSON.stringify({ session: activeSession }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    } catch (error) {
      console.error("Get active session error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }
  })
);
