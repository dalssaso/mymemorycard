import { OpenAPIHono, createRoute } from "@hono/zod-openapi"
import { injectable, inject } from "tsyringe"

import { STEAM_SERVICE_TOKEN } from "@/container/tokens"
import { ErrorResponseSchema } from "@/features/auth/dtos/auth.dto"
import { createAuthMiddleware } from "@/infrastructure/http/middleware/auth.middleware"
import { Logger } from "@/infrastructure/logging/logger"

import {
  STEAM_CONNECT_RESPONSE_SCHEMA,
  STEAM_CALLBACK_RESPONSE_SCHEMA,
  STEAM_LIBRARY_IMPORT_RESPONSE_SCHEMA,
  STEAM_SYNC_REQUEST_SCHEMA,
  STEAM_SYNC_RESPONSE_SCHEMA,
  type SteamSyncRequestDto,
} from "./steam.dto"
import type { ISteamService } from "./steam.service.interface"
import type { ISteamController, SteamEnv } from "./steam.controller.interface"

/**
 * Controller for Steam integration endpoints
 */
@injectable()
export class SteamController implements ISteamController {
  readonly router: OpenAPIHono<SteamEnv>

  private logger: Logger

  constructor(
    @inject(STEAM_SERVICE_TOKEN)
    private steamService: ISteamService,
    @inject(Logger) parentLogger: Logger
  ) {
    this.logger = parentLogger.child("SteamController")
    this.router = new OpenAPIHono<SteamEnv>()

    this.registerRoutes()
  }

  private registerRoutes(): void {
    const authMiddleware = createAuthMiddleware()

    // Register auth middleware on ALL paths explicitly
    this.router.use("/", authMiddleware)
    this.router.use("/connect", authMiddleware)
    this.router.use("/callback", authMiddleware)
    this.router.use("/library", authMiddleware)
    this.router.use("/sync", authMiddleware)

    // GET /connect - Get Steam OpenID login URL
    const connectRoute = createRoute({
      method: "get",
      path: "/connect",
      tags: ["steam"],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          content: {
            "application/json": {
              schema: STEAM_CONNECT_RESPONSE_SCHEMA,
            },
          },
          description: "Steam OpenID login URL returned successfully",
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
    })

    this.router.openapi(connectRoute, (c) => {
      this.logger.debug("GET /steam/connect")

      // Build return URL based on request using URL parsing
      const requestUrl = new URL(c.req.url)
      requestUrl.pathname = requestUrl.pathname.replace(/\/connect$/, "/callback")
      const returnUrl = requestUrl.toString()
      const redirectUrl = this.steamService.getLoginUrl(returnUrl)

      return c.json({ redirect_url: redirectUrl }, 200)
    })

    // GET /callback - Handle Steam OpenID callback
    const callbackRoute = createRoute({
      method: "get",
      path: "/callback",
      tags: ["steam"],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          content: {
            "application/json": {
              schema: STEAM_CALLBACK_RESPONSE_SCHEMA,
            },
          },
          description: "Steam account linked successfully",
        },
        400: {
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
          description: "Invalid OpenID callback parameters",
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
    })

    this.router.openapi(callbackRoute, async (c) => {
      this.logger.debug("GET /steam/callback")

      const userId = c.get("user").id

      // Get all query parameters for OpenID validation
      const params: Record<string, string> = { ...c.req.query() }

      // Validate OpenID response
      const steamId = await this.steamService.validateCallback(params)

      if (!steamId) {
        return c.json(
          {
            status: "failed" as const,
          },
          200
        )
      }

      // Link account and get player info
      const credentials = await this.steamService.linkAccount(userId, steamId)

      return c.json(
        {
          status: "linked" as const,
          steam_id: credentials.steam_id,
          display_name: credentials.display_name,
          avatar_url: credentials.avatar_url,
        },
        200
      )
    })

    // GET /library - Import Steam library
    const libraryRoute = createRoute({
      method: "get",
      path: "/library",
      tags: ["steam"],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          content: {
            "application/json": {
              schema: STEAM_LIBRARY_IMPORT_RESPONSE_SCHEMA,
            },
          },
          description: "Steam library imported successfully",
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
          description: "Steam account not linked",
        },
      },
    })

    this.router.openapi(libraryRoute, async (c) => {
      this.logger.debug("GET /steam/library")

      const userId = c.get("user").id
      const result = await this.steamService.importLibrary(userId)

      return c.json(
        {
          imported: result.imported,
          skipped: result.skipped,
          errors: result.errors,
        },
        200
      )
    })

    // POST /sync - Sync achievements for a game
    const syncRoute = createRoute({
      method: "post",
      path: "/sync",
      tags: ["steam"],
      security: [{ bearerAuth: [] }],
      request: {
        body: {
          content: {
            "application/json": {
              schema: STEAM_SYNC_REQUEST_SCHEMA,
            },
          },
        },
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: STEAM_SYNC_RESPONSE_SCHEMA,
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
          description: "Game not found or not a Steam game",
        },
        422: {
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
          description: "Steam account not linked",
        },
      },
    })

    this.router.openapi(syncRoute, async (c) => {
      this.logger.debug("POST /steam/sync")

      const userId = c.get("user").id
      const body = c.req.valid("json") as SteamSyncRequestDto

      const result = await this.steamService.syncAchievements(userId, body.game_id)

      return c.json(
        {
          synced: result.synced,
          unlocked: result.unlocked,
          total: result.total,
        },
        200
      )
    })
  }
}
