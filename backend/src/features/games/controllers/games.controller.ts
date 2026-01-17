import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { injectable, inject } from "tsyringe";
import { z } from "zod";

import {
  GAME_METADATA_SERVICE_TOKEN,
  GAME_REPOSITORY_TOKEN,
  USER_GAME_REPOSITORY_TOKEN,
} from "@/container/tokens";
import { ErrorResponseSchema } from "@/features/auth/dtos/auth.dto";
import { createAuthMiddleware } from "@/infrastructure/http/middleware/auth.middleware";
import { Logger } from "@/infrastructure/logging/logger";
import { NotFoundError } from "@/shared/errors/base";

import {
  GAME_SEARCH_REQUEST_SCHEMA,
  GAME_SEARCH_RESULTS_RESPONSE_SCHEMA,
  GAME_IMPORT_REQUEST_SCHEMA,
  GAME_UPDATE_REQUEST_SCHEMA,
  GAME_RESPONSE_SCHEMA,
  GAME_ID_PARAMS_SCHEMA,
  type GameSearchRequestDto,
  type GameImportRequestDto,
  type GameUpdateRequestDto,
  type GameIdParamsDto,
} from "../dtos/game.dto";
import {
  USER_GAME_CREATE_REQUEST_SCHEMA,
  USER_GAME_RESPONSE_SCHEMA,
  USER_GAME_LIST_RESPONSE_SCHEMA,
  USER_GAME_UPDATE_REQUEST_SCHEMA,
  USER_GAME_ID_PARAMS_SCHEMA,
  type UserGameCreateRequestDto,
  type UserGameUpdateRequestDto,
  type UserGameIdParamsDto,
} from "../dtos/user-game.dto";
import type { IGameMetadataService } from "../services/game-metadata.service.interface";
import type { IGameRepository } from "../repositories/game.repository.interface";
import type { IUserGameRepository } from "../repositories/user-game.repository.interface";
import type { GamesEnv, IGamesController } from "./games.controller.interface";

/**
 * Controller for games endpoints
 */
@injectable()
export class GamesController implements IGamesController {
  readonly router: OpenAPIHono<GamesEnv>;

  private logger: Logger;

  constructor(
    @inject(GAME_METADATA_SERVICE_TOKEN)
    private gameMetadataService: IGameMetadataService,
    @inject(GAME_REPOSITORY_TOKEN)
    private gameRepository: IGameRepository,
    @inject(USER_GAME_REPOSITORY_TOKEN)
    private userGameRepository: IUserGameRepository,
    @inject(Logger) parentLogger: Logger
  ) {
    this.logger = parentLogger.child("GamesController");
    this.router = new OpenAPIHono<GamesEnv>();

    this.registerRoutes();
  }

  private registerRoutes(): void {
    const authMiddleware = createAuthMiddleware();

    // POST /games/search - Search games on IGDB
    const searchRoute = createRoute({
      method: "post",
      path: "/search",
      tags: ["games"],
      security: [{ bearerAuth: [] }],
      request: {
        body: {
          content: {
            "application/json": {
              schema: GAME_SEARCH_REQUEST_SCHEMA,
            },
          },
        },
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: GAME_SEARCH_RESULTS_RESPONSE_SCHEMA,
            },
          },
          description: "Game search results returned successfully",
        },
        400: {
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
          description: "Validation error in search parameters",
        },
        401: {
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
          description: "Unauthorized - invalid or missing token",
        },
        422: {
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
          description: "IGDB credentials not configured for user",
        },
      },
    });

    this.router.use("/search", authMiddleware);
    this.router.openapi(searchRoute, async (c) => {
      this.logger.debug("POST /games/search");
      const body = c.req.valid("json") as GameSearchRequestDto;
      const userId = c.get("user").id;

      const results = await this.gameMetadataService.searchGames(body.query, userId, body.limit);

      return c.json({ results }, 200);
    });

    // GET /games/:id - Get game details
    const getGameRoute = createRoute({
      method: "get",
      path: "/:id",
      tags: ["games"],
      security: [{ bearerAuth: [] }],
      request: {
        params: GAME_ID_PARAMS_SCHEMA,
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: GAME_RESPONSE_SCHEMA,
            },
          },
          description: "Game details retrieved successfully",
        },
        400: {
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
          description: "Invalid game ID format",
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

    this.router.use("/:id", authMiddleware);
    this.router.openapi(getGameRoute, async (c) => {
      this.logger.debug("GET /games/:id");
      const params = c.req.valid("param") as GameIdParamsDto;

      const game = await this.gameRepository.findById(params.id);

      if (!game) {
        throw new NotFoundError("Game");
      }

      return c.json({ game }, 200);
    });

    // POST /games/:id/import - Import game to user library
    const importGameRoute = createRoute({
      method: "post",
      path: "/:id/import",
      tags: ["games"],
      security: [{ bearerAuth: [] }],
      request: {
        params: GAME_ID_PARAMS_SCHEMA,
        body: {
          content: {
            "application/json": {
              schema: GAME_IMPORT_REQUEST_SCHEMA,
            },
          },
        },
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: USER_GAME_RESPONSE_SCHEMA,
            },
          },
          description: "Game imported to user library successfully",
        },
        400: {
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
          description: "Invalid request parameters",
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
          description: "Platform or store not found",
        },
        422: {
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
          description: "IGDB credentials not configured for user",
        },
      },
    });

    this.router.use("/:id/import", authMiddleware);
    this.router.openapi(importGameRoute, async (c) => {
      this.logger.debug("POST /games/:id/import");
      const _params = c.req.valid("param") as GameIdParamsDto;
      const body = c.req.valid("json") as GameImportRequestDto;
      const userId = c.get("user").id;

      const userGame = await this.gameMetadataService.importGame(
        body.igdb_id,
        userId,
        body.platform_id,
        body.store_id
      );

      // Fetch with relations for response
      const userGameWithRelations = await this.userGameRepository.findByIdWithRelations(
        userGame.id
      );

      if (!userGameWithRelations) {
        throw new NotFoundError("User game");
      }

      return c.json(userGameWithRelations, 200);
    });

    // POST /games/:id/metadata - Update game metadata from IGDB
    const updateMetadataRoute = createRoute({
      method: "post",
      path: "/:id/metadata",
      tags: ["games"],
      security: [{ bearerAuth: [] }],
      request: {
        params: GAME_ID_PARAMS_SCHEMA,
        body: {
          content: {
            "application/json": {
              schema: GAME_UPDATE_REQUEST_SCHEMA,
            },
          },
        },
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: GAME_RESPONSE_SCHEMA,
            },
          },
          description: "Game metadata updated successfully",
        },
        400: {
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
          description: "Invalid request parameters",
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
        422: {
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
          description: "IGDB credentials not configured for user",
        },
      },
    });

    this.router.use("/:id/metadata", authMiddleware);
    this.router.openapi(updateMetadataRoute, async (c) => {
      this.logger.debug("POST /games/:id/metadata");
      const params = c.req.valid("param") as GameIdParamsDto;
      const _body = c.req.valid("json") as GameUpdateRequestDto;
      const userId = c.get("user").id;

      const game = await this.gameMetadataService.updateGameMetadata(params.id, userId);

      return c.json({ game }, 200);
    });

    // POST /user-games - Add game to user library
    const createUserGameRoute = createRoute({
      method: "post",
      path: "/user-games",
      tags: ["user-games"],
      security: [{ bearerAuth: [] }],
      request: {
        body: {
          content: {
            "application/json": {
              schema: USER_GAME_CREATE_REQUEST_SCHEMA,
            },
          },
        },
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: USER_GAME_RESPONSE_SCHEMA,
            },
          },
          description: "Game added to user library successfully",
        },
        400: {
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
          description: "Invalid request parameters",
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
          description: "Platform or store not found",
        },
      },
    });

    this.router.use("/user-games", authMiddleware);
    this.router.openapi(createUserGameRoute, async (c) => {
      this.logger.debug("POST /user-games");
      const body = c.req.valid("json") as UserGameCreateRequestDto;
      const userId = c.get("user").id;

      const userGame = await this.userGameRepository.create({
        user_id: userId,
        game_id: body.game_id,
        platform_id: body.platform_id,
        store_id: body.store_id,
      });

      // Fetch with relations for response
      const userGameWithRelations = await this.userGameRepository.findByIdWithRelations(
        userGame.id
      );

      if (!userGameWithRelations) {
        throw new NotFoundError("User game");
      }

      return c.json(userGameWithRelations, 200);
    });

    // GET /user-games - List user's games
    const listUserGamesRoute = createRoute({
      method: "get",
      path: "/user-games",
      tags: ["user-games"],
      security: [{ bearerAuth: [] }],
      request: {
        query: z
          .object({
            limit: z
              .string()
              .regex(/^\d+$/)
              .transform(Number)
              .refine((v) => v >= 1 && v <= 500, {
                message: "Limit must be between 1 and 500",
              })
              .optional()
              .default(() => 50),
            offset: z
              .string()
              .regex(/^\d+$/)
              .transform(Number)
              .refine((v) => v >= 0, { message: "Offset must be >= 0" })
              .optional()
              .default(() => 0),
          })
          .openapi("UserGameListQuery", {
            description: "Pagination parameters",
            example: { limit: "50", offset: "0" },
          }),
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: USER_GAME_LIST_RESPONSE_SCHEMA,
            },
          },
          description: "User games retrieved successfully",
        },
        400: {
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
          description: "Invalid pagination parameters",
        },
        401: {
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
          description: "Unauthorized - invalid or missing token",
        },
      },
    });

    this.router.use("/user-games", authMiddleware);
    this.router.openapi(listUserGamesRoute, async (c) => {
      this.logger.debug("GET /user-games");
      const query = c.req.valid("query") as {
        limit: number;
        offset: number;
      };
      const userId = c.get("user").id;

      const userGames = await this.userGameRepository.listByUserWithRelations(
        userId,
        query.offset,
        query.limit
      );

      return c.json({ user_games: userGames }, 200);
    });

    // GET /user-games/:id - Get user game entry
    const getUserGameRoute = createRoute({
      method: "get",
      path: "/user-games/:id",
      tags: ["user-games"],
      security: [{ bearerAuth: [] }],
      request: {
        params: USER_GAME_ID_PARAMS_SCHEMA,
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: USER_GAME_RESPONSE_SCHEMA,
            },
          },
          description: "User game entry retrieved successfully",
        },
        400: {
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
          description: "Invalid user game ID format",
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
          description: "User game entry not found",
        },
      },
    });

    this.router.use("/user-games/:id", authMiddleware);
    this.router.openapi(getUserGameRoute, async (c) => {
      this.logger.debug("GET /user-games/:id");
      const params = c.req.valid("param") as UserGameIdParamsDto;
      const userId = c.get("user").id;

      const userGame = await this.userGameRepository.findByIdWithRelations(params.id);

      if (!userGame || userGame.user_id !== userId) {
        throw new NotFoundError("User game");
      }

      return c.json(userGame, 200);
    });

    // PATCH /user-games/:id - Update user game
    const updateUserGameRoute = createRoute({
      method: "patch",
      path: "/user-games/:id",
      tags: ["user-games"],
      security: [{ bearerAuth: [] }],
      request: {
        params: USER_GAME_ID_PARAMS_SCHEMA,
        body: {
          content: {
            "application/json": {
              schema: USER_GAME_UPDATE_REQUEST_SCHEMA,
            },
          },
        },
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: USER_GAME_RESPONSE_SCHEMA,
            },
          },
          description: "User game updated successfully",
        },
        400: {
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
          description: "Invalid request parameters",
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
          description: "User game entry not found",
        },
        409: {
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
          description: "Conflict - operation failed due to data inconsistency",
        },
      },
    });

    this.router.use("/user-games/:id", authMiddleware);
    this.router.openapi(updateUserGameRoute, async (c) => {
      this.logger.debug("PATCH /user-games/:id");
      const params = c.req.valid("param") as UserGameIdParamsDto;
      const body = c.req.valid("json") as UserGameUpdateRequestDto;
      const userId = c.get("user").id;

      await this.userGameRepository.update(params.id, userId, {
        owned: body.owned,
        purchased_date: body.purchased_date ? new Date(body.purchased_date) : undefined,
      });

      // Fetch updated record with relations
      const userGame = await this.userGameRepository.findByIdWithRelations(params.id);

      if (!userGame) {
        throw new NotFoundError("User game");
      }

      return c.json(userGame, 200);
    });

    // DELETE /user-games/:id - Remove game from user library
    const deleteUserGameRoute = createRoute({
      method: "delete",
      path: "/user-games/:id",
      tags: ["user-games"],
      security: [{ bearerAuth: [] }],
      request: {
        params: USER_GAME_ID_PARAMS_SCHEMA,
      },
      responses: {
        204: {
          description: "User game entry deleted successfully",
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
          description: "User game entry not found",
        },
      },
    });

    this.router.use("/user-games/:id", authMiddleware);
    this.router.openapi(deleteUserGameRoute, async (c) => {
      this.logger.debug("DELETE /user-games/:id");
      const params = c.req.valid("param") as UserGameIdParamsDto;
      const userId = c.get("user").id;

      await this.userGameRepository.delete(params.id, userId);

      return c.body(null, 204);
    });
  }
}
