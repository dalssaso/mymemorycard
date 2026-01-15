import { injectable, inject } from "tsyringe"
import { OpenAPIHono, createRoute } from "@hono/zod-openapi"

import { PREFERENCES_SERVICE_TOKEN } from "@/container/tokens"
import { Logger } from "@/infrastructure/logging/logger"
import { createAuthMiddleware } from "@/infrastructure/http/middleware/auth.middleware"
import { ErrorResponseSchema } from "@/features/auth/dtos/auth.dto"
import type { IPreferencesService } from "../services/preferences.service.interface"
import type {
  IPreferencesController,
  PreferencesEnv,
} from "./preferences.controller.interface"
import {
  GetPreferencesResponseSchema,
  UpdatePreferencesRequestSchema,
} from "../dtos/preferences.dto"
import type { UpdatePreferencesInput } from "../types"

/**
 * Controller for preferences endpoints
 */
@injectable()
export class PreferencesController implements IPreferencesController {
  readonly router: OpenAPIHono<PreferencesEnv>

  constructor(
    @inject(PREFERENCES_SERVICE_TOKEN)
    private service: IPreferencesService,
    @inject(Logger) private logger: Logger
  ) {
    this.logger = logger.child("PreferencesController")
    this.router = new OpenAPIHono<PreferencesEnv>()

    this.registerRoutes()
  }

  private registerRoutes(): void {
    const authMiddleware = createAuthMiddleware()

    // GET /preferences - Get user preferences
    const getRoute = createRoute({
      method: "get",
      path: "/",
      tags: ["preferences"],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          content: {
            "application/json": {
              schema: GetPreferencesResponseSchema,
            },
          },
          description: "User preferences retrieved successfully",
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

    this.router.use("/", authMiddleware)
    this.router.openapi(getRoute, async (c) => {
      this.logger.debug("GET /preferences")
      const user = c.get("user")

      const preferences = await this.service.getPreferences(user.id)

      return c.json({ preferences }, 200)
    })

    // PATCH /preferences - Update user preferences
    const patchRoute = createRoute({
      method: "patch",
      path: "/",
      tags: ["preferences"],
      security: [{ bearerAuth: [] }],
      request: {
        body: {
          content: {
            "application/json": {
              schema: UpdatePreferencesRequestSchema,
            },
          },
        },
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: GetPreferencesResponseSchema,
            },
          },
          description: "Preferences updated successfully",
        },
        400: {
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
          description: "Validation error",
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

    this.router.openapi(patchRoute, async (c) => {
      this.logger.debug("PATCH /preferences")
      const user = c.get("user")
      const body = c.req.valid("json")

      const input: UpdatePreferencesInput = {
        defaultView: body.default_view,
        itemsPerPage: body.items_per_page,
        theme: body.theme,
      }

      const preferences = await this.service.updatePreferences(user.id, input)

      return c.json({ preferences }, 200)
    })
  }
}
