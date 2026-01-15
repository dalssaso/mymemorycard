import { OpenAPIHono, createRoute } from "@hono/zod-openapi"
import { injectable, inject } from "tsyringe"

import { ADMIN_SERVICE_TOKEN } from "@/container/tokens"
import { ErrorResponseSchema } from "@/features/auth/dtos/auth.dto"
import { createAuthMiddleware } from "@/infrastructure/http/middleware/auth.middleware"
import { Logger } from "@/infrastructure/logging/logger"

import {
  GetAdminSettingsResponseSchema,
  UpdateAdminSettingsRequestSchema,
} from "../dtos/admin.dto"
import { requireAdmin } from "../middleware/admin-auth.middleware"
import type { IAdminService } from "../services/admin.service.interface"
import type { UpdateAdminSettingsInput } from "../types"
import type { AdminEnv, IAdminController } from "./admin.controller.interface"

/**
 * Controller for admin endpoints
 */
@injectable()
export class AdminController implements IAdminController {
  readonly router: OpenAPIHono<AdminEnv>

  private logger: Logger

  constructor(
    @inject(ADMIN_SERVICE_TOKEN)
    private service: IAdminService,
    @inject(Logger) parentLogger: Logger
  ) {
    this.logger = parentLogger.child("AdminController")
    this.router = new OpenAPIHono<AdminEnv>()

    this.registerRoutes()
  }

  private registerRoutes(): void {
    const authMiddleware = createAuthMiddleware()
    const adminMiddleware = requireAdmin()

    // GET /settings - Get admin settings
    const getRoute = createRoute({
      method: "get",
      path: "/settings",
      tags: ["admin"],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          content: {
            "application/json": {
              schema: GetAdminSettingsResponseSchema,
            },
          },
          description: "Admin settings retrieved successfully",
        },
        401: {
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
          description: "Unauthorized - invalid or missing token",
        },
        403: {
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
          description: "Forbidden - admin access required",
        },
      },
    })

    this.router.use("/settings", authMiddleware)
    this.router.use("/settings", adminMiddleware)
    this.router.openapi(getRoute, async (c) => {
      this.logger.debug("GET /admin/settings")

      const settings = await this.service.getSettings()

      return c.json({ settings }, 200)
    })

    // PATCH /settings - Update admin settings
    const patchRoute = createRoute({
      method: "patch",
      path: "/settings",
      tags: ["admin"],
      security: [{ bearerAuth: [] }],
      request: {
        body: {
          content: {
            "application/json": {
              schema: UpdateAdminSettingsRequestSchema,
            },
          },
        },
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: GetAdminSettingsResponseSchema,
            },
          },
          description: "Admin settings updated successfully",
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
        403: {
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
          description: "Forbidden - admin access required",
        },
      },
    })

    this.router.openapi(patchRoute, async (c) => {
      this.logger.debug("PATCH /admin/settings")
      const body = c.req.valid("json")

      const input: UpdateAdminSettingsInput = {}

      if (body.analytics) {
        if (body.analytics.enabled !== undefined) {
          input.analyticsEnabled = body.analytics.enabled
        }
        if (body.analytics.provider !== undefined) {
          input.analyticsProvider = body.analytics.provider
        }
        if (body.analytics.key !== undefined) {
          input.analyticsKey = body.analytics.key
        }
        if (body.analytics.host !== undefined) {
          input.analyticsHost = body.analytics.host
        }
      }

      if (body.search) {
        if (body.search.server_side !== undefined) {
          input.searchServerSide = body.search.server_side
        }
        if (body.search.debounce_ms !== undefined) {
          input.searchDebounceMs = body.search.debounce_ms
        }
      }

      const settings = await this.service.updateSettings(input)

      return c.json({ settings }, 200)
    })
  }
}
