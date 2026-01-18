import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { inject, injectable } from "tsyringe";

import { ACHIEVEMENT_SERVICE_TOKEN } from "@/container/tokens";
import { ErrorResponseSchema } from "@/features/auth/dtos/auth.dto";
import { createAuthMiddleware } from "@/infrastructure/http/middleware/auth.middleware";
import { Logger } from "@/infrastructure/logging/logger";

import {
  ACHIEVEMENT_PROGRESS_SCHEMA,
  ACHIEVEMENT_RESPONSE_SCHEMA,
  ACHIEVEMENT_SYNC_REQUEST_SCHEMA,
  type AchievementSyncRequestDto,
} from "../dtos/achievement.dto";
import type { AchievementSourceApi } from "../repositories/achievement.repository.interface";
import type { IAchievementService } from "../services/achievement.service.interface";
import type { AchievementEnv, IAchievementController } from "./achievement.controller.interface";

/**
 * Controller for achievement endpoints.
 */
@injectable()
export class AchievementController implements IAchievementController {
  readonly router: OpenAPIHono<AchievementEnv>;

  private logger: Logger;

  constructor(
    @inject(ACHIEVEMENT_SERVICE_TOKEN)
    private achievementService: IAchievementService,
    @inject(Logger) parentLogger: Logger
  ) {
    this.logger = parentLogger.child("AchievementController");
    this.router = new OpenAPIHono<AchievementEnv>();

    this.registerRoutes();
  }

  private registerRoutes(): void {
    const authMiddleware = createAuthMiddleware();

    // Register auth middleware on ALL paths explicitly
    this.router.use("/:gameId", authMiddleware);
    this.router.use("/:gameId/sync", authMiddleware);
    this.router.use("/:gameId/progress", authMiddleware);

    // GET /:gameId - Get achievements for a game
    const getAchievementsRoute = createRoute({
      method: "get",
      path: "/:gameId",
      tags: ["achievements"],
      security: [{ bearerAuth: [] }],
      request: {
        params: GAME_ID_PARAM_SCHEMA,
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: ACHIEVEMENT_RESPONSE_SCHEMA,
            },
          },
          description: "Achievement list with source and stats",
        },
        401: {
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
          description: "Unauthorized - invalid or missing token",
        },
        404: {
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
          description: "Game not found",
        },
      },
    });

    this.router.openapi(getAchievementsRoute, async (c) => {
      const gameId = c.req.param("gameId");
      const userId = c.get("user").id;

      this.logger.debug("GET /achievements/:gameId", { gameId, userId });

      const response = await this.achievementService.getAchievements(userId, gameId);

      return c.json(response, 200);
    });

    // POST /:gameId/sync - Sync achievements from a source
    const syncAchievementsRoute = createRoute({
      method: "post",
      path: "/:gameId/sync",
      tags: ["achievements"],
      security: [{ bearerAuth: [] }],
      request: {
        params: GAME_ID_PARAM_SCHEMA,
        body: {
          content: {
            "application/json": {
              schema: ACHIEVEMENT_SYNC_REQUEST_SCHEMA,
            },
          },
        },
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: ACHIEVEMENT_RESPONSE_SCHEMA,
            },
          },
          description: "Achievements synced successfully",
        },
        400: {
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
          description: "Invalid request or sync not supported for source",
        },
        401: {
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
          description: "Unauthorized - invalid or missing token",
        },
        404: {
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
          description: "Game not found or credentials not linked",
        },
      },
    });

    this.router.openapi(syncAchievementsRoute, async (c) => {
      const gameId = c.req.param("gameId");
      const userId = c.get("user").id;
      const body = c.req.valid("json") as AchievementSyncRequestDto;

      // Validate that body game_id matches path gameId if provided
      if (body.game_id && body.game_id !== gameId) {
        this.logger.warn("Game ID mismatch between path and body", {
          pathGameId: gameId,
          bodyGameId: body.game_id,
        });
        return c.json({ error: "Game ID in request body does not match path parameter" }, 400);
      }

      this.logger.debug("POST /achievements/:gameId/sync", { gameId, userId, source: body.source });

      const response = await this.achievementService.syncAchievements(
        userId,
        gameId,
        body.source as AchievementSourceApi
      );

      return c.json(response, 200);
    });

    // GET /:gameId/progress - Get achievement progress
    const getProgressRoute = createRoute({
      method: "get",
      path: "/:gameId/progress",
      tags: ["achievements"],
      security: [{ bearerAuth: [] }],
      request: {
        params: GAME_ID_PARAM_SCHEMA,
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: ACHIEVEMENT_PROGRESS_SCHEMA,
            },
          },
          description: "Achievement progress summary",
        },
        401: {
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
          description: "Unauthorized - invalid or missing token",
        },
        404: {
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
          description: "Game not found",
        },
      },
    });

    this.router.openapi(getProgressRoute, async (c) => {
      const gameId = c.req.param("gameId");
      const userId = c.get("user").id;

      this.logger.debug("GET /achievements/:gameId/progress", { gameId, userId });

      const progress = await this.achievementService.getProgress(userId, gameId);

      return c.json(progress, 200);
    });
  }
}

import { z } from "zod";

/**
 * Schema for game ID path parameter
 */
const GAME_ID_PARAM_SCHEMA = z.object({
  gameId: z.string().uuid("Invalid game ID").openapi({
    description: "Game ID (UUID)",
    example: "550e8400-e29b-41d4-a716-446655440000",
  }),
});
