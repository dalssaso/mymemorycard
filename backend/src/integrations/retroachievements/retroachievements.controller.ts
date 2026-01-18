import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { inject, injectable } from "tsyringe";

import { RETROACHIEVEMENTS_SERVICE_TOKEN } from "@/container/tokens";
import { ErrorResponseSchema } from "@/features/auth/dtos/auth.dto";
import { createAuthMiddleware } from "@/infrastructure/http/middleware/auth.middleware";
import { Logger } from "@/infrastructure/logging/logger";

import {
  RA_CREDENTIALS_REQUEST_SCHEMA,
  RA_VALIDATE_RESPONSE_SCHEMA,
  RA_SYNC_REQUEST_SCHEMA,
  RA_SYNC_RESPONSE_SCHEMA,
  type RACredentialsRequestDto,
  type RASyncRequestDto,
} from "./retroachievements.dto";
import type { IRetroAchievementsService } from "./retroachievements.service.interface";
import type { IRetroAchievementsController, RAEnv } from "./retroachievements.controller.interface";

/**
 * Controller for RetroAchievements integration endpoints
 */
@injectable()
export class RetroAchievementsController implements IRetroAchievementsController {
  readonly router: OpenAPIHono<RAEnv>;

  private logger: Logger;

  constructor(
    @inject(RETROACHIEVEMENTS_SERVICE_TOKEN)
    private raService: IRetroAchievementsService,
    @inject(Logger) parentLogger: Logger
  ) {
    this.logger = parentLogger.child("RetroAchievementsController");
    this.router = new OpenAPIHono<RAEnv>();

    this.registerRoutes();
  }

  private registerRoutes(): void {
    const authMiddleware = createAuthMiddleware();

    // Register auth middleware on ALL paths explicitly
    this.router.use("/", authMiddleware);
    this.router.use("/credentials", authMiddleware);
    this.router.use("/validate", authMiddleware);
    this.router.use("/sync", authMiddleware);

    // POST /credentials - Save credentials
    const credentialsRoute = createRoute({
      method: "post",
      path: "/credentials",
      tags: ["retroachievements"],
      security: [{ bearerAuth: [] }],
      request: {
        body: {
          content: {
            "application/json": {
              schema: RA_CREDENTIALS_REQUEST_SCHEMA,
            },
          },
        },
      },
      responses: {
        201: {
          content: {
            "application/json": {
              schema: RA_VALIDATE_RESPONSE_SCHEMA,
            },
          },
          description: "Credentials saved and validated successfully",
        },
        400: {
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
          description: "Invalid credentials",
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

    this.router.openapi(credentialsRoute, async (c) => {
      this.logger.debug("POST /retroachievements/credentials");

      const userId = c.get("user").id;
      const body = c.req.valid("json") as RACredentialsRequestDto;

      // Validate credentials first
      const isValid = await this.raService.validateCredentials({
        username: body.username,
        api_key: body.api_key,
      });

      if (!isValid) {
        return c.json(
          {
            error: "Invalid RetroAchievements credentials",
            code: "INVALID_CREDENTIALS",
          },
          400
        );
      }

      // Save valid credentials
      await this.raService.saveCredentials(userId, {
        username: body.username,
        api_key: body.api_key,
      });

      return c.json(
        {
          is_valid: true,
          message: "Credentials saved successfully",
        },
        201
      );
    });

    // POST /validate - Validate credentials without saving
    const validateRoute = createRoute({
      method: "post",
      path: "/validate",
      tags: ["retroachievements"],
      security: [{ bearerAuth: [] }],
      request: {
        body: {
          content: {
            "application/json": {
              schema: RA_CREDENTIALS_REQUEST_SCHEMA,
            },
          },
        },
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: RA_VALIDATE_RESPONSE_SCHEMA,
            },
          },
          description: "Validation result",
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

    this.router.openapi(validateRoute, async (c) => {
      this.logger.debug("POST /retroachievements/validate");

      const body = c.req.valid("json") as RACredentialsRequestDto;

      const isValid = await this.raService.validateCredentials({
        username: body.username,
        api_key: body.api_key,
      });

      return c.json(
        {
          is_valid: isValid,
          message: isValid ? "Credentials are valid" : "Invalid credentials",
        },
        200
      );
    });

    // POST /sync - Sync achievements for a game
    const syncRoute = createRoute({
      method: "post",
      path: "/sync",
      tags: ["retroachievements"],
      security: [{ bearerAuth: [] }],
      request: {
        body: {
          content: {
            "application/json": {
              schema: RA_SYNC_REQUEST_SCHEMA,
            },
          },
        },
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: RA_SYNC_RESPONSE_SCHEMA,
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
          description: "Invalid request or game has no RetroAchievements ID",
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
          description: "Game or credentials not found",
        },
        422: {
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
          description: "RetroAchievements credentials not linked",
        },
      },
    });

    this.router.openapi(syncRoute, async (c) => {
      this.logger.debug("POST /retroachievements/sync");

      const userId = c.get("user").id;
      const body = c.req.valid("json") as RASyncRequestDto;

      const result = await this.raService.syncAchievements(userId, body.game_id);

      return c.json(
        {
          synced: result.synced,
          unlocked: result.unlocked,
          total: result.total,
        },
        200
      );
    });
  }
}
